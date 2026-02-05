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
  const getIdentities = async (
    addresses: SS58String[],
  ): Promise<Record<SS58String, Identity | null>> => {
    const keys = addresses.map((v): [SS58String] => [v])

    let [identities, supersOf] = await Promise.all([
      typedApi.query.Identity.IdentityOf.getValues(keys).then((res) =>
        Object.fromEntries(
          res.map((v, i) => [addresses[i], v ? normalizeIdentityValue(v) : v]),
        ),
      ),
      typedApi.query.Identity.SuperOf.getValues(keys).then((res) =>
        Object.fromEntries(res.map((v, i) => [addresses[i], v])),
      ),
    ])

    const pendingSuperIdentities = Object.entries(identities)
      .filter(([key, identity]) => !identity && supersOf[key])
      .map(([child]) => ({
        child,
        super: supersOf[child]![0],
      }))

    if (pendingSuperIdentities.length) {
      const superIdentities =
        await typedApi.query.Identity.IdentityOf.getValues(
          pendingSuperIdentities.map((v) => [v.super]),
        )
      superIdentities.forEach((v, i) => {
        identities[pendingSuperIdentities[i].child] = v
          ? normalizeIdentityValue(v)
          : v
      })
    }

    return Object.fromEntries(
      Object.entries(identities).map(([key, identity]) => {
        if (!identity) return [key, null]
        const subIdentity = supersOf[key]
          ? (() => {
              const data = readIdentityData(supersOf[key][1])
              return data ? Binary.toText(data) : undefined
            })()
          : undefined

        const info: Identity["info"] = Object.fromEntries(
          Object.entries(identity.info).map(([key, value]) => [
            key,
            value instanceof Uint8Array
              ? value
              : typeof value === "string"
                ? value // SizedHex - keep as hex string
                : (() => {
                    const data = readIdentityData(value)
                    return data ? Binary.toText(data) : null
                  })(),
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

        return [
          key,
          {
            verified,
            info,
            judgements,
            subIdentity,
          },
        ]
      }),
    )
  }

  const getIdentity = (address: SS58String): Promise<Identity | null> =>
    getIdentities([address]).then((res) => res[address])

  return {
    getIdentities,
    getIdentity,
  }
}

const readIdentityData = (identityData?: IdentityData): Uint8Array | null => {
  if (
    !identityData ||
    identityData.type === "None" ||
    identityData.type === "Raw0"
  )
    return null
  if (identityData.type === "Raw1") return new Uint8Array([identityData.value])
  // For Raw2-Raw32 and hash types, value is now SizedHex<N> (hex string)
  return Binary.fromHex(identityData.value)
}
