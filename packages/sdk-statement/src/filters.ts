import { SizedHex } from "polkadot-api"
import { Statement } from "./codec"
import { TopicFilter } from "./types"

export const topicFilter = (topics: Array<SizedHex<32>>): TopicFilter => ({
  matchAll: topics,
})

export const filterBroadcasts = () => (stmt: Statement) =>
  stmt.decryptionKey === undefined
export const filterPosted = (dest: SizedHex<32>) => (stmt: Statement) =>
  stmt.decryptionKey === dest
