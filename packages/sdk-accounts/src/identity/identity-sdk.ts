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
    let [identity, superOf] = await Promise.all([
      typedApi.query.Identity.IdentityOf.getValue(address).then((v) =>
        v ? normalizeIdentityValue(v) : v,
      ),
      typedApi.query.Identity.SuperOf.getValue(address),
    ])

    if (!identity && superOf) {
      identity = await typedApi.query.Identity.IdentityOf.getValue(
        superOf[0],
      ).then((v) => (v ? normalizeIdentityValue(v) : v))
    }

    if (!identity) return null

    const subIdentity = superOf
      ? readIdentityData(superOf[1])?.asText()
      : undefined

    const info: Identity["info"] = Object.fromEntries(
      Object.entries(identity.info).map(([key, value]) => [
        key,
        value instanceof Binary
          ? value
          : (readIdentityData(value)?.asText() ?? null),
      ]),
    )
    const judgements: Identity["judgements"] = identity.judgements.map(
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
      subIdentity,
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
    return Binary.fromBytes(new Uint8Array([identityData.value]))
  return identityData.value
}
