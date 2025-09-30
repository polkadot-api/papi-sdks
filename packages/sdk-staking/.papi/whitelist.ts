import type { DotWhitelistEntry } from "./descriptors"

export const whitelist: DotWhitelistEntry[] = [
  "query.System.Account",
  "*.Staking",
  "const.Balances.ExistentialDeposit",
  "query.NominationPools.*",
  "api.NominationPoolsApi.points_to_balance",
  "api.NominationPoolsApi.pending_rewards",
]
