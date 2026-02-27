import { describe, expect, it } from "vitest"
import {
  statementCodec,
  createExpiry,
  createExpiryFromNow,
  parseExpiry,
  Statement,
} from "./codec"
import { fromHex } from "@polkadot-api/utils"

describe("statement codec", () => {
  it("encodes and decodes empty statement", () => {
    const emptyStmtEncoded = statementCodec.enc({})
    const emptyStmtDecoded = statementCodec.dec(Uint8Array.from([0]))

    expect(emptyStmtDecoded).toEqual({})
    expect(emptyStmtEncoded).toEqual(Uint8Array.from([0]))
  })

  it("encodes and decodes statement with expiry", () => {
    const expiry = createExpiry(1700000000, 12345)
    const stmt: Statement = { expiry }
    const encoded = statementCodec.enc(stmt)
    const decoded = statementCodec.dec(encoded) as Statement

    expect(decoded.expiry).toBe(expiry)
  })

  it("throws on repeated and/or unordered keys", () => {
    expect(() => {
      // [{ expiry: 1 }, { expiry: 3 }] - expiry is index 2
      // Tag 2 (expiry) + u64 value + Tag 2 again
      statementCodec.dec(
        fromHex("0x0802010000000000000002030000000000000000"),
      )
    }).toThrow("entries order")

    expect(() => {
      statementCodec.dec(
        fromHex(
          // [{ channel: [0; 32] }, { expiry: 1 }] - channel is index 6, expiry is 2
          // Tag 6 (channel) + 32 bytes + Tag 2 (expiry) - wrong order!
          "0x08060000000000000000000000000000000000000000000000000000000000000000020100000000000000",
        ),
      )
    }).toThrow("entries order")
  })

  it("throws on missing topics", () => {
    expect(() => {
      statementCodec.dec(
        fromHex(
          // [{ topic2: [0; 32] }] - topic2 is index 5
          "0x04050000000000000000000000000000000000000000000000000000000000000000",
        ),
      )
    }).toThrow("Unexpected topic")
  })

  it("encodes topics in correct order", () => {
    const topic1 =
      "0x1111111111111111111111111111111111111111111111111111111111111111" as const
    const topic2 =
      "0x2222222222222222222222222222222222222222222222222222222222222222" as const

    const stmt: Statement = { topics: [topic1, topic2] }
    const encoded = statementCodec.enc(stmt)
    const decoded = statementCodec.dec(encoded) as Statement

    expect(decoded.topics).toHaveLength(2)
    expect(decoded.topics![0]).toBe(topic1)
    expect(decoded.topics![1]).toBe(topic2)
  })

  it("throws on more than 2 topics", () => {
    const topic =
      "0x1111111111111111111111111111111111111111111111111111111111111111" as const

    expect(() => {
      statementCodec.enc({ topics: [topic, topic, topic] })
    }).toThrow("Max topics length is 2")
  })
})

describe("expiry helpers", () => {
  it("creates expiry from timestamp and sequence", () => {
    const expiry = createExpiry(1700000000, 12345)
    const parsed = parseExpiry(expiry)

    expect(parsed.timestampSecs).toBe(1700000000)
    expect(parsed.sequence).toBe(12345)
  })

  it("creates expiry from now", () => {
    const before = Math.floor(Date.now() / 1000) + 30
    const expiry = createExpiryFromNow(30)
    const after = Math.floor(Date.now() / 1000) + 30

    const parsed = parseExpiry(expiry)
    expect(parsed.timestampSecs).toBeGreaterThanOrEqual(before)
    expect(parsed.timestampSecs).toBeLessThanOrEqual(after)
  })
})
