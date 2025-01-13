import {
  CHAINS,
  createXcmSdk,
  TOKENS,
  TOKENS_IN_CHAINS,
} from "@polkadot-api/sdk-xcm"
import { createClient } from "polkadot-api"
import { withPolkadotSdkCompat } from "polkadot-api/polkadot-sdk-compat"
import { getWsProvider } from "polkadot-api/ws-provider/web"
import { addr1, addr2, signer1, signer2 } from "./signers"

console.log(addr1)
console.log(addr2)
const wnd = createClient(
  withPolkadotSdkCompat(getWsProvider("wss://westend-rpc.polkadot.io")),
)
const wndPP = createClient(
  withPolkadotSdkCompat(getWsProvider("wss://westend-penpal-rpc.polkadot.io")),
)

const WND = 10n ** 12n
const sdk = createXcmSdk(CHAINS, TOKENS, TOKENS_IN_CHAINS, (id) =>
  id === "westend" ? wnd : wndPP,
)
const route = sdk.createRoute("WND", "westendPP", "westend")
const teleport = route(2n * WND, addr2)

console.log(await teleport.getEstimatedFees(addr1))
teleport
  .createTx(addr1)
  .signSubmitAndWatch(signer1)
  .subscribe(({ type }) => console.log(type))
