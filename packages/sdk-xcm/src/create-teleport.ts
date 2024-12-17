import {
  pah,
  pas,
  XcmV4Instruction,
  type XcmVersionedAssets,
  XcmVersionedXcm,
} from "@/descriptors"
import type { Result } from "@polkadot-api/common-sdk-utils"
import {
  Enum,
  PolkadotClient,
  type SS58String,
  Transaction,
} from "polkadot-api"
import { unwrap } from "./utils"
import {
  accId32ToLocation,
  filterV2,
  type Location,
  locationsAreEq,
  routeRelative,
} from "./utils/location"

// TODO: investigate typings
export const createTeleport = (
  origin: Location,
  originClient: PolkadotClient,
  dest: Location,
  destClient: PolkadotClient,
  token: Location,
  amount: bigint,
  beneficiary: SS58String,
) => {
  const originApi = originClient.getTypedApi(pas)
  const destApi = destClient.getTypedApi(pah)
  // TODO: check compatibility with V3
  // we might need to tweak instructions
  const msg = (remoteFee: bigint = 0n) =>
    XcmVersionedXcm.V4([
      // this one will make delivery fees for first hop withdraw from the origin
      // NOTE: investigate getting the fees with withdraw asset
      XcmV4Instruction.SetFeesMode({ jit_withdraw: true }),
      XcmV4Instruction.WithdrawAsset([
        {
          id: routeRelative(origin, token),
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
              id: routeRelative(dest, token),
              fun: Enum("Fungible", remoteFee ? remoteFee : amount / 2n),
            },
            weight_limit: Enum("Unlimited"),
          }),
          XcmV4Instruction.DepositAsset({
            assets: Enum("Wild", Enum("AllCounted", 1)),
            beneficiary: accId32ToLocation(beneficiary),
          }),
        ],
        dest: routeRelative(origin, dest),
      }),
    ])

  const calculateFees = async (sender: SS58String, remoteFeeHint?: bigint) => {
    const message = msg(remoteFeeHint)
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
        originApi.tx.XcmPallet.execute({
          message: message,
          max_weight: localWeight,
        }).decodedCall,
      )) as Result<
        (Awaited<ReturnType<typeof originApi.apis.DryRunApi.dry_run_call>> & {
          success: true
        })["value"]
      >,
    )
    const destFromOrigin = routeRelative(origin, dest)
    const forwarded = dryRun.forwarded_xcms.find(([x]) =>
      locationsAreEq(destFromOrigin, filterV2(x).value),
    )
    if (!forwarded || forwarded[1].length !== 1)
      throw new Error(`Found no or more than 1 msg ${forwarded}`)
    const deliveryFees = await unwrap(
      originApi.apis.XcmPaymentApi.query_delivery_fees(
        forwarded[0],
        forwarded[1][0],
      ) as Promise<Result<XcmVersionedAssets>>,
    )
    if (
      deliveryFees.value.length !== 1 ||
      deliveryFees.value[0].fun.type !== "Fungible"
    )
      throw new Error(`Unexpected fee ${deliveryFees}`)
    const deliveryFee = deliveryFees.value[0].fun.value
    const remoteFee = await unwrap(
      destApi.apis.XcmPaymentApi.query_xcm_weight(forwarded[1][0]) as Promise<
        Result<{
          ref_time: bigint
          proof_size: bigint
        }>
      >,
    ).then((weight) =>
      unwrap(
        destApi.apis.XcmPaymentApi.query_weight_to_asset_fee(
          weight,
          Enum("V4", routeRelative(dest, token)),
        ) as Promise<Result<bigint>>,
      ),
    )
    return { localWeight, deliveryFee, remoteFee }
  }

  const getEstimatedFees = async (sender: SS58String) => {
    // we calculate twice the fees to ensure the message length is right
    const { localWeight, remoteFee, deliveryFee } = await calculateFees(
      sender,
      (await calculateFees(sender)).remoteFee,
    )
    const localFee = await originApi.tx.XcmPallet.execute({
      message: msg(remoteFee),
      max_weight: localWeight,
    }).getEstimatedFees(sender)
    return { localWeight, localFee, remoteFee, deliveryFee }
  }
  const createTx = async (
    sender: SS58String,
  ): Promise<Transaction<any, any, any, any>> => {
    const { remoteFee, localWeight } = await getEstimatedFees(sender)
    return originApi.tx.XcmPallet.execute({
      message: msg(remoteFee),
      max_weight: localWeight,
    })
  }
  return { getEstimatedFees, createTx }
}
