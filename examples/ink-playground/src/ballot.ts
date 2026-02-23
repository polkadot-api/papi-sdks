import { contracts } from "@polkadot-api/descriptors"
import { createInkSdk } from "@polkadot-api/sdk-ink"
import { Binary, createClient } from "polkadot-api"
import { getWsProvider } from "polkadot-api/ws"
import { ADDRESS } from "./util/address"
import { aliceSigner } from "./util/signer"
import { trackTx } from "./util/trackTx"

let CONTRACT_ADDRESS = ADDRESS.ballot

const client = createClient(
  getWsProvider([
    "wss://testnet-passet-hub.polkadot.io",
    "wss://passet-hub-paseo.ibp.network",
  ]),
)

const inkSdk = createInkSdk(client)

console.log("Alice is mapped?", await inkSdk.addressIsMapped(ADDRESS.alice))

const pvmFile = Bun.file("./contracts/ballot_sol/3_Ballot_sol_Ballot.polkavm")
console.log("Loading pvm file")
const pvmBytes = await pvmFile.bytes()

const deployer = inkSdk.getDeployer(contracts.ballot, pvmBytes)

const titleToBinary = (title: string) =>
  Binary.fromText(title.slice(0, 32).padStart(32, " "))
const proposalNames = [titleToBinary("Proposal A"), titleToBinary("Proposal B")]

// Example on how to get an estimated deployed address
const estimatedAddress = await deployer.estimateAddress("new", {
  data: {
    proposalNames,
  },
  origin: ADDRESS.alice,
})
console.log("estimated address", estimatedAddress)

// Example on dry-running a contract deployment
console.log("Dry-running deploy")
const dryRunResult = await deployer.dryRun("new", {
  data: {
    proposalNames,
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
  const events = inkSdk.readDeploymentEvents(contracts.ballot, fin.events)
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

const contract = inkSdk.getContract(contracts.ballot, CONTRACT_ADDRESS)

const initialValueResult = await contract.query("winningProposal", {
  origin: ADDRESS.alice,
})
let winning = 0n
if (initialValueResult.success) {
  winning = initialValueResult.value.response.winningProposal_
  console.log(`initial value: ${winning}`)
} else {
  console.log(`initial value request failed`, initialValueResult.value)
}

const giveRight = await contract.query("giveRightToVote", {
  origin: ADDRESS.alice,
  data: {
    voter: "0xf2eb1d64d27105769772753cbf36766def13e947",
  },
})
if (!giveRight.success) {
  console.log(`give right dry-run success request failed`, giveRight.value)
  process.exit(0)
}
console.log(`give right dry-run success`, {
  gas: giveRight.value.gasRequired,
  storageDeposit: giveRight.value.storageDeposit,
  events: giveRight.value.events,
})

// const vote = await contract.query("vote", {
//   origin: ADDRESS.alice,
//   data: {
//     // vote the opposite side
//     proposal: 1n - winning,
//   },
// })
// if (!vote.success) {
//   console.log(`vote dry-run success request failed`, vote.value)
//   process.exit(0)
// }
// console.log(`vote dry-run success`, {
//   gas: vote.value.gasRequired,
//   storageDeposit: vote.value.storageDeposit,
//   events: vote.value.events,
// })

// if (process.argv.includes("vote")) {
//   console.log("voting...")
//   // Note: we could also vote directly without dry-run with `contract.send`, but it would need the storageDeposit / weights.
//   await trackTx(vote.value.send().signSubmitAndWatch(aliceSigner))
//   console.log(`voted!`)
// }

client.destroy()
