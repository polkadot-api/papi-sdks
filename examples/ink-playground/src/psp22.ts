import { contracts, pop } from "@polkadot-api/descriptors"
import { createInkSdk } from "@polkadot-api/sdk-ink"
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
const psp22Sdk = createInkSdk(typedApi, contracts.psp22)

const wasmFile = Bun.file("./contracts/psp22_mod/psp22.wasm")
console.log("Loading wasm file")
const wasmBytes = Binary.fromBytes(await wasmFile.bytes())

const deployer = psp22Sdk.getDeployer(wasmBytes)

console.log("Dry-running deploy")
const dryRunResult = await deployer.dryRun("new", {
  data: {
    decimals: 12,
    supply: 1000_000000000000n,
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

const contract = psp22Sdk.getContract(ADDRESS.psp22)

console.log(`Deployed contract is compatible: ${await contract.isCompatible()}`)

const initialAllowanceResult = await contract.query("PSP22::allowance", {
  origin: ADDRESS.alice,
  data: {
    owner: ADDRESS.alice,
    spender: ADDRESS.bob,
  },
})
if (initialAllowanceResult.success) {
  console.log(`allowance alice->bob: ${initialAllowanceResult.value.response}`)
} else {
  console.log(
    `allowance alice->bob request failed`,
    initialAllowanceResult.value,
  )
}

const increaseAllowanceResult = await contract.query(
  "PSP22::increase_allowance",
  {
    origin: ADDRESS.alice,
    data: {
      spender: ADDRESS.bob,
      delta_value: 1_000000000000n,
    },
  },
)
if (!increaseAllowanceResult.success) {
  console.log(
    `increase allowance dry-run success request failed`,
    increaseAllowanceResult.value,
  )
  process.exit(0)
}
console.log(`increase allowance dry-run success`, {
  gas: increaseAllowanceResult.value.gasRequired,
  storageDeposit: increaseAllowanceResult.value.storageDeposit,
})

if (process.argv.includes("increase-allowance")) {
  console.log("Increasing allowance...")
  await trackTx(
    increaseAllowanceResult.value.send().signSubmitAndWatch(aliceSigner),
  )
  console.log(`Increased!`)
}

const rootStorage = await contract.getStorage().getRoot()
if (rootStorage.success) {
  console.log("data storage", rootStorage.value.data)
} else {
  console.log("root storage query failed", rootStorage.value)
}

client.destroy()
