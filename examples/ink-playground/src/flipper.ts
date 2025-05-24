import { contracts, pop } from "@polkadot-api/descriptors"
import { createReviveSdk } from "@polkadot-api/sdk-ink"
import { Binary, createClient } from "polkadot-api"
import { withPolkadotSdkCompat } from "polkadot-api/polkadot-sdk-compat"
import { getWsProvider } from "polkadot-api/ws-provider/web"
import { ADDRESS } from "./util/address"
import { aliceSigner } from "./util/signer"
import { trackTx } from "./util/trackTx"

const client = createClient(
  withPolkadotSdkCompat(getWsProvider("wss://rpc1.paseo.popnetwork.xyz")),
)

const typedApi = client.getTypedApi(pop)
const flipperSdk = createReviveSdk(typedApi, contracts.my_contract)

const pvmFile = Bun.file("./contracts/flipper_inkv6/my_contract.polkavm")
console.log("Loading pvm file")
const pvmBytes = Binary.fromBytes(await pvmFile.bytes())

const deployer = flipperSdk.getDeployer(pvmBytes)

console.log("Dry-running deploy")
const dryRunResult = await deployer.dryRun("new", {
  data: {
    init_value: false,
  },
  origin: ADDRESS.alice,
})

if (!dryRunResult.success) {
  if (dryRunResult.value.value?.value?.type === "DuplicateContract") {
    console.log("Dry run failed because duplicate contract (expected)")
  } else {
    console.log("Dry run did not succeed", dryRunResult.value)
    process.exit(0)
  }
} else {
  console.log("Dry-run success", dryRunResult.value.address)

  if (process.argv.includes("deploy")) {
    console.log("Deploying...")
    await trackTx(dryRunResult.value.deploy().signSubmitAndWatch(aliceSigner))
    console.log(`Deployed to address ${dryRunResult.value.address}`)
  }
}

const contract = flipperSdk.getContract(ADDRESS.flipper)
console.log(`Deployed contract is compatible: ${await contract.isCompatible()}`)

const initialValueResult = await contract.query("get", {
  origin: ADDRESS.alice,
})
if (initialValueResult.success) {
  console.log(`initial value: ${initialValueResult.value.response}`)
} else {
  console.log(`initial value request failed`, initialValueResult.value)
}

const flipResult = await contract.query("flip", {
  origin: ADDRESS.alice,
})
if (!flipResult.success) {
  console.log(`flip dry-run success request failed`, flipResult.value)
  process.exit(0)
}
console.log(`flip dry-run success`, {
  gas: flipResult.value.gasRequired,
  storageDeposit: flipResult.value.storageDeposit,
})

if (process.argv.includes("flip")) {
  console.log("flipping...")
  await trackTx(flipResult.value.send().signSubmitAndWatch(aliceSigner))
  console.log(`Flipped!`)
}

// Storage not supported yet until get_storage_var_key is deployed
// const rootStorage = await contract.getStorage().getRoot()
// if (rootStorage.success) {
//   console.log("flip storage", rootStorage.value)
// } else {
//   console.log("root storage query failed", rootStorage.value)
// }

client.destroy()
