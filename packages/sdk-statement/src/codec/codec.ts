import {
  Bytes,
  CodecType,
  enhanceCodec,
  Enum,
  HexString,
  SizedBytes,
  SizedHex,
  Struct,
  u64,
  Variant,
  Vector,
} from "@polkadot-api/substrate-bindings"

export type Proof = Enum<{
  sr25519: { signature: SizedHex<64>; signer: SizedHex<32> }
  ed25519: { signature: SizedHex<64>; signer: SizedHex<32> }
  ecdsa: { signature: SizedHex<65>; signer: SizedHex<33> }
  onChain: {
    who: SizedHex<32>
    blockHash: SizedHex<32>
    event: bigint
  }
}>

/**
 * Expiry field containing timestamp and sequence number.
 * Upper 32 bits: Unix timestamp in seconds (expiration time)
 * Lower 32 bits: Sequence number (for ordering within same expiry)
 */
export type Expiry = bigint

/**
 * Create an expiry value from timestamp and sequence number.
 * @param timestampSecs Unix timestamp in seconds (expiration time)
 * @param sequence Sequence number for ordering (default: current ms % 0xFFFFFFFF)
 */
export const createExpiry = (
  timestampSecs: number,
  sequence?: number,
): Expiry => {
  const seq = sequence ?? (Date.now() % 0xffffffff)
  return (BigInt(timestampSecs) << 32n) | BigInt(seq)
}

/**
 * Create an expiry value that expires in the given number of seconds.
 * @param seconds Number of seconds until expiration (default: 30)
 * @param sequence Sequence number for ordering (default: current ms % 0xFFFFFFFF)
 */
export const createExpiryFromNow = (
  seconds: number = 30,
  sequence?: number,
): Expiry => {
  const timestampSecs = Math.floor(Date.now() / 1000) + seconds
  return createExpiry(timestampSecs, sequence)
}

/**
 * Extract the timestamp and sequence from an expiry value.
 */
export const parseExpiry = (
  expiry: Expiry,
): { timestampSecs: number; sequence: number } => ({
  timestampSecs: Number(expiry >> 32n),
  sequence: Number(expiry & 0xffffffffn),
})

export type Statement = Partial<{
  proof: Proof
  expiry: Expiry
  decryptionKey: SizedHex<32>
  channel: SizedHex<32>
  topics: Array<SizedHex<32>>
  data: Uint8Array
}>

const sortIdxs = {
  proof: 0,
  expiry: 2,
  decryptionKey: 3,
  topics: 4,
  topic1: 4,
  topic2: 5,
  channel: 6,
  data: 8,
}

export type UnsignedStatement = Omit<Statement, "proof">
export type SignedStatement = UnsignedStatement & { proof: Proof }

const bin32 = SizedBytes(32)
const bin64 = SizedBytes(64)

/**
 * Field variants for the new statement store format.
 * Variant indices must match the expected tag bytes:
 * - proof: 0
 * - (reserved): 1
 * - expiry: 2
 * - decryptionKey: 3
 * - topic1: 4
 * - topic2: 5
 * - channel: 6
 * - (reserved): 7
 * - data: 8
 */
const field = Variant({
  proof: Variant({
    sr25519: Struct({ signature: bin64, signer: bin32 }),
    ed25519: Struct({ signature: bin64, signer: bin32 }),
    ecdsa: Struct({ signature: SizedBytes(65), signer: SizedBytes(33) }),
    onChain: Struct({ who: bin32, blockHash: bin32, event: u64 }),
  }),
  _reserved1: bin32, // Placeholder for index 1
  expiry: u64,
  decryptionKey: bin32,
  topic1: bin32,
  topic2: bin32,
  channel: bin32,
  _reserved7: bin32, // Placeholder for index 7
  data: Bytes(),
})
const innerStatement = Vector(field)

export const statementCodec = enhanceCodec<
  CodecType<typeof innerStatement>,
  Statement
>(
  innerStatement,
  (stmt: Statement) => {
    const statement: CodecType<typeof innerStatement> = []
    ;(Object.keys(stmt) as Array<keyof Statement>)
      .sort((a, b) => sortIdxs[a] - sortIdxs[b])
      .forEach((k) => {
        if (k === "topics") {
          if (stmt[k]!.length > 2)
            throw new Error(
              `Max topics length is 2. Received ${stmt[k]?.length}`,
            )
          stmt[k]!.forEach((v: SizedHex<32>, i: number) => {
            statement.push(Enum(`topic${i + 1}` as `topic${1 | 2}`, v))
          })
        } else {
          statement.push(Enum(k, stmt[k]!))
        }
      })
    return statement
  },
  (stmt: CodecType<typeof innerStatement>) => {
    const statement: Statement = {}
    let maxTopicChecked = 0
    let maxIdx = -1
    stmt.forEach((v: (typeof stmt)[number]) => {
      // ensure order and no repetition
      const idx = sortIdxs[v.type as keyof typeof sortIdxs]
      if (idx <= maxIdx) throw new Error("Unexpected entries order")
      maxIdx = idx

      if (!v.type.startsWith("topic")) {
        ;(statement as any)[v.type] = v.value
      } else if (v.type !== `topic${++maxTopicChecked}`) {
        throw new Error(`Unexpected ${v.type}`)
      } else {
        statement.topics ??= []
        statement.topics?.push(v.value as HexString)
      }
    })
    return statement
  },
)
