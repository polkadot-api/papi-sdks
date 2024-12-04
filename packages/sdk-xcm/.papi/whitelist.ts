import { PahWhitelistEntry, PasWhitelistEntry } from "@polkadot-api/descriptors"

export const whitelist: Array<PasWhitelistEntry | PahWhitelistEntry> = [
  "api.XcmPaymentApi.*",
  "api.DryRunApi.*",

  "tx.XcmPallet.execute",
  "tx.PolkadotXcm.execute",
]
