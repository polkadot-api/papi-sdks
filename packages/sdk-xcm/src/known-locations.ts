import { XcmV3Junction, XcmV3Junctions } from "@/descriptors"
import { Binary, Enum } from "polkadot-api"
import type { Location } from "./utils/location"

export const PASEO: Location = {
  parents: 0,
  interior: XcmV3Junctions.X1(
    XcmV3Junction.GlobalConsensus(
      Enum(
        "ByGenesis",
        Binary.fromHex(
          "0x77afd6190f1554ad45fd0d31aee62aacc33c6db0ea801129acb813f913e0764f",
        ),
      ),
    ),
  ),
}
export const PASEO_ASSETHUB = {
  parents: 0,
  interior: XcmV3Junctions.X2([
    XcmV3Junction.GlobalConsensus(
      Enum(
        "ByGenesis",
        Binary.fromHex(
          "0x77afd6190f1554ad45fd0d31aee62aacc33c6db0ea801129acb813f913e0764f",
        ),
      ),
    ),
    XcmV3Junction.Parachain(1000),
  ]),
}
