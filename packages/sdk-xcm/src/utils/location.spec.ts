import { XcmV3Junction, XcmV3Junctions } from "@polkadot-api/descriptors"
import { Enum } from "polkadot-api"
import { describe, expect, it } from "vitest"
import { Location, routeRelative } from "./location"

const POLKADOT: Location = {
  parents: 0,
  interior: XcmV3Junctions.X1(XcmV3Junction.GlobalConsensus(Enum("Polkadot"))),
}
const POLKADOT_ASSETHUB = {
  parents: 0,
  interior: XcmV3Junctions.X2([
    XcmV3Junction.GlobalConsensus(Enum("Polkadot")),
    XcmV3Junction.Parachain(1000),
  ]),
}
const POLKADOT_PEOPLE = {
  parents: 0,
  interior: XcmV3Junctions.X2([
    XcmV3Junction.GlobalConsensus(Enum("Polkadot")),
    XcmV3Junction.Parachain(1004),
  ]),
}
const KUSAMA_ASSET_HUB = {
  parents: 0,
  interior: XcmV3Junctions.X2([
    XcmV3Junction.GlobalConsensus(Enum("Kusama")),
    XcmV3Junction.Parachain(1000),
  ]),
}

describe("Location routing", () => {
  it("works with equal junctions", () => {
    expect(routeRelative(POLKADOT, POLKADOT)).toEqual({
      parents: 0,
      interior: Enum("Here"),
    })
  })
  it("works to parachain", () => {
    expect(routeRelative(POLKADOT, POLKADOT_ASSETHUB)).toEqual({
      parents: 0,
      interior: XcmV3Junctions.X1(Enum("Parachain", 1000)),
    })
  })
  it("works from parachain", () => {
    expect(routeRelative(POLKADOT_ASSETHUB, POLKADOT)).toEqual({
      parents: 1,
      interior: Enum("Here"),
    })
  })
  it("works to different parachain", () => {
    expect(routeRelative(POLKADOT_PEOPLE, POLKADOT_ASSETHUB)).toEqual({
      parents: 1,
      interior: XcmV3Junctions.X1(Enum("Parachain", 1000)),
    })
  })
  it("works to different consensus", () => {
    expect(routeRelative(KUSAMA_ASSET_HUB, POLKADOT_ASSETHUB)).toEqual({
      parents: 2,
      interior: XcmV3Junctions.X2([
        XcmV3Junction.GlobalConsensus(Enum("Polkadot")),
        XcmV3Junction.Parachain(1000),
      ]),
    })
  })
})
