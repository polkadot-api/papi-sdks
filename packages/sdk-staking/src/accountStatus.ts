import { SS58String, TypedApi } from "polkadot-api"
import { Dot } from "../.papi/descriptors"
import { StakingSdk } from "./sdk-types"

// // TODO: include VoterList check
// const canNominate: StakingSdk["canNominate"] = async (addr) => {
//   const [{ data }, ledger, minBond, ed] = await Promise.all([
//     api.query.System.Account.getValue(addr),
//     api.query.Staking.Bonded.getValue(addr).then((controller) =>
//       controller ? api.query.Staking.Ledger.getValue(controller) : undefined,
//     ),
//     api.query.Staking.MinNominatorBond.getValue(),
//     api.constants.Balances.ExistentialDeposit(),
//   ])
//   const maxBond = data.free - (data.reserved < ed ? data.reserved - ed : 0n)

//   const canNominate = maxBond >= minBond
//   if (!canNominate) return { canNominate }
//   return { canNominate, maxBond, currentBond: ledger?.total ?? 0n }
// }

export const getAccountStatus =
  (api: TypedApi<Dot>): StakingSdk["getAccountStatus"] =>
  (address: SS58String) => {
    return null as any
  }
