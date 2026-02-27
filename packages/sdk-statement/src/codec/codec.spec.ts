import { describe, expect, it } from "vitest"
import { statementCodec } from "./codec"
import { fromHex, toHex } from "@polkadot-api/utils"

describe("statement codec", () => {
  it("encodes and decodes empty statement", () => {
    const emptyStmtEncoded = statementCodec.enc({})
    const emptyStmtDecoded = statementCodec.dec(Uint8Array.from([0]))

    expect(emptyStmtDecoded).toEqual({})
    expect(emptyStmtEncoded).toEqual(Uint8Array.from([0]))
  })

  it("throws on repeated and/or unordered keys", () => {
    expect(() => {
      // [{ expiry: 1 }, { expiry: 3 }]
      statementCodec.dec(
        fromHex("0x0802010000000000000002030000000000000000"),
      )
    }).toThrow("entries order")

    expect(() => {
      statementCodec.dec(
        fromHex(
          // [{ channel: [0; 32] }, { expiry: 1 }]
          "0x0803000000000000000000000000000000000000000000000000000000000000000002010000000000000000",
        ),
      )
    }).toThrow("entries order")
  })

  it("throws on missing topics", () => {
    expect(() => {
      statementCodec.dec(
        fromHex(
          // [{ topic2: [0; 32] }]
          "0x04050000000000000000000000000000000000000000000000000000000000000000",
        ),
      )
    }).toThrow("Unexpected topic")
  })

  it("encodes and decodes statement with expiry", () => {
    const stmt = { expiry: 12345678901234567890n }
    const encoded = statementCodec.enc(stmt)
    const decoded = statementCodec.dec(encoded)
    expect(decoded.expiry).toBe(12345678901234567890n)
  })

  it("encodes expiry as u64 little-endian", () => {
    const stmt = { expiry: 1n }
    const encoded = statementCodec.enc(stmt)
    // [compact length=1 (0x04)][variant=0x02][u64 LE = 01 00 00 00 00 00 00 00]
    expect(toHex(encoded)).toBe("0x04020100000000000000")
  })
})
