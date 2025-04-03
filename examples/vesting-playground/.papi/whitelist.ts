import type { PasWhitelistEntry } from "@polkadot-api/descriptors"

export const whitelist: PasWhitelistEntry[] = [
  "query.Vesting.Vesting",
  "query.Balances.Locks",
  "const.Babe.ExpectedBlockTime",
  "query.System.Number",
]
