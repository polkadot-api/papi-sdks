import { Binary, Blake2256, SizedHex } from "@polkadot-api/substrate-bindings"

export const stringToTopic = (str: string): SizedHex<32> => {
  const enc = Binary.fromText(str)
  return Binary.toHex(Blake2256(enc))
}
