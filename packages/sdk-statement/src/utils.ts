import {
  Binary,
  Blake2256,
  FixedSizeBinary,
} from "@polkadot-api/substrate-bindings"
import { Statement } from "./codec"

export const stringToTopic = (str: string): FixedSizeBinary<32> => {
  const enc = Binary.fromText(str).asBytes()
  return Binary.fromBytes(Blake2256(enc))
}

export const filterDecKey = (key?: FixedSizeBinary<32>) => {
  if (!key) return () => true
  const hexKey = key.asHex()
  return (v: Statement) => v.decryptionKey?.asHex() === hexKey
}

export const filterTopics = (topics?: Array<FixedSizeBinary<32>>) => {
  if (!topics) return () => true
  const hexTopics = topics.map((v) => v.asHex())
  return (v: Statement) =>
    (v.topics?.length ?? 0) >= hexTopics.length &&
    hexTopics.every((top, idx) => top === v.topics![idx].asHex())
}
