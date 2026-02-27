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

export type Statement = Partial<{
  proof: Proof
  /** @deprecated Experimental feature, may be removed/changed in future releases */
  decryptionKey: SizedHex<32>
  expiry: bigint
  channel: SizedHex<32>
  topics: Array<SizedHex<32>>
  data: Uint8Array
}>

const sortIdxs = {
  proof: 0,
  decryptionKey: 1,
  expiry: 2,
  channel: 3,
  topics: 4,
  topic1: 4,
  topic2: 5,
  topic3: 6,
  topic4: 7,
  data: 8,
}

export type UnsignedStatement = Omit<Statement, "proof">
export type SignedStatement = UnsignedStatement & { proof: Proof }

const bin32 = SizedBytes(32)
const bin64 = SizedBytes(64)

const field = Variant({
  proof: Variant({
    sr25519: Struct({ signature: bin64, signer: bin32 }),
    ed25519: Struct({ signature: bin64, signer: bin32 }),
    ecdsa: Struct({ signature: SizedBytes(65), signer: SizedBytes(33) }),
    onChain: Struct({ who: bin32, blockHash: bin32, event: u64 }),
  }),
  decryptionKey: bin32,
  expiry: u64,
  channel: bin32,
  topic1: bin32,
  topic2: bin32,
  topic3: bin32,
  topic4: bin32,
  data: Bytes(),
})
const innerStatement = Vector(field)

export const statementCodec = enhanceCodec<
  CodecType<typeof innerStatement>,
  Statement
>(
  innerStatement,
  (stmt) => {
    const statement: CodecType<typeof innerStatement> = []
    ;(Object.keys(stmt) as Array<keyof Statement>)
      .sort((a, b) => sortIdxs[a] - sortIdxs[b])
      .forEach((k) => {
        if (k === "topics") {
          if (stmt[k]!.length > 4)
            throw new Error(
              `Max topics length is 4. Received ${stmt[k]?.length}`,
            )
          stmt[k]!.forEach((v, i) => {
            statement.push(Enum(`topic${i + 1}` as `topic${1 | 2 | 3 | 4}`, v))
          })
        } else {
          statement.push(Enum(k, stmt[k]!))
        }
      })
    return statement
  },
  (stmt) => {
    const statement: Statement = {}
    let maxTopicChecked = 0
    let maxIdx = -1
    stmt.forEach((v) => {
      // ensure order and no repetition
      const idx = sortIdxs[v.type]
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
