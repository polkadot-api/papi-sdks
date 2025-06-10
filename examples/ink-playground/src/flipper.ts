import { contracts, pop } from "@polkadot-api/descriptors"
import { createReviveSdk } from "@polkadot-api/sdk-ink"
import { Binary, createClient } from "polkadot-api"
import { withPolkadotSdkCompat } from "polkadot-api/polkadot-sdk-compat"
import { getWsProvider } from "polkadot-api/ws-provider/web"
import { ADDRESS } from "./util/address"
import { aliceSigner } from "./util/signer"
import { trackTx } from "./util/trackTx"

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

const pvmFile = Bun.file("./contracts/flipper_inkv6/flipper.polkavm")
console.log("Loading pvm file")
const pvmBytes = Binary.fromBytes(await pvmFile.bytes())

const deployer = flipperSdk.getDeployer(pvmBytes)

console.log("Dry-running deploy")
const dryRunResult = await deployer.dryRun("new", {
  data: {
    initial_value: false,
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
  console.log("Dry-run success", {
    address: dryRunResult.value.address,
    // Expected to be different, because the address returned by the dry-run is bugged https://github.com/paritytech/contract-issues/issues/37
    // so this estimatedAddress is better.
    estimatedAddress: await deployer.estimateAddress("new", {
      data: {
        initial_value: false,
      },
      origin: ADDRESS.alice,
    }),
    events: dryRunResult.value.events,
    storageDeposit: dryRunResult.value.storageDeposit,
  })

  if (process.argv.includes("deploy")) {
    console.log("Deploying...")
    const fin = await trackTx(
      dryRunResult.value.deploy().signSubmitAndWatch(aliceSigner),
    )
    console.log(`Deployed to address ${dryRunResult.value.address}`)
    console.log(flipperSdk.readDeploymentEvents(fin.events))
    // console.log(
    //   JSON.stringify(fin.events, (_, v) =>
    //     typeof v === "bigint"
    //       ? String(v)
    //       : v instanceof Binary
    //         ? `bin${v.asHex()}`
    //         : v,
    //   ),
    // )
  }
}

const contract = flipperSdk.getContract(ADDRESS.flipper)
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
// const rootStorage = await contract.getStorage().getRoot()
// if (rootStorage.success) {
//   console.log("flip storage", rootStorage.value)
// } else {
//   console.log("root storage query failed", rootStorage.value)
// }

client.destroy()
