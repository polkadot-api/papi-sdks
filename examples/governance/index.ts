import { dot, pas } from "@polkadot-api/descriptors"
import {
  createBountiesSdk,
  createChildBountiesSdk,
} from "@polkadot-api/sdk-governance"
import { createClient } from "polkadot-api"
import { withPolkadotSdkCompat } from "polkadot-api/polkadot-sdk-compat"
import { getWsProvider } from "polkadot-api/ws-provider/web"

const client = createClient(
  withPolkadotSdkCompat(getWsProvider("wss://paseo-rpc.dwellir.com")),
)
const typedApi = client.getTypedApi(pas)

const bountiesSdk = createBountiesSdk(typedApi)
console.log("Loading bounties...")
const bounties = await bountiesSdk.getBounties()
console.log(bounties.map((bounty) => bounty.description))

const childBountiesSdk = createChildBountiesSdk(typedApi)
for (const bounty of bounties) {
  const childBounties = await childBountiesSdk.getChildBounties(bounty.id)
  if (childBounties.length) {
    console.log(
      bounty.description,
      childBounties.map((v) => v.description),
    )
  }
}

process.exit(0)
