import { ksmAh, MultiAddress } from "@polkadot-api/descriptors"
import { createClient } from "polkadot-api"
import { connectInjectedExtension } from "polkadot-api/pjs-signer"
import { getWsProvider } from "polkadot-api/ws-provider/web"
import { getRemoteProxySdk } from "@polkadot-api/sdk-remote-proxy"

const relayClient = createClient(getWsProvider("wss://rpc.ibp.network/kusama"))
const ahClient = createClient(getWsProvider("wss://sys.ibp.network/statemine"))
const sdk = getRemoteProxySdk(relayClient, ahClient)

// In this example we are using a browser-extension account, but this would
// also work with any other PolkadotSigner like the ledger signer, a raw-signer, etc
const pjsAcount = (await connectInjectedExtension("talisman"))
  .getAccounts()
  .find((x) => x.name === "Josep")!

// Let's create a the transaction that later we will execute from the proxied-account
const tx = ahClient.getTypedApi(ksmAh).tx.Balances.transfer_all({
  dest: MultiAddress.Id(pjsAcount.address),
  keep_alive: true,
})

// This is the proxied account that the `pjsAccount` controls on the relay-chain
const PROXIED_ACCOUNT = "F5TNY7m4sntpbzEKvid6HZhktUXLWEEmqwVZwYXS9ZXKDf2"

// We are now creating an enhanced signer that will be able to proxy any transactions
const signer = sdk.getProxiedSigner(PROXIED_ACCOUNT, pjsAcount.polkadotSigner)

// Let's sign and submit our tx... And we are done!
tx.signSubmitAndWatch(signer).subscribe(console.log, console.error)
