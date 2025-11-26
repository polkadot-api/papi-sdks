import { createClient } from "@polkadot-api/substrate-client"
import {
  createStatementSdk,
  getStatementSigner,
  stringToTopic,
  type Statement,
} from "@polkadot-api/sdk-statement"
import { getWsProvider } from "@polkadot-api/ws-provider"
import { sign, getPublicKey } from "@scure/sr25519"
import { fromHex, jsonPrint } from "@polkadot-api/utils"
import { Binary } from "@polkadot-api/substrate-bindings"

// use any key
const ALICE_SK = fromHex(process.env.ALICE_SK!)
const alice = getStatementSigner(getPublicKey(ALICE_SK), "sr25519", (p) =>
  sign(ALICE_SK, p),
)

const client = createClient(getWsProvider("ws://127.0.0.1:9936"))

const sdk = createStatementSdk(client.request)

// BUILD STATEMENT
const stmt1: Statement = {
  decryptionKey: stringToTopic("key"),
  topics: [stringToTopic("1"), stringToTopic("2")],
  data: Binary.fromText("TEST 1"),
}

// SIGN AND SUBMIT STATEMENT
const signed1 = await alice.sign(stmt1)
await sdk.submit(signed1)

console.log(
  jsonPrint(
    await sdk.getStatements({
      dest: stringToTopic("key"),
      topics: [stringToTopic("1"), stringToTopic("2")],
    }),
  ),
)

// GET ALL STATEMENTS (i.e. `dump`)
console.log(jsonPrint(await sdk.getStatements()))

client.destroy()
