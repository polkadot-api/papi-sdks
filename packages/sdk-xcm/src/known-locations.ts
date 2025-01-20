import { XcmV3Junction } from "@/descriptors"
import { Binary, Enum } from "polkadot-api"

const WESTEND: XcmV3Junction[] = [
  XcmV3Junction.GlobalConsensus(
    Enum(
      "ByGenesis",
      Binary.fromHex(
        "0xe143f23803ac50e8f6f8e62695d1ce9e4e1d68aa36c1cd2cfd15340213f3423e",
      ),
    ),
  ),
]
const WESTEND_AH: XcmV3Junction[] = [...WESTEND, XcmV3Junction.Parachain(1000)]
const WESTEND_PP: XcmV3Junction[] = [...WESTEND, XcmV3Junction.Parachain(2042)]
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
  westend: WESTEND,
  westendAh: WESTEND_AH,
  westendPP: WESTEND_PP,
  paseo: PASEO,
  paseoAssetHub: PASEO_AH,
  paseoHydra: PASEO_HYDR,
}

export const TOKENS = {
  WND: WESTEND,
  PAS: PASEO,
}

export const TOKENS_IN_CHAINS: Partial<
  Record<
    keyof typeof TOKENS & string,
    Partial<
      Record<
        keyof typeof CHAINS & string,
        (keyof typeof CHAINS & string) | true
      >
    >
  >
> = {
  WND: {
    westend: true,
    westendAh: true,
    westendPP: "westend",
  },
  PAS: {
    paseo: true,
    paseoAssetHub: true,
    paseoHydra: "paseoAssetHub",
  },
}
