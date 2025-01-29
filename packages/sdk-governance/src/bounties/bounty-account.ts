import { AccountId, Binary } from "polkadot-api"
import { u32 } from "scale-ts"

const ZERO = new Array(32).fill(0)

const createId = (...parts: Array<Uint8Array>) => {
  const arr = [...ZERO]
  let i = 0
  parts.forEach((p) => p.forEach((v) => (arr[i++] = v)))

  return new Uint8Array(arr)
}

const bountyIdPrefix = Binary.fromText("modlpy/trsry\u0008bt").asBytes()
export const getBountyAccount = (id: number) =>
  AccountId().dec(createId(bountyIdPrefix, u32.enc(id)))

const childBountyIdPrefix = Binary.fromText("modlpy/trsry\u0008bc").asBytes()
export const getChildBountyAccount = (parentId: number, id: number) =>
  AccountId().dec(createId(childBountyIdPrefix, u32.enc(parentId), u32.enc(id)))
