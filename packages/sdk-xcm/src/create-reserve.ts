import { XcmV4Instruction, XcmVersionedXcm } from "@/descriptors"
import {
  type AsyncTransaction,
  wrapAsyncTx,
} from "@polkadot-api/common-sdk-utils"
import { Enum, type SS58String } from "polkadot-api"
import { calculateXcmFees } from "./fee-estimation"
import {
  accId32ToLocation,
  type Location,
  locationsAreEq,
  routeRelative,
} from "./utils/location"
import { XcmApi } from "./xcm-sdk"

const sum = (arr: bigint[]) => arr.reduce((acc, val) => acc + val)

export const createReserve = (
  originId: string,
  originLocation: Location,
  destId: string,
  destLocation: Location,
  token: Location,
  reserve: Location,
  getApi: (id: string) => Promise<XcmApi>,
  amount: bigint,
  beneficiary: SS58String,
) => {
  // TODO: check compatibility with V3
  // we might need to tweak instructions
  const steps: [string, Location][] = [[originId, originLocation]]
  if (
    locationsAreEq(originLocation, reserve) ||
    locationsAreEq(destLocation, reserve)
  )
    steps.push([destId, destLocation])
  // TODO: missing tx kinds
  // foreign -> foreign (remote reserve)
  else {
  }
  const msg = (feeHint: bigint[] = []) => {
    // TODO: missing tx kinds
    // foreign -> foreign (remote reserve)
    if (locationsAreEq(originLocation, reserve))
      return XcmVersionedXcm.V4([
        // this one will make delivery fees for first hop withdraw from the origin
        // NOTE: investigate getting the fees with withdraw asset
        // TODO: delivery fees are being withdrawn twice
        // jit_withdraw ones are getting trapped
        // XcmV4Instruction.SetFeesMode({ jit_withdraw: true }),
        XcmV4Instruction.WithdrawAsset([
          {
            id: routeRelative(originLocation, token),
            fun: Enum("Fungible", amount + (feeHint[0] ?? 0n)),
          },
        ]),
        XcmV4Instruction.DepositReserveAsset({
          assets: Enum("Wild", Enum("AllCounted", 1)),
          dest: routeRelative(originLocation, destLocation),
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
        }),
      ])
    if (locationsAreEq(destLocation, reserve))
      return XcmVersionedXcm.V4([
        // this one will make delivery fees for first hop withdraw from the origin
        // NOTE: investigate getting the fees with withdraw asset
        XcmV4Instruction.SetFeesMode({ jit_withdraw: true }),
        XcmV4Instruction.WithdrawAsset([
          {
            id: routeRelative(originLocation, token),
            fun: Enum("Fungible", amount + (feeHint[0] ?? 0n)),
          },
        ]),
        XcmV4Instruction.InitiateReserveWithdraw({
          assets: Enum("Wild", Enum("AllCounted", 1)),
          reserve: routeRelative(originLocation, destLocation),
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
        }),
      ])
    throw new Error("NOT IMPL")
  }

  const _estimateFees = async (sender: SS58String) => {
    const { localWeight, remoteFees, deliveryFees } = await calculateXcmFees(
      msg,
      steps,
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
