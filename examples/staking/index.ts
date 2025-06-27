import { dot } from "@polkadot-api/descriptors"
import { createStakingSdk } from "@polkadot-api/sdk-staking"
import { createClient } from "polkadot-api"
import { withPolkadotSdkCompat } from "polkadot-api/polkadot-sdk-compat"
import { getWsProvider } from "polkadot-api/ws-provider/web"

const TXOUSEP = "15roJ4ZrgrZam5BQWJgiGHpgp7ShFQBRNLq6qUfiNqXDZjMK"

const client = createClient(
  withPolkadotSdkCompat(getWsProvider("wss://rpc.ibp.network/polkadot")),
)
const api = client.getTypedApi(dot)
console.log(await api.query.System.ParentHash.getValue())

const sdk = createStakingSdk(api, { maxActiveNominators: 22_500 })
const info = await api.query.Staking.Bonded.getEntries()
console.log(info.filter(({ keyArgs: [stash], value }) => stash !== value))

console.log(await sdk.getNominatorStatus(TXOUSEP))

process.exit(0)
