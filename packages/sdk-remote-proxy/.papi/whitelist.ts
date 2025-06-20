import {
  KsmAhWhitelistEntry,
  KsmWhitelistEntry,
} from "@polkadot-api/descriptors"

const ksmWhitelist: KsmWhitelistEntry[] = ["query.Proxy.Proxies"]

const ahKsmWhitelist: KsmAhWhitelistEntry[] = [
  "query.RemoteProxyRelayChain.BlockToRoot",
  "tx.RemoteProxyRelayChain.remote_proxy",
]

export const whitelist = [...ksmWhitelist, ...ahKsmWhitelist]
