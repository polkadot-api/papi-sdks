import {
  XcmV4Instruction,
  type XcmVersionedAssetId,
  XcmVersionedXcm,
} from "@/descriptors"
import {
  wrapAsyncTx,
  type AsyncTransaction,
  type Result,
} from "@polkadot-api/common-sdk-utils"
import { Enum, type SS58String } from "polkadot-api"
import { calculateXcmFees } from "./fee-estimation"
import { unwrap } from "./utils"
import {
  accId32ToLocation,
  locationsAreEq,
  routeRelative,
  type Location,
} from "./utils/location"
import type { XcmApi } from "./xcm-sdk"

const sum = (arr: bigint[]) => arr.reduce((acc, val) => acc + val)

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
  const msg = (feeHint: bigint[] = []) =>
    XcmVersionedXcm.V4([
      // this one will make delivery fees for first hop withdraw from the origin
      // NOTE: investigate getting the fees with withdraw asset
      XcmV4Instruction.SetFeesMode({ jit_withdraw: true }),
      XcmV4Instruction.WithdrawAsset([
        {
          id: routeRelative(originLocation, token),
          fun: Enum("Fungible", amount + (feeHint[0] ?? 0n)),
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
              fun: Enum("Fungible", feeHint[0] ?? amount / 2n),
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

  const _estimateFees = async (sender: SS58String) => {
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

    const { localWeight, remoteFees, deliveryFees } = await calculateXcmFees(
      msg,
      [
        [originId, originLocation],
        [destId, destLocation],
      ],
      token,
      getApi,
      sender,
    )
    const { api, pallet } = (await getApi(originId)) as XcmApi & {
      pallet: "XcmPallet"
    }
    const localFee = await api.tx[pallet]
      .execute({
        message: msg(remoteFees),
        max_weight: localWeight,
      })
      .getEstimatedFees(sender)
    return {
      localWeight,
      localFee,
      remoteFees,
      deliveryFees,
    }
  }
  const getEstimatedFees = async (sender: SS58String) => {
    const { deliveryFees, remoteFees, localFee } = await _estimateFees(sender)
    return {
      localFee,
      remoteFee: sum(remoteFees),
      deliveryFee: sum(deliveryFees),
    }
  }
  const createTx = (sender: SS58String): AsyncTransaction<any, any, any, any> =>
    wrapAsyncTx(async () => {
      const { remoteFees, localWeight } = await _estimateFees(sender)
      const { api, pallet } = (await getApi(originId)) as XcmApi & {
        pallet: "XcmPallet"
      }
      return api.tx[pallet].execute({
        message: msg(remoteFees),
        max_weight: localWeight,
      })
    })

  return { getEstimatedFees, createTx }
}
