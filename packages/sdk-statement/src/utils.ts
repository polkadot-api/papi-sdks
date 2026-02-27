import { Binary, Blake2256, SizedHex } from "@polkadot-api/substrate-bindings"
import { Statement } from "./codec"

export const stringToTopic = (str: string): SizedHex<32> => {
  const enc = Binary.fromText(str) // Returns Uint8Array directly
  return Binary.toHex(Blake2256(enc)) as SizedHex<32> // SizedHex is now SizedHex (string)
}

/**
 * Create a filter function for decryption key.
 * @param key If undefined, returns all statements. If null, returns statements without decryptionKey.
 */
export const filterDecKey = (key?: SizedHex<32> | null) => {
  if (key === undefined) return () => true
  if (key === null) return (v: Statement) => v.decryptionKey === undefined
  return (v: Statement) => v.decryptionKey === key
}

export const filterTopics = (topics?: Array<SizedHex<32>>) => {
  if (!topics) return () => true
  const hexTopics = topics // Already hex strings (SizedHex)
  return (v: Statement) =>
    (v.topics?.length ?? 0) >= hexTopics.length &&
    hexTopics.every((top, idx) => top === v.topics![idx])
}
