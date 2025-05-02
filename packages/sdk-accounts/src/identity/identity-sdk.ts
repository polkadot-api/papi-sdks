import { Binary, SS58String } from "polkadot-api"
import { IdentityData, IdentitySdkTypedApi } from "./descriptors"
import { Identity, IdentitySdk } from "./sdk-types"

export function createIdentitySdk(typedApi: IdentitySdkTypedApi): IdentitySdk {
  const getIdentity = async (address: SS58String): Promise<Identity | null> => {
    const [res] =
      (await typedApi.query.Identity.IdentityOf.getValue(address)) ?? []
    if (!res) return null

    const info: Identity["info"] = Object.fromEntries(
      Object.entries(res.info).map(([key, value]) => [
        key,
        value instanceof Binary ? value : readIdentityData(value),
      ]),
    )
    const judgements: Identity["judgements"] = res.judgements.map(
      ([registrar, judgement]) =>
        judgement.type === "FeePaid"
          ? { registrar, judgement: judgement.type, fee: judgement.value }
          : { registrar, judgement: judgement.type },
    )

    const displayName: Identity["displayName"] = info.display
      ? {
          value: info.display,
          verified: judgements.some((v) => v.judgement === "Reasonable"),
        }
      : null

    return {
      displayName,
      info,
      judgements,
    }
  }

  return {
    getIdentity,
  }
}

const readIdentityData = (identityData: IdentityData): Binary | null => {
  if (identityData.type === "None" || identityData.type === "Raw0") return null
  if (identityData.type === "Raw1")
    return Binary.fromBytes(new Uint8Array(identityData.value))
  return identityData.value
}
