import { CompatibilityLevel, PolkadotClient, TypedApi } from "polkadot-api"
import { ahDesc, relayDesc } from "./descriptors"

export const getApi = async (
  id: string,
  getClient: (id: string) => PolkadotClient,
): Promise<{
  api: TypedApi<typeof relayDesc>
  pallet: "XcmPallet"
}> => {
  const client = getClient(id)
  const relayApi = client.getTypedApi(relayDesc)
  const paraApi = client.getTypedApi(ahDesc)
  if (
    await relayApi.tx.XcmPallet.execute.isCompatible(CompatibilityLevel.Partial)
  )
    return { api: relayApi, pallet: "XcmPallet" }

  if (
    await paraApi.tx.PolkadotXcm.execute.isCompatible(
      CompatibilityLevel.Partial,
    )
  )
    return { api: paraApi, pallet: "PolkadotXcm" } as any

  throw new Error("NO SUITABLE API FOUND")
}
