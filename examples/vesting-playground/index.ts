import { pas } from "@polkadot-api/descriptors"
import { createVestingSdk } from "@polkadot-api/sdk-accounts"
import { createClient } from "polkadot-api"
import { paseo } from "polkadot-api/chains"
import { getSmProvider } from "polkadot-api/sm-provider"
import { start } from "polkadot-api/smoldot"

const smoldot = start()
const provider = getSmProvider(smoldot.addChain({ chainSpec: paseo }))
const client = createClient(provider)
const api = client.getTypedApi(pas)

const sdk = createVestingSdk(api)
