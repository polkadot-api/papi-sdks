import { encodeFunctionData, decodeFunctionResult } from "viem"
import { contracts, pop } from "@polkadot-api/descriptors"
import { createReviveSdk } from "@polkadot-api/sdk-ink"
import { Binary, createClient } from "polkadot-api"
import { withPolkadotSdkCompat } from "polkadot-api/polkadot-sdk-compat"
import { getWsProvider } from "polkadot-api/ws-provider/web"
import { ADDRESS } from "./util/address"
import { aliceSigner } from "./util/signer"
import { trackTx } from "./util/trackTx"

let CONTRACT_ADDRESS = ADDRESS.flipper

const client = createClient(
  withPolkadotSdkCompat(
    getWsProvider([
      "wss://testnet-passet-hub.polkadot.io",
      // "wss://rpc2.paseo.popnetwork.xyz",
      // "wss://rpc1.paseo.popnetwork.xyz",
    ]),
  ),
)

const typedApi = client.getTypedApi(pop)

// await trackTx(
//   typedApi.tx.System.remark_with_event({
//     remark: Binary.fromText("Hey"),
//   }).signSubmitAndWatch(aliceSigner, {
//     at: "best",
//   }),
// )

const pvmFile = Bun.file("./contracts/ballot/ballot.polkavm")
console.log("Loading pvm file")
const pvmBytes = Binary.fromBytes(await pvmFile.bytes())

const abiFile = Bun.file("./contracts/ballot/ballot-abi.json")
console.log("Loading abi file")
const abi = await abiFile.json()

const data = encodeFunctionData({
  abi,
  args: [
    ["proposal 1", "proposal 2"].map((v) =>
      Binary.fromText(v.padStart(32, " ")).asHex(),
    ),
  ],
  functionName: "constructor",
}).slice(2 + 4 * 2)

console.log("wait connection")
await typedApi.compatibilityToken

console.log("dry running")

const instantiateResult = await typedApi.apis.ReviveApi.instantiate(
  ADDRESS.alice,
  0n,
  undefined,
  undefined,
  {
    type: "Upload",
    value: pvmBytes,
  },
  Binary.fromHex(data),
  undefined,
)

console.log(
  JSON.stringify(instantiateResult.result.value, (_, v) =>
    typeof v === "bigint" ? v.toString() : v instanceof Binary ? v.asHex() : v,
  ),
)

if (!instantiateResult.result.success) {
  throw new Error("Not successful")
}

if (process.argv.includes("deploy")) {
  await trackTx(
    typedApi.tx.Revive.instantiate_with_code({
      code: pvmBytes,
      data: Binary.fromHex(data),
      gas_limit: instantiateResult.gas_required,
      salt: undefined,
      storage_deposit_limit: instantiateResult.storage_deposit.value,
      value: 0n,
    }).signSubmitAndWatch(aliceSigner, {
      at: "finalized",
    }),
  )
}

const proposalsResult = await typedApi.apis.ReviveApi.call(
  ADDRESS.alice,
  Binary.fromHex(ADDRESS.ballot),
  0n,
  undefined,
  undefined,
  Binary.fromHex(
    encodeFunctionData({
      abi,
      args: [1],
      functionName: "proposals",
    }),
  ),
)

console.log(
  JSON.stringify(proposalsResult.result.value, (_, v) =>
    typeof v === "bigint" ? v.toString() : v instanceof Binary ? v.asHex() : v,
  ),
)

if (!proposalsResult.result.success) {
  throw new Error("Not successful")
}

const decodedProposalsResult = decodeFunctionResult({
  abi,
  data: proposalsResult.result.value.data.asHex(),
  functionName: "proposals",
})

console.log({ decodedProposalsResult })

process.exit(0)
