import { ed25519 } from "@noble/curves/ed25519"
import { AccountId } from "polkadot-api"
import { getPolkadotSigner } from "polkadot-api/signer"

const acId = AccountId(0)
export const signer1 = getPolkadotSigner(
  ed25519.getPublicKey(Bun.env.SK1 as string),
  "Ed25519",
  (i) => ed25519.sign(i, Bun.env.SK1 as string),
)
export const addr1 = acId.dec(signer1.publicKey)
export const signer2 = getPolkadotSigner(
  ed25519.getPublicKey(Bun.env.SK2 as string),
  "Ed25519",
  (i) => ed25519.sign(i, Bun.env.SK2 as string),
)
export const addr2 = acId.dec(signer2.publicKey)
