import {
  CHAINS,
  createXcmSdk,
  TOKENS,
  TOKENS_IN_CHAINS,
} from "@polkadot-api/sdk-xcm"
import { createClient, type PolkadotClient } from "polkadot-api"
import { withPolkadotSdkCompat } from "polkadot-api/polkadot-sdk-compat"
import { getWsProvider } from "polkadot-api/ws-provider/web"

const NIKOS = "15DCZocYEM2ThYCAj22QE4QENRvUNVrDtoLBVbCm5x4EQncr"

const polkadotAh = createClient(
  withPolkadotSdkCompat(
    getWsProvider("ws://127.0.0.1:8000"),
  ),
)
const polkadotBh = createClient(
  withPolkadotSdkCompat(
    getWsProvider("wss://bridge-hub-polkadot-rpc.dwellir.com"),
  ),
)
const kusamaAh = createClient(
  withPolkadotSdkCompat(
    getWsProvider("wss://asset-hub-kusama-rpc.dwellir.com"),
  ),
)

const chains: Record<string, PolkadotClient> = {
  polkadotAh,
  polkadotBh,
  kusamaAh,
}

const DOT = 10n ** 10n
const sdk = createXcmSdk(CHAINS, TOKENS, TOKENS_IN_CHAINS, (id) => {
  if (!(id in chains)) throw new Error(`Missing ${id}`)
  return chains[id]
})
const route = sdk.createRoute("DOT", "polkadotAh", "kusamaAh")
const teleport = route(10n * DOT, NIKOS)
console.log(await teleport.getEstimatedFees(NIKOS))
