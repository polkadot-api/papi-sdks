import { contracts, testAzero } from "@polkadot-api/descriptors"
import { createInkSdk } from "@polkadot-api/sdk-ink"
import { sr25519CreateDerive } from "@polkadot-labs/hdkd"
import {
  entropyToMiniSecret,
  mnemonicToEntropy,
} from "@polkadot-labs/hdkd-helpers"
import { Binary, createClient } from "polkadot-api"
import { withPolkadotSdkCompat } from "polkadot-api/polkadot-sdk-compat"
import { getPolkadotSigner } from "polkadot-api/signer"
import { getWsProvider } from "polkadot-api/ws-provider/web"
import { ADDRESS, aliceSigner } from "./address"

const alice_mnemonic =
  "bottom drive obey lake curtain smoke basket hold race lonely fit walk"
const entropy = mnemonicToEntropy(alice_mnemonic)
const miniSecret = entropyToMiniSecret(entropy)
const derive = sr25519CreateDerive(miniSecret)
const alice = derive("//Alice")
const signer = getPolkadotSigner(alice.publicKey, "Sr25519", alice.sign)

const client = createClient(
  withPolkadotSdkCompat(
    getWsProvider("wss://aleph-zero-testnet-rpc.dwellir.com"),
  ),
)

const typedApi = client.getTypedApi(testAzero)
const psp22Sdk = createInkSdk(typedApi, contracts.psp22)
const psp22Contract = psp22Sdk.getContract(ADDRESS.psp22)

console.log("is compatible", await psp22Contract.isCompatible())

// Nested storage query
{
  console.log("Query storage of psp22 contract")
  const storage = await psp22Contract.getStorage().getRoot()

  if (storage.success && storage.value) {
    console.log("total supply", storage.value.data.total_supply)
    const aliceBalance = await storage.value.data.balances(
      "5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY",
    )
    console.log("alice balance", aliceBalance)
  } else {
    console.log("error", storage.value)
  }
}

// Query for some information through a message
{
  console.log("get_nft")
  const result = await psp22Contract.query("PSP22::balance_of", {
    origin: ADDRESS.alice,
    data: {
      owner: ADDRESS.alice,
    },
  })

  if (result.success) {
    console.log("balance of alice", result.value.response)
    console.log("events", result.value.events)
  } else {
    console.log("error", result.value)
  }
}

// Dry run
{
  console.log("IncreaseAllowance")
  const data = {
    spender: ADDRESS.psp22,
    delta_value: 10n,
  }
  const result = await psp22Contract.query("PSP22::increase_allowance", {
    origin: ADDRESS.alice,
    data,
  })

  if (result.success) {
    console.log("IncreaseAllowance success")
    console.log("events", result.value.events)

    if (result.value.events.length) {
      console.log("sending transaction")
      const realDeal = await psp22Contract
        .send("PSP22::increase_allowance", {
          origin: ADDRESS.alice,
          data,
        })
        .signAndSubmit(aliceSigner)

      if (realDeal.ok) {
        console.log("block", realDeal.block)
        console.log("events", psp22Contract.filterEvents(realDeal.events))
      } else {
        console.log("error", realDeal.dispatchError)
      }
    }
  } else {
    console.log("error", result.value)
  }
}

{
  console.log("Perform transaction")
  const data = {
    spender: ADDRESS.alice,
    delta_value: 100n,
  }

  console.log("dry run")
  const result = await psp22Contract.query("PSP22::increase_allowance", {
    origin: ADDRESS.alice,
    data,
  })

  if (result.success) {
    result.value.events
    console.log("dry run success", result)
    console.log("sending transaction")
    const txResult = await psp22Contract
      .send("PSP22::increase_allowance", {
        gasLimit: result.value.gasRequired,
        data,
      })
      .signAndSubmit(signer)

    if (!txResult.ok) {
      console.log("error", txResult.dispatchError)
    } else {
      console.log(txResult)
    }
  } else {
    console.log("error", result.value)
  }
}

{
  console.log("Redeploy contract")
  const data = {
    decimals: 9,
    supply: 1_000_000_000_000n,
    name: "PAPI-Redeploy",
    symbol: "PAPI-R",
  }
  const salt = Binary.fromHex("0x00")
  // const result = await psp22Contract.dryRunRedeploy("new", {
  //   data,
  //   origin: ADDRESS.alice,
  //   options: {
  //     salt,
  //   },
  // })

  // if (result.success) {
  //   console.log("redeploy dry run", result)

  // We can pass `origin`, and the sdk will do the dry-run to calculate the estimated weight for us.
  const txResult = await psp22Contract
    .redeploy("new", {
      data,
      origin: ADDRESS.alice,
      options: {
        salt,
      },
    })
    .signAndSubmit(signer)

  const deployment = psp22Sdk.readDeploymentEvents(
    ADDRESS.alice,
    txResult.events,
  )
  console.log("deployment", txResult, deployment)
  // } else {
  //   console.log(result.value)
  // }
}

client.destroy()
