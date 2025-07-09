import {
  KsmAhWhitelistEntry,
  KsmWhitelistEntry,
} from "@polkadot-api/descriptors"

const ksmWhitelist: KsmWhitelistEntry[] = ["query.Proxy.Proxies"]

const ahKsmWhitelist: KsmAhWhitelistEntry[] = [
  "query.RemoteProxyRelayChain.BlockToRoot",
  "query.Multisig.Multisigs",
  "api.TransactionPaymentApi.query_info",
  "tx.RemoteProxyRelayChain.*",
]

export const whitelist = [...ksmWhitelist, ...ahKsmWhitelist]
