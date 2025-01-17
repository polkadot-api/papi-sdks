import {
  CHAINS,
  createXcmSdk,
  TOKENS,
  TOKENS_IN_CHAINS,
} from "@polkadot-api/sdk-xcm"
import { createClient, type PolkadotClient } from "polkadot-api"
import { withPolkadotSdkCompat } from "polkadot-api/polkadot-sdk-compat"
import { getWsProvider } from "polkadot-api/ws-provider/web"
import { addr1, addr2, signer1 } from "./signers"

console.log(addr1)
console.log(addr2)

const pas = createClient(
  withPolkadotSdkCompat(getWsProvider("wss://paseo.rpc.amforc.com")),
)
const pah = createClient(
  withPolkadotSdkCompat(getWsProvider("wss://asset-hub-paseo-rpc.dwellir.com")),
)
const hydration = createClient(
  withPolkadotSdkCompat(getWsProvider("wss://paseo-rpc.play.hydration.cloud")),
)

const chains: Record<string, PolkadotClient> = {
  paseo: pas,
  paseoAssetHub: pah,
  paseoHydra: hydration,
}

const PAS = 10n ** 10n
const sdk = createXcmSdk(CHAINS, TOKENS, TOKENS_IN_CHAINS, (id) => chains[id])
const route = sdk.createRoute("PAS", "paseoAssetHub", "paseoHydra")
const teleport = route(2n * PAS, addr2)

teleport
  .createTx(addr1)
  .signSubmitAndWatch(signer1)
  .subscribe(({ type }) => console.log(type))
