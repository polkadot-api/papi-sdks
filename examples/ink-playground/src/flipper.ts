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
      "wss://rpc2.paseo.popnetwork.xyz",
      "wss://rpc1.paseo.popnetwork.xyz",
    ]),
  ),
)

const typedApi = client.getTypedApi(pop)
const flipperSdk = createReviveSdk(typedApi, contracts.flipper)

console.log("Alice is mapped?", await flipperSdk.addressIsMapped(ADDRESS.alice))

const pvmFile = Bun.file("./contracts/flipper_inkv6/flipper.polkavm")
console.log("Loading pvm file")
const pvmBytes = Binary.fromBytes(await pvmFile.bytes())

const deployer = flipperSdk.getDeployer(pvmBytes)

// Example on how to get an estimated deployed address
const estimatedAddress = await deployer.estimateAddress("new", {
  data: {
    initial_value: false,
  },
  origin: ADDRESS.alice,
})
console.log("estimated address", estimatedAddress)

// Example on dry-running a contract deployment
console.log("Dry-running deploy")
const dryRunResult = await deployer.dryRun("new", {
  data: {
    initial_value: false,
  },
  origin: ADDRESS.alice,
})

if (!dryRunResult.success) {
  console.log("Dry run did not succeed", dryRunResult.value)
  process.exit(0)
}

console.log("Dry-run success", {
  address: dryRunResult.value.address,
  events: dryRunResult.value.events,
  storageDeposit: dryRunResult.value.storageDeposit,
})

if (process.argv.includes("deploy")) {
  console.log("Deploying...")
  // Note: we could also deploy directly without dry-run with `deployer.deploy`, but it would need the storageDeposit / weights.
  const fin = await trackTx(
    dryRunResult.value.deploy().signSubmitAndWatch(aliceSigner),
  )

  // After a long battle, we managed to get the `ContractInstantiated` event back https://github.com/paritytech/polkadot-sdk/issues/8677
  // For chains with this deployed, we can get the address directly from the events
  const events = flipperSdk.readDeploymentEvents(fin.events)
  // It's an array because we can batch multiple deployments with one transaction.
  if (events.length) {
    console.log(`Deployed to address ${events[0].address}`)
    CONTRACT_ADDRESS = events[0].address
  } else {
    // If the chain doesn't have the event deployed yet, then the best we can do is the dry-run estimate.
    console.log(`Deployed to address ${dryRunResult.value.address} (maybe)`)
    CONTRACT_ADDRESS = dryRunResult.value.address
  }
}

const contract = flipperSdk.getContract(CONTRACT_ADDRESS)
console.log(`Deployed contract is compatible: ${await contract.isCompatible()}`)

const contractAccount = await typedApi.query.System.Account.getValue(
  contract.accountId,
)
console.log(
  `Contract funds: ${contract.accountId} ${contractAccount.data.free}`,
)

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
  events: flipResult.value.events,
})

if (process.argv.includes("flip")) {
  console.log("flipping...")
  // Note: we could also flip directly without dry-run with `contract.send`, but it would need the storageDeposit / weights.
  const fin = await trackTx(
    flipResult.value.send().signSubmitAndWatch(aliceSigner),
  )
  console.log(`Flipped!`)
  const events = contract.filterEvents(fin.events)
  const evt = events[0]
  console.log(
    "Event new flipped value",
    evt.type === "Flipped" && evt.value.new_value,
  )
}

// Storage not supported yet until get_storage_var_key is deployed
const rootStorage = await contract.getStorage().getRoot()
if (rootStorage.success) {
  console.log("flip storage", rootStorage.value)
} else {
  console.log("root storage query failed", rootStorage.value)
}

client.destroy()
