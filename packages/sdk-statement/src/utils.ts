import {
  Binary,
  Blake2256,
  SizedHex,
} from "@polkadot-api/substrate-bindings"
import { Statement } from "./codec"

export const stringToTopic = (str: string): SizedHex<32> => {
  const enc = Binary.fromText(str)  // Returns Uint8Array directly
  return Binary.toHex(Blake2256(enc)) as SizedHex<32>  // SizedHex is now SizedHex (string)
}

export const filterDecKey = (key?: SizedHex<32>) => {
  if (!key) return () => true
  const hexKey = key  // Already a hex string (SizedHex)
  return (v: Statement) => v.decryptionKey === hexKey
}

export const filterTopics = (topics?: Array<SizedHex<32>>) => {
  if (!topics) return () => true
  const hexTopics = topics  // Already hex strings (SizedHex)
  return (v: Statement) =>
    (v.topics?.length ?? 0) >= hexTopics.length &&
    hexTopics.every((top, idx) => top === v.topics![idx])
}
