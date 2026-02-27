import { Binary, Blake2256, SizedHex } from "@polkadot-api/substrate-bindings"
import { Statement } from "./codec"

export const stringToTopic = (str: string): SizedHex<32> => {
  const enc = Binary.fromText(str) // Returns Uint8Array directly
  return Binary.toHex(Blake2256(enc)) as SizedHex<32> // SizedHex is now SizedHex (string)
}

export const filterDecKey = (key?: SizedHex<32>) => {
  if (!key) return () => true
  const hexKey = key // Already a hex string (SizedHex)
  return (v: Statement) => v.decryptionKey === hexKey
}

export const filterTopics = (topics?: Array<SizedHex<32>>) => {
  if (!topics) return () => true
  const hexTopics = topics // Already hex strings (SizedHex)
  return (v: Statement) =>
    (v.topics?.length ?? 0) >= hexTopics.length &&
    hexTopics.every((top, idx) => top === v.topics![idx])
}

/**
 * Create an expiry value from timestamp and sequence number.
 *
 * @param expirationTimestampSecs Expiration time in seconds since UNIX epoch.
 * @param sequenceNumber          Sequence number for ordering (0-4294967295).
 */
export const createExpiry = (
  expirationTimestampSecs: number,
  sequenceNumber: number = 0,
): bigint => (BigInt(expirationTimestampSecs) << 32n) | BigInt(sequenceNumber)

/**
 * Parse an expiry value into its components.
 *
 * @param expiry The expiry value to parse.
 */
export const parseExpiry = (
  expiry: bigint,
): { timestamp: number; sequence: number } => ({
  timestamp: Number(expiry >> 32n),
  sequence: Number(expiry & 0xffffffffn),
})

/**
 * Create an expiry value that expires after a given duration.
 *
 * @param durationSecs   Duration in seconds from now.
 * @param sequenceNumber Optional sequence number (default 0).
 */
export const createExpiryFromDuration = (
  durationSecs: number,
  sequenceNumber: number = 0,
): bigint => {
  const timestamp = Math.floor(Date.now() / 1000) + durationSecs
  return createExpiry(timestamp, sequenceNumber)
}

/**
 * Check if an expiry value has expired.
 *
 * @param expiry The expiry value to check.
 */
export const isExpired = (expiry: bigint): boolean => {
  const { timestamp } = parseExpiry(expiry)
  return timestamp < Math.floor(Date.now() / 1000)
}
