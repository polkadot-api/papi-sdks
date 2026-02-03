import { ksmAh, MultiAddress } from "@polkadot-api/descriptors"
import { AccountId, createClient } from "polkadot-api"
import { connectInjectedExtension } from "polkadot-api/pjs-signer"
import { getWsProvider } from "polkadot-api/ws"
import { getRemoteProxySdk } from "@polkadot-api/sdk-remote-proxy"

// The clients for the Kusama-relay and the Kusama-AssetHub chains
const relayClient = createClient(getWsProvider("wss://rpc.ibp.network/kusama"))
const ahClient = createClient(getWsProvider("wss://sys.ibp.network/statemine"))
// The remote proxy SDK
const remoteProxySdk = getRemoteProxySdk(relayClient, ahClient)

// In this example we are using a browser-extension account, but this would
// also work with any other PolkadotSigner like the ledger-signer, a raw-signer, etc
const pjsAcount = (await connectInjectedExtension("talisman"))
  .getAccounts()
  .find((x) => x.name === "YourAccountsName")!

// The signer that will take care of all the complexity
const remoteMultisigProxySigner = remoteProxySdk.getMultisigProxiedSigner(
  // The relay-chain proxy account which is controled by the multisig
  "GeYsALZTCjRmG6bUCqtCK7t3mYk2B6JoaFGq2JiWxv5Yvzc",

  // The configuration of the multisig
  {
    signatories: [
      "DSDpapJC2viKE4nnAaDzEN1qP7NnNDVd3y4mVM2Ggu3nk4o",
      "DfQTJosoEyqD1uBqDo8TDGDdwmfgXXsQCLgLrofxyaV5zTm",
      "CzJobVBH3SLeNnmbNhVotUqBgsWvK5nAjfSQ9LmSxpT3583",
    ],
    threshold: 2,
  },

  // It has to be the signer of one of the `signatories`
  pjsAcount.polkadotSigner,
)
// The SS58 address of the multisig
const multisigAddress = AccountId().dec(remoteMultisigProxySigner.accountId)

// The tx for sending the funds from the Proxy account to the multisig
const tx = ahClient.getTypedApi(ksmAh).tx.Balances.transfer_all({
  dest: MultiAddress.Id(multisigAddress),
  keep_alive: false,
})

// Let's sign and submit our tx... And we are done!
// We just need to wait for one of the other signatories to do the same
tx.signSubmitAndWatch(remoteMultisigProxySigner).subscribe(
  console.log,
  console.error,
)
