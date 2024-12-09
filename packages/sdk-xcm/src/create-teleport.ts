import {
  type pah,
  type pas,
  XcmV4Instruction,
  XcmVersionedXcm,
} from "@polkadot-api/descriptors"
import { Enum, type SS58String, type TypedApi } from "polkadot-api"
import type { Result } from "@polkadot-api/common-sdk-utils"
import {
  accId32ToLocation,
  type Location,
  routeRelative,
} from "./utils/location"

const unwrap = <T>({ success, value }: Result<T>): T => {
  if (success) return value
  throw null
}

export const createTeleport = (
  origin: Location,
  originApi: TypedApi<typeof pas>,
  dest: Location,
  destApi: TypedApi<typeof pah>,
  token: Location,
  amount: bigint,
  beneficiary: SS58String,
) => {
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

  return {
    async getEstimatedFees(from: SS58String): Promise<bigint> {
      const initialMsg = msg()
      let weight = unwrap(
        await originApi.apis.XcmPaymentApi.query_xcm_weight(initialMsg),
      )
      let call = originApi.tx.XcmPallet.execute({
        message: msg(),
        max_weight: weight,
      })
      let dry = unwrap(
        await originApi.apis.DryRunApi.dry_run_call(
          Enum("system", Enum("Signed", from)),
          call.decodedCall,
        ),
      ).forwarded_xcms
      return 0n
    },
  }
}
