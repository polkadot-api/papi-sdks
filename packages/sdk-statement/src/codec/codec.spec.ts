import { describe, expect, it } from "vitest"
import { statementCodec } from "./codec"
import { fromHex } from "@polkadot-api/utils"

describe("statement codec", () => {
  it("encodes and decodes empty statement", () => {
    const emptyStmtEncoded = statementCodec.enc({})
    const emptyStmtDecoded = statementCodec.dec(Uint8Array.from([0]))

    expect(emptyStmtDecoded).toEqual({})
    expect(emptyStmtEncoded).toEqual(Uint8Array.from([0]))
  })

  it("throws on repeated and/or unordered keys", () => {
    expect(() => {
      // [{ priority: 1 }, { priority: 3 }]
      statementCodec.dec(fromHex("0x0802010000000203000000"))
    }).toThrow("entries order")

    expect(() => {
      statementCodec.dec(
        fromHex(
          // [{ channel: [0; 32] }, { priority: 1 }]
          "0x080300000000000000000000000000000000000000000000000000000000000000000201000000",
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
})
