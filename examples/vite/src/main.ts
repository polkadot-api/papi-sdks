import "./style.css"
import { ksmAh } from "@polkadot-api/descriptors"
import { Binary, createClient } from "polkadot-api"
import { connectInjectedExtension } from "polkadot-api/pjs-signer"
import { getWsProvider } from "polkadot-api/ws-provider/web"
import { getRemoteProxySdk } from "@polkadot-api/sdk-remote-proxy"

const relayClient = createClient(getWsProvider("wss://rpc.ibp.network/kusama"))
const ahClient = createClient(getWsProvider("wss://sys.ibp.network/statemine"))
const sdk = getRemoteProxySdk(relayClient, ahClient)

const ahApi = ahClient.getTypedApi(ksmAh)
const tx = ahApi.tx.System.remark({ remark: Binary.fromText("PAPI Rocks!") })

const account = (await connectInjectedExtension("talisman"))
  .getAccounts()
  .find((x) => x.name === "Josep")!

const signer = sdk.getProxiedSigner(
  "F5TNY7m4sntpbzEKvid6HZhktUXLWEEmqwVZwYXS9ZXKDf2",
  account.polkadotSigner,
)

tx.signSubmitAndWatch(signer).subscribe(console.log, console.error)
