import { compact, Enum } from "@polkadot-api/substrate-bindings"
import { Binary } from "polkadot-api"
import { SignedStatement, Statement, statementCodec } from "./codec"

export const getStatementSigner = (
  publicKey: Uint8Array,
  type: "ed25519" | "sr25519" | "ecdsa",
  signFn: (payload: Uint8Array) => Promise<Uint8Array> | Uint8Array,
) => ({
  publicKey,
  sign: async (stmt: Statement): Promise<SignedStatement> => {
    if (stmt.proof) throw new Error("Statement already signed")
    const encoded = statementCodec.enc(stmt)
    const compactLen = compact.enc(compact.dec(encoded)).length
    const signature = await signFn(encoded.slice(compactLen))
    const result = statementCodec.dec(encoded)
    result.proof = Enum(type, {
      signature: Binary.toHex(signature) as any,  // SizedHex<64> or SizedHex<65>
      signer: Binary.toHex(publicKey) as any,  // SizedHex<32> or SizedHex<33>
    })
    return result as SignedStatement
  },
})
