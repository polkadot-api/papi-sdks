import { compact, Enum } from "@polkadot-api/substrate-bindings"
import { Binary } from "polkadot-api"
import { SignedStatement, Statement, UnsignedStatement, statementCodec } from "./codec"

/**
 * Create a statement signer.
 *
 * @param publicKey The signer's public key
 * @param type The signature type ("sr25519", "ed25519", or "ecdsa")
 * @param signFn Function to sign a payload with the private key
 */
export const getStatementSigner = (
  publicKey: Uint8Array,
  type: "ed25519" | "sr25519" | "ecdsa",
  signFn: (payload: Uint8Array) => Promise<Uint8Array> | Uint8Array,
) => ({
  publicKey,

  /**
   * Sign a statement.
   *
   * @param stmt The statement to sign (must not already have a proof)
   * @returns The signed statement with proof attached
   */
  sign: async (stmt: UnsignedStatement): Promise<SignedStatement> => {
    if ((stmt as Statement).proof) throw new Error("Statement already signed")

    const encoded = statementCodec.enc(stmt)
    // Skip the compact length prefix to get the actual fields to sign
    const compactLen = compact.enc(compact.dec(encoded)).length
    const signature = await signFn(encoded.slice(compactLen))

    const result = statementCodec.dec(encoded) as Statement
    result.proof = Enum(type, {
      signature: Binary.toHex(signature) as any, // SizedHex<64> or SizedHex<65>
      signer: Binary.toHex(publicKey) as any, // SizedHex<32> or SizedHex<33>
    })
    return result as SignedStatement
  },
})
