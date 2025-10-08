import type { DotWhitelistEntry } from "./descriptors"

export const whitelist: DotWhitelistEntry[] = [
  "query.System.Account",
  "*.Staking",
  "const.Balances.ExistentialDeposit",
  "const.System.SS58Prefix",
  "query.NominationPools.*",
  "tx.NominationPools.*",
  "api.NominationPoolsApi.points_to_balance",
  "api.NominationPoolsApi.balance_to_points",
  "api.NominationPoolsApi.pending_rewards",
]
