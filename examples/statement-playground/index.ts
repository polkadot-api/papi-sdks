import { createClient, RpcError } from "@polkadot-api/substrate-client"
import {
  createStatementSdk,
  getStatementSigner,
  strTopic,
  type Statement,
} from "@polkadot-api/sdk-statement"
import { getWsProvider } from "@polkadot-api/ws-provider"
import { sign, getPublicKey } from "@scure/sr25519"
import { fromHex, jsonPrint } from "polkadot-api/utils"
import { Binary } from "polkadot-api"

const ALICE_SK = fromHex(process.env.ALICE_SK!)
const alice = getStatementSigner("sr25519", getPublicKey(ALICE_SK), (p) =>
  sign(ALICE_SK, p),
)

const client = createClient(getWsProvider("ws://127.0.0.1:9936"))

const sdk = createStatementSdk(client.request)

const stmt1: Statement = {
  data: Binary.fromText("TEST 1"),
  channel: strTopic("AliceTest"),
  priority: 1,
}
const stmt2: Statement = {
  data: Binary.fromText("TEST 2"),
  channel: strTopic("AliceTest"),
  priority: 1,
}
const signed1 = alice.sign(stmt1)
const signed2 = alice.sign(stmt2)
try {

  await sdk.submit(signed1)
}catch (e){
  (e as RpcError).
  console.log(Object)
}
// console.log(jsonPrint(await sdk.dump()))
// await sdk.submit(signed2)
// console.log(jsonPrint(await sdk.dump()))
