import {
  Binary,
  Blake2256,
  FixedSizeBinary,
} from "@polkadot-api/substrate-bindings"

export const strTopic = (str: string): FixedSizeBinary<32> => {
  const enc = Binary.fromText(str).asBytes()
  return Binary.fromBytes(Blake2256(enc))
}
