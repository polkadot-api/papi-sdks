import {
  relay,
  XcmV4Instruction,
  type XcmVersionedAssets,
  XcmVersionedXcm,
} from "@/descriptors"
import {
  wrapAsyncTx,
  type AsyncTransaction,
  type Result,
} from "@polkadot-api/common-sdk-utils"
import { Enum, type SS58String } from "polkadot-api"
import { unwrap } from "./utils"
import {
  accId32ToLocation,
  filterV2,
  type Location,
  locationsAreEq,
  routeRelative,
} from "./utils/location"
import { XcmApi } from "./xcm-sdk"
import { XcmVersionedAssetId } from "./innerDescriptors"

export const createTeleport = (
  originId: string,
  originLocation: Location,
  destId: string,
  destLocation: Location,
  token: Location,
  getApi: (id: string) => Promise<XcmApi>,
  amount: bigint,
  beneficiary: SS58String,
) => {
  // TODO: check compatibility with V3
  // we might need to tweak instructions
  const msg = (remoteFee: bigint = 0n) =>
    XcmVersionedXcm.V4([
      // this one will make delivery fees for first hop withdraw from the origin
      // NOTE: investigate getting the fees with withdraw asset
      XcmV4Instruction.SetFeesMode({ jit_withdraw: true }),
      XcmV4Instruction.WithdrawAsset([
        {
          id: routeRelative(originLocation, token),
          fun: Enum("Fungible", amount + remoteFee),
        },
      ]),
      XcmV4Instruction.InitiateTeleport({
        // AllCounted helps estimate the fees better
        // it is actuallly the same as `All` under the hood
        assets: Enum("Wild", Enum("AllCounted", 1)),
        xcm: [
          Enum("BuyExecution", {
            fees: {
              id: routeRelative(destLocation, token),
              fun: Enum("Fungible", remoteFee ? remoteFee : amount / 2n),
            },
            weight_limit: Enum("Unlimited"),
          }),
          XcmV4Instruction.DepositAsset({
            assets: Enum("Wild", Enum("AllCounted", 1)),
            beneficiary: accId32ToLocation(beneficiary),
          }),
        ],
        dest: routeRelative(originLocation, destLocation),
      }),
    ])

  const calculateXcmFees = async (
    sender: SS58String,
    remoteFeeHint?: bigint,
  ) => {
    const message = msg(remoteFeeHint)
    const destApi = getApi(destId)
    const { api: originApi, pallet: originPallet } = (await getApi(
      originId,
    )) as XcmApi & { pallet: "XcmPallet" }
    const localWeight = await unwrap(
      originApi.apis.XcmPaymentApi.query_xcm_weight(message) as Promise<
        Result<{
          ref_time: bigint
          proof_size: bigint
        }>
      >,
    )
    const dryRun = unwrap(
      (await originApi.apis.DryRunApi.dry_run_call(
        Enum("system", Enum("Signed", sender)),
        originApi.tx[originPallet].execute({
          message: message,
          max_weight: localWeight,
        }).decodedCall,
      )) as Result<
        ((typeof relay)["descriptors"]["apis"]["DryRunApi"]["dry_run_call"][1] & {
          success: true
        })["value"]
      >,
    )
    const destFromOrigin = routeRelative(originLocation, destLocation)
    const forwarded = dryRun.forwarded_xcms.find(([x]) =>
      locationsAreEq(destFromOrigin, filterV2(x).value),
    )
    if (!forwarded || forwarded[1].length !== 1)
      throw new Error(`Found no or more than 1 msg ${forwarded}`)
    const deliveryFee = unwrap(
      originApi.apis.XcmPaymentApi.query_delivery_fees(
        forwarded[0],
        forwarded[1][0],
      ) as Promise<Result<XcmVersionedAssets>>,
    ).then((fees) => {
      if (fees.value.length !== 1 || fees.value[0].fun.type !== "Fungible")
        throw new Error("Unexpected delivery fee")
      return fees.value[0].fun.value
    })

    const remoteFee = destApi.then(({ api }) =>
      unwrap(
        api.apis.XcmPaymentApi.query_xcm_weight(forwarded[1][0]) as Promise<
          Result<{
            ref_time: bigint
            proof_size: bigint
          }>
        >,
      ).then((weight) =>
        unwrap(
          api.apis.XcmPaymentApi.query_weight_to_asset_fee(
            weight,
            Enum("V4", routeRelative(destLocation, token)),
          ) as Promise<Result<bigint>>,
        ),
      ),
    )
    return Promise.all([deliveryFee, remoteFee]).then(
      ([deliveryFee, remoteFee]) => ({ localWeight, deliveryFee, remoteFee }),
    )
  }

  const getEstimatedFees = async (sender: SS58String) => {
    // we ensure the asset is accepted in both chains
    const [origin, dest] = await Promise.all(
      [getApi(originId), getApi(destId)].map(async (prom, idx) => {
        const { api } = await prom
        const accepted = await unwrap(
          api.apis.XcmPaymentApi.query_acceptable_payment_assets(4) as Promise<
            Result<Array<XcmVersionedAssetId & { type: "V4" }>>
          >,
        )
        const tok = routeRelative(idx ? destLocation : originLocation, token)
        return accepted.some(({ value }) => locationsAreEq(tok, value))
      }),
    )
    const err = "Asset is not accepted as fee in "
    if (!origin) throw new Error(err + "origin")
    if (!dest) throw new Error(err + "dest")

    // we calculate twice the fees to ensure the message length is right
    const { localWeight, remoteFee, deliveryFee } = await calculateXcmFees(
      sender,
      (await calculateXcmFees(sender)).remoteFee,
    )
    const { api, pallet } = (await getApi(originId)) as XcmApi & {
      pallet: "XcmPallet"
    }
    const localFee = await api.tx[pallet]
      .execute({
        message: msg(remoteFee),
        max_weight: localWeight,
      })
      .getEstimatedFees(sender)
    return { localWeight, localFee, remoteFee, deliveryFee }
  }
  const createTx = (sender: SS58String): AsyncTransaction<any, any, any, any> =>
    wrapAsyncTx(async () => {
      const { remoteFee, localWeight } = await getEstimatedFees(sender)
      const { api, pallet } = (await getApi(originId)) as XcmApi & {
        pallet: "XcmPallet"
      }
      return api.tx[pallet].execute({
        message: msg(remoteFee),
        max_weight: localWeight,
      })
    })

  return { getEstimatedFees, createTx }
}
