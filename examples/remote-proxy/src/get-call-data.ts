import "./style.css"
import { createClient } from "polkadot-api"
import { ksmAh, MultiAddress } from "@polkadot-api/descriptors"
import { getWsProvider } from "polkadot-api/ws-provider/web"
import { getRemoteProxySdk } from "@polkadot-api/sdk-remote-proxy"

const YOUR_ACCOUNT = "HS7p3efTSK35BzLKNSm26MY75jHMmSTkDwN4qxKJYiC8Vwi"
const PROXIED_ACCOUNT = "F5TNY7m4sntpbzEKvid6HZhktUXLWEEmqwVZwYXS9ZXKDf2"

const relayClient = createClient(getWsProvider("wss://rpc.ibp.network/kusama"))
const ahClient = createClient(getWsProvider("wss://sys.ibp.network/statemine"))
const ahApi = ahClient.getTypedApi(ksmAh)

const tx = ahApi.tx.Balances.transfer_all({
  dest: MultiAddress.Id(YOUR_ACCOUNT),
  keep_alive: true,
})

// So far, we have not done anything special... Now let's use this
// convenient sdk for dealing with remote proxies:
const sdk = getRemoteProxySdk(relayClient, ahClient)
const proxiedTx = await sdk.getProxiedTx(PROXIED_ACCOUNT, tx)
const callData = await proxiedTx.getEncodedData()

console.log(`Send via PAPI console:
https://dev.papi.how/extrinsics#networkId=kusama_asset_hub&endpoint=wss%3A%2F%2Fsys.ibp.network%2Fstatemine&data=${callData.asHex()}
`)
