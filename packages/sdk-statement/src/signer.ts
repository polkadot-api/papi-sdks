import { compact, Enum } from "@polkadot-api/substrate-bindings"
import { Binary } from "polkadot-api"
import { SignedStatement, Statement, UnsignedStatement, statementCodec } from "./codec"

export const getStatementSigner = (
  publicKey: Uint8Array,
  type: "ed25519" | "sr25519" | "ecdsa",
  signFn: (payload: Uint8Array) => Promise<Uint8Array> | Uint8Array,
) => ({
  publicKey,
  sign: async (stmt: UnsignedStatement): Promise<SignedStatement> => {
    if ((stmt as Statement).proof) throw new Error("Statement already signed")

    const encoded = statementCodec.enc(stmt)
    const compactLen = compact.enc(compact.dec(encoded)).length
    const signature = await signFn(encoded.slice(compactLen))

    const result = statementCodec.dec(encoded) as Statement
    result.proof = Enum(type, {
      signature: Binary.toHex(signature) as any,
      signer: Binary.toHex(publicKey) as any,
    })
    return result as SignedStatement
  },
})
