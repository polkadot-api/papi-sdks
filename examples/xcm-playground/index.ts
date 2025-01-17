import { pah, pas } from "@polkadot-api/descriptors"
import {
  CHAINS,
  createXcmSdk,
  TOKENS,
  TOKENS_IN_CHAINS,
} from "@polkadot-api/sdk-xcm"
import { createClient } from "polkadot-api"
import { withPolkadotSdkCompat } from "polkadot-api/polkadot-sdk-compat"
import { getWsProvider } from "polkadot-api/ws-provider/web"
import { addr1, addr2, signer2 } from "./signers"

const log = (l: any) => console.dir(l, { depth: null })

const pasClient = createClient(
  withPolkadotSdkCompat(getWsProvider("wss://paseo.rpc.amforc.com")),
)
const pahClient = createClient(
  withPolkadotSdkCompat(getWsProvider("wss://asset-hub-paseo-rpc.dwellir.com")),
)
const pasApi = pasClient.getTypedApi(pas)
const pahApi = pahClient.getTypedApi(pah)

const xcmSdk = createXcmSdk(CHAINS, TOKENS, TOKENS_IN_CHAINS, (id) =>
  id === "paseo" ? pasClient : pahClient,
)

const PAS = 10n ** 10n
const amount = 5n * PAS
const route = xcmSdk.createRoute("PAS", "paseoAssetHub", "paseo")
const teleport = route(amount, addr1)
const fees = await teleport.getEstimatedFees(addr2)
const totalFee = Object.values(fees).reduce<bigint>(
  (acc, val) => acc + (typeof val === "bigint" ? val : 0n),
  0n,
)
const {
  data: { free: initialSender },
} = await pahApi.query.System.Account.getValue(addr2)
const {
  data: { free: initialReceiver },
} = await pasApi.query.System.Account.getValue(addr1)
pahApi.query.System.Account.watchValue(addr2).subscribe(({ data }) => {
  log(`SENDER FREE ${data.free}`)
  log(`EXPECTED DIFF ${data.free + amount + totalFee - initialSender}`)
})
pasApi.query.System.Account.watchValue(addr1).subscribe(({ data }) => {
  log(`RECEIVER FREE ${data.free}`)
  log(`EXPECTED DIFF ${data.free - initialReceiver - amount}`)
})
log("SUBMITTING FIRST")
teleport.createTx(addr2).signSubmitAndWatch(signer2).subscribe(log)
