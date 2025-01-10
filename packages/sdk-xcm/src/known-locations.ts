import { XcmV3Junction } from "@/descriptors"
import { Binary, Enum } from "polkadot-api"

const PASEO: XcmV3Junction[] = [
  XcmV3Junction.GlobalConsensus(
    Enum(
      "ByGenesis",
      Binary.fromHex(
        "0x77afd6190f1554ad45fd0d31aee62aacc33c6db0ea801129acb813f913e0764f",
      ),
    ),
  ),
]
const PASEO_AH: XcmV3Junction[] = [...PASEO, XcmV3Junction.Parachain(1000)]
const PASEO_HYDR: XcmV3Junction[] = [...PASEO, XcmV3Junction.Parachain(2034)]
export const CHAINS = {
  paseo: PASEO,
  paseoAssetHub: PASEO_AH,
  paseoHydra: PASEO_HYDR,
}

export const TOKENS = {
  PAS: PASEO,
}

export const TOKENS_IN_CHAINS = {
  PAS: {
    paseo: true as const,
    paseoAssetHub: true as const,
    paseoHydra: PASEO_AH,
  },
}
