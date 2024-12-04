import type {
  XcmV3Junction,
  XcmV3JunctionNetworkId,
  XcmVersionedLocation,
} from "@polkadot-api/descriptors"
import { Binary, Enum, getSs58AddressInfo, type SS58String } from "polkadot-api"

export type Location = (XcmVersionedLocation & { type: "V4" })["value"]

// TODO: impl
export const routeRelative = (_from: Location, _to: Location): Location => {
  return { parents: 0, interior: Enum("Here") }
}

export const addrToLocation = (addr: SS58String): Location => {
  const ss58Info = getSs58AddressInfo(addr)
  if (!ss58Info.isValid) throw new Error(`Beneficiary ${addr} not valid`)
  return {
    parents: 0,
    interior: Enum(
      "X1",
      Enum("AccountId32", {
        network: undefined,
        id: Binary.fromBytes(ss58Info.publicKey),
      }),
    ),
  }
}

const networkIdAreEq = (
  a: XcmV3JunctionNetworkId | undefined,
  b: XcmV3JunctionNetworkId | undefined,
): boolean => {
  if (a == null || b == null) return a === b
  if (a.type !== b.type) return false
  if (a.type === "ByGenesis")
    return a.value.asHex() === (b as any).value.asHex()
  if (a.type === "ByFork")
    return (
      a.value.block_hash.asHex() === (b as any).value.block_hash.asHex() &&
      a.value.block_number === (b as any).value.block_number
    )
  if (a.type === "Ethereum")
    return a.value.chain_id === (b as any).value.chain_id
  return a.type === b.type
}

const junctionsAreEq = (a: XcmV3Junction, b: XcmV3Junction): boolean => {
  if (a.type !== b.type) return false
  switch (a.type) {
    case "Parachain":
      return a.value === (b.value as number)
    case "AccountId32":
      return (
        networkIdAreEq(a.value.network, (b as any).value.network) &&
        a.value.id.asHex() === (b as any).value.id.asHex()
      )
    case "AccountIndex64":
      return (
        networkIdAreEq(a.value.network, (b as any).value.network) &&
        a.value.index === (b as any).value.index
      )
    case "AccountKey20":
      return (
        networkIdAreEq(a.value.network, (b as any).value.network) &&
        a.value.key.asHex() === (b as any).value.key.asHex()
      )
    case "GeneralKey":
      return (
        a.value.length === (b as any).value.length &&
        a.value.data.asHex() === (b as any).value.data.asHex()
      )
    case "Plurality":
      return a.value.id.type !== (b as any).value.id.type ||
        a.value.part.type !== (b as any).value.part.type ||
        (a.value.id.type === "Moniker" &&
          a.value.id.value.asHex() !== (b as any).value.id.value.asHex()) ||
        (a.value.id.type === "Index" &&
          a.value.id.value !== (b as any).value.id.value) ||
        (a.value.part.type === "Members" &&
          a.value.part.value.count !== (b as any).value.part.value.count) ||
        (["Fraction", "AtLeastProportion", "MoreThanProportion"].includes(
          a.value.part.type,
        ) &&
          ((a as any).value.part.value.nom !==
            (b as any).value.part.value.nom ||
            (a as any).value.part.value.denom !==
              (b as any).value.part.value.denom))
        ? false
        : true
    case "GlobalConsensus":
      return networkIdAreEq(a.value, b.value as any)
    case "PalletInstance":
    case "GeneralIndex":
      return a.value === b.value
  }
  return true
}

export const locationsAreEq = (a: Location, b: Location): boolean => {
  if (a.parents !== b.parents) return false
  if (a.interior.type !== b.interior.type) return false
  if (a.interior.type === "Here") return true
  if (a.interior.type === "X1")
    return junctionsAreEq(a.interior.value, b.interior.value as any)
  for (let i = 0; i < a.interior.value.length; i++)
    if (!junctionsAreEq(a.interior.value[i], (b as any).interior.value[i]))
      return false
  return true
}
