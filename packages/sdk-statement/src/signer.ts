import { Binary, compact, Enum } from "@polkadot-api/substrate-bindings"
import { SignedStatement, Statement, statementCodec } from "./codec"

export const getStatementSigner = (
  publicKey: Uint8Array,
  type: "ed25519" | "sr25519" | "ecdsa",
  signFn: (payload: Uint8Array) => Uint8Array,
) => ({
  publicKey,
  sign: (stmt: Statement): SignedStatement => {
    if (stmt.proof) throw new Error("Statement already signed")
    const encoded = statementCodec.enc(stmt)
    const compactLen = compact.enc(compact.dec(encoded)).length
    const signature = signFn(encoded.slice(compactLen))
    const result = statementCodec.dec(encoded)
    result.proof = Enum(type, {
      signature: Binary.fromBytes(signature),
      signer: Binary.fromBytes(publicKey),
    })
    return result as SignedStatement
  },
})
