import {
  Bin,
  Binary,
  CodecType,
  enhanceCodec,
  Enum,
  FixedSizeBinary,
  Struct,
  u32,
  u64,
  Variant,
  Vector,
} from "@polkadot-api/substrate-bindings"

export type Proof = Enum<{
  sr25519: { signature: FixedSizeBinary<64>; signer: FixedSizeBinary<32> }
  ed25519: { signature: FixedSizeBinary<64>; signer: FixedSizeBinary<32> }
  ecdsa: { signature: FixedSizeBinary<65>; signer: FixedSizeBinary<33> }
  onChain: {
    who: FixedSizeBinary<32>
    blockHash: FixedSizeBinary<32>
    event: bigint
  }
}>

export type Statement = Partial<{
  proof: Proof
  decryptionKey: FixedSizeBinary<32>
  priority: number
  channel: FixedSizeBinary<32>
  topics: Array<FixedSizeBinary<32>>
  data: Binary
}>

const sortIdxs = {
  proof: 0,
  decryptionKey: 1,
  priority: 2,
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

const bin32 = Bin(32)
const bin64 = Bin(64)

const field = Variant({
  proof: Variant({
    sr25519: Struct({ signature: bin64, signer: bin32 }),
    ed25519: Struct({ signature: bin64, signer: bin32 }),
    ecdsa: Struct({ signature: Bin(65), signer: Bin(33) }),
    onChain: Struct({ who: bin32, blockHash: bin32, event: u64 }),
  }),
  decryptionKey: bin32,
  priority: u32,
  channel: bin32,
  topic1: bin32,
  topic2: bin32,
  topic3: bin32,
  topic4: bin32,
  data: Bin(),
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
        } else statement.push(Enum(k, stmt[k]!))
      })
    return statement
  },
  (stmt) => {
    const statement: Statement = {}
    const seenIdxs: Array<(typeof stmt)[number]["type"]> = []
    let maxTopicChecked = 0
    stmt.forEach((v) => {
      seenIdxs.push(v.type)
      if (v.type.startsWith("topic")) {
        if (v.type !== `topic${++maxTopicChecked}`)
          throw new Error(`Unexpected ${v.type}`)
        // first topic
        if (maxTopicChecked === 1) statement.topics = []
        statement.topics?.push(v.value as Binary)
      } else (statement as any)[v.type] = v.value
    })
    let maxIdx = -1
    // ensure order and no repetition
    seenIdxs.forEach((v) => {
      const idx = sortIdxs[v]
      if (idx <= maxIdx) throw new Error("Unexpected entries order")
      maxIdx = idx
    })
    return statement
  },
)
