import { Binary, Blake2256, SizedHex } from "@polkadot-api/substrate-bindings"
import { Statement } from "./codec"

export const stringToTopic = (str: string): SizedHex<32> =>
  Binary.toHex(Blake2256(Binary.fromText(str))) as SizedHex<32>

export const filterDecKey = (key?: SizedHex<32> | null) => {
  if (key === undefined) return () => true
  if (key === null) return (v: Statement) => v.decryptionKey === undefined
  return (v: Statement) => v.decryptionKey === key
}

export const filterTopics = (topics?: Array<SizedHex<32>>) => {
  if (!topics) return () => true
  return (v: Statement) =>
    (v.topics?.length ?? 0) >= topics.length &&
    topics.every((t, i) => t === v.topics![i])
}
