import {
  createStatementSdk,
  getStatementSigner,
  stringToTopic,
  type Statement,
} from "@polkadot-api/sdk-statement"
import { Binary, Blake2256 } from "@polkadot-api/substrate-bindings"
import { getPublicKey, sign } from "@scure/sr25519"
import { jsonSerialize, mergeUint8 } from "polkadot-api/utils"

// use any key
const ALICE_SK = Binary.fromHex(process.env.ALICE_SK!)
const alice = getStatementSigner(getPublicKey(ALICE_SK), "sr25519", (p) =>
  sign(ALICE_SK, p, Blake2256(mergeUint8([ALICE_SK, p]))),
)

const sdk = createStatementSdk("ws://127.0.0.1:9936")

// BUILD STATEMENT
const stmt1: Statement = {
  decryptionKey: stringToTopic("key"),
  expiry: {
    timestampSecs: (Date.now() + 3600000) / 1000,
    sequence: 0,
  },
  topics: [stringToTopic("1"), stringToTopic("2")],
  data: Binary.fromText("TEST 1"),
}

// SIGN AND SUBMIT STATEMENT
const signed1 = await alice.sign(stmt1)
console.log(await sdk.submit(signed1))

console.log(
  JSON.stringify(
    await sdk.getPosted(
      [stringToTopic("1"), stringToTopic("2")],
      stringToTopic("key"),
    ),
    jsonSerialize,
  ),
)

// GET ALL STATEMENTS (i.e. `dump`)
console.log(JSON.stringify(await sdk.getStatements(), jsonSerialize))
