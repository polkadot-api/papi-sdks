import {
  CodecType,
  enhanceCodec,
  Enum,
  SizedHex,
  Struct,
  u32,
  u64,
  Variant,
  Vector,
  Bytes,
} from "@polkadot-api/substrate-bindings"
import { Binary } from "polkadot-api"

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
  decryptionKey: SizedHex<32>
  priority: number
  channel: SizedHex<32>
  topics: Array<SizedHex<32>>
  data: Uint8Array
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

const bin32 = Bytes(32)
const bin64 = Bytes(64)

const field = Variant({
  proof: Variant({
    sr25519: Struct({ signature: bin64, signer: bin32 }),
    ed25519: Struct({ signature: bin64, signer: bin32 }),
    ecdsa: Struct({ signature: Bytes(65), signer: Bytes(33) }),
    onChain: Struct({ who: bin32, blockHash: bin32, event: u64 }),
  }),
  decryptionKey: bin32,
  priority: u32,
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
            // Convert SizedHex (string) to Uint8Array for encoding
            statement.push(Enum(`topic${i + 1}` as `topic${1 | 2 | 3 | 4}`, Binary.fromHex(v)))
          })
        } else {
          // Convert SizedHex fields to Uint8Array
          const value = stmt[k]!
          const convertedValue = typeof value === "string" ? Binary.fromHex(value) : value
          statement.push(Enum(k, convertedValue as any))
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
        // Convert Uint8Array back to SizedHex (string) for supported fields
        const value = v.value
        if (v.type === "decryptionKey" || v.type === "channel") {
          ;(statement as any)[v.type] = Binary.toHex(value as Uint8Array)
        } else {
          ;(statement as any)[v.type] = value
        }
      } else if (v.type !== `topic${++maxTopicChecked}`) {
        throw new Error(`Unexpected ${v.type}`)
      } else {
        statement.topics ??= []
        // Convert Uint8Array to SizedHex (hex string)
        statement.topics?.push(Binary.toHex(v.value as Uint8Array) as SizedHex<32>)
      }
    })
    return statement
  },
)
