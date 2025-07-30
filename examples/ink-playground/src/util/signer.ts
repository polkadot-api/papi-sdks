import { sr25519CreateDerive } from "@polkadot-labs/hdkd"
import {
  entropyToMiniSecret,
  mnemonicToEntropy,
} from "@polkadot-labs/hdkd-helpers"
import { AccountId } from "polkadot-api"
import { getPolkadotSigner } from "polkadot-api/signer"

const alice_mnemonic =
  "bottom drive obey lake curtain smoke basket hold race lonely fit walk"
const entropy = mnemonicToEntropy(alice_mnemonic)
const miniSecret = entropyToMiniSecret(entropy)
const derive = sr25519CreateDerive(miniSecret)
const alice = derive("//Oliva")
export const aliceSigner = getPolkadotSigner(
  alice.publicKey,
  "Sr25519",
  alice.sign,
)
