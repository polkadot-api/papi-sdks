import { Enum, type SS58String } from "polkadot-api"
import type { XcmApi } from "./xcm-sdk"
import { unwrap } from "./utils"
import type { Result } from "@polkadot-api/common-sdk-utils"
import type { relay, XcmVersionedAssets, XcmVersionedXcm } from "./descriptors"
import {
  filterV2,
  Location,
  locationsAreEq,
  routeRelative,
} from "./utils/location"

const xcmFeeStep = async (
  message: XcmVersionedXcm & { type: "V4" },
  steps: Array<[string, Location, Promise<XcmApi>]>,
  token: Location,
  sender: SS58String,
) => {
  let [, prevLoc, promPrevApi] = steps[0]
  let { api: prevApi, pallet: prevPallet } = (await promPrevApi) as XcmApi & {
    pallet: "XcmPallet"
  }
  const localWeight = unwrap(
    (await prevApi.apis.XcmPaymentApi.query_xcm_weight(message)) as Result<{
      ref_time: bigint
      proof_size: bigint
    }>,
  )
  let nextMsg = await unwrap(
    prevApi.apis.DryRunApi.dry_run_call(
      Enum("system", Enum("Signed", sender)),
      prevApi.tx[prevPallet].execute({
        message: message,
        max_weight: localWeight,
      }).decodedCall,
    ) as Promise<
      Result<
        ((typeof relay)["descriptors"]["apis"]["DryRunApi"]["dry_run_call"][1] & {
          success: true
        })["value"]
      >
    >,
  ).then(({ execution_result, forwarded_xcms }) => {
    if (!execution_result.success) {
      throw new Error(`Execution failed at ${steps[0][0]}`)
    }
    const nextLoc = routeRelative(prevLoc, steps[1][1])
    const forwarded = forwarded_xcms.find(([x]) =>
      locationsAreEq(nextLoc, filterV2(x).value),
    )
    if (!forwarded || forwarded[1].length !== 1)
      throw new Error(`Found no or more than 1 msg ${forwarded}`)
    return forwarded[1][0]
  })

  const deliveryFees: bigint[] = []
  const remoteFees: bigint[] = []
  for (let i = 1; i < steps.length; i++) {
    const [, nextLoc, promNextApi] = steps[i]
    const msg = nextMsg
    const deliveryFee = unwrap(
      prevApi.apis.XcmPaymentApi.query_delivery_fees(
        Enum("V4", routeRelative(prevLoc, nextLoc)),
        msg,
      ) as Promise<Result<XcmVersionedAssets>>,
    ).then((fees) => {
      if (fees.value.length !== 1 || fees.value[0].fun.type !== "Fungible")
        throw new Error("Unexpected delivery fee")
      deliveryFees.push(fees.value[0].fun.value)
    })
    const remoteFee = promNextApi.then(({ api }) =>
      unwrap(
        api.apis.XcmPaymentApi.query_xcm_weight(msg) as Promise<
          Result<{
            ref_time: bigint
            proof_size: bigint
          }>
        >,
      ).then((weight) =>
        unwrap(
          api.apis.XcmPaymentApi.query_weight_to_asset_fee(
            weight,
            Enum("V4", routeRelative(nextLoc, token)),
          ) as Promise<Result<bigint>>,
        ).then((fee) => remoteFees.push(fee)),
      ),
    )
    // we don't have to create a new message at the last step
    const nextMsgProm =
      i < steps.length - 1
        ? promNextApi.then(({ api }) =>
            unwrap(
              api.apis.DryRunApi.dry_run_xcm(
                Enum("V4", routeRelative(nextLoc, prevLoc)),
                msg,
              ) as Promise<
                Result<
                  ((typeof relay)["descriptors"]["apis"]["DryRunApi"]["dry_run_xcm"][1] & {
                    success: true
                  })["value"]
                >
              >,
            ).then(({ execution_result, forwarded_xcms }) => {
              if (execution_result.type !== "Complete") {
                throw new Error(`Execution failed at ${steps[0][0]}`)
              }
              const forwarded = forwarded_xcms.find(([x]) =>
                locationsAreEq(
                  routeRelative(nextLoc, steps[i + 1][1]),
                  filterV2(x).value,
                ),
              )
              if (!forwarded || forwarded[1].length !== 1)
                throw new Error(`Found no or more than 1 msg ${forwarded}`)
              nextMsg = forwarded[1][0]
            }),
          )
        : Promise.resolve()
    await Promise.all([deliveryFee, remoteFee, nextMsgProm])
  }
  return { localWeight, deliveryFees, remoteFees }
}

export const calculateXcmFees = async (
  messageFn: (
    remoteFeeHint?: bigint[],
    deliveryFees?: bigint[],
  ) => XcmVersionedXcm & { type: "V4" },
  _steps: Array<[string, Location]>,
  token: Location,
  getApi: (id: string) => Promise<XcmApi>,
  sender: SS58String,
) => {
  const steps = _steps.map(
    ([id, loc]) =>
      [id, loc, getApi(id)] satisfies [string, Location, Promise<XcmApi>],
  )
  // we calculate twice the fees to ensure the message length is right
  // TODO:investigate if it is interesting to run the calculations more than twice
  const { remoteFees, deliveryFees } = await xcmFeeStep(
    messageFn(),
    steps,
    token,
    sender,
  )
  return await xcmFeeStep(
    messageFn(remoteFees, deliveryFees),
    steps,
    token,
    sender,
  )
}
