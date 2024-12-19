import { XcmV3Junction } from "@/descriptors"
import { Binary, Enum } from "polkadot-api"

export const CHAINS = {
  paseo: [
    XcmV3Junction.GlobalConsensus(
      Enum(
        "ByGenesis",
        Binary.fromHex(
          "0x77afd6190f1554ad45fd0d31aee62aacc33c6db0ea801129acb813f913e0764f",
        ),
      ),
    ),
  ] as XcmV3Junction[],
  paseoAssetHub: [
    XcmV3Junction.GlobalConsensus(
      Enum(
        "ByGenesis",
        Binary.fromHex(
          "0x77afd6190f1554ad45fd0d31aee62aacc33c6db0ea801129acb813f913e0764f",
        ),
      ),
    ),
    XcmV3Junction.Parachain(1000),
  ] as XcmV3Junction[],
}

export const TOKENS = {
  PAS: [
    XcmV3Junction.GlobalConsensus(
      Enum(
        "ByGenesis",
        Binary.fromHex(
          "0x77afd6190f1554ad45fd0d31aee62aacc33c6db0ea801129acb813f913e0764f",
        ),
      ),
    ),
  ] as XcmV3Junction[],
}

export const TOKENS_IN_CHAINS = {
  PAS: {
    paseo: true,
    paseoAssetHub: true,
  },
}
