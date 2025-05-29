import { Binary, SS58String } from "polkadot-api"
import {
  IdentityData,
  IdentitySdkTypedApi,
  IdentityValue,
  OldIdentityValue,
} from "./descriptors"
import { Identity, IdentitySdk } from "./sdk-types"

const normalizeIdentityValue = (
  value: IdentityValue | OldIdentityValue,
): IdentityValue => (Array.isArray(value) ? value[0] : value)

export function createIdentitySdk(typedApi: IdentitySdkTypedApi): IdentitySdk {
  const getIdentity = async (address: SS58String): Promise<Identity | null> => {
    const res = await typedApi.query.Identity.IdentityOf.getValue(address).then(
      (v) => (v ? normalizeIdentityValue(v) : v),
    )
    if (!res) return null

    const info: Identity["info"] = Object.fromEntries(
      Object.entries(res.info).map(([key, value]) => [
        key,
        value instanceof Binary
          ? value
          : (readIdentityData(value)?.asText() ?? null),
      ]),
    )
    const judgements: Identity["judgements"] = res.judgements.map(
      ([registrar, judgement]) =>
        judgement.type === "FeePaid"
          ? { registrar, judgement: judgement.type, fee: judgement.value }
          : { registrar, judgement: judgement.type },
    )

    const verified = judgements.some((v) =>
      ["Reasonable", "KnownGood"].includes(v.judgement),
    )

    return {
      verified,
      info,
      judgements,
    }
  }

  return {
    getIdentity,
  }
}

const readIdentityData = (identityData?: IdentityData): Binary | null => {
  if (
    !identityData ||
    identityData.type === "None" ||
    identityData.type === "Raw0"
  )
    return null
  if (identityData.type === "Raw1")
    return Binary.fromBytes(new Uint8Array(identityData.value))
  return identityData.value
}
