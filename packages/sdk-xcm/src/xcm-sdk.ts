import { AsyncTransaction } from "@polkadot-api/common-sdk-utils"
import {
  CompatibilityLevel,
  PolkadotClient,
  SS58String,
  TypedApi,
} from "polkadot-api"
import { createReserve } from "./create-reserve"
import { createTeleport } from "./create-teleport"
import { ah, relay, XcmV3Junction } from "./descriptors"
import { junctionsToLocation, locationsAreEq } from "./utils/location"

export type XcmApi =
  | { api: TypedApi<typeof relay>; pallet: "XcmPallet" }
  | { api: TypedApi<typeof ah>; pallet: "PolkadotXcm" }

export type XcmSdk<
  Chains extends Record<string, Array<XcmV3Junction>>,
  Tokens extends Record<string, Array<XcmV3Junction>>,
> = {
  createRoute: (
    token: keyof Tokens & string,
    origin: keyof Chains & string,
    dest: keyof Chains & string,
  ) => (
    amount: bigint,
    beneficiary: SS58String,
  ) => {
    getEstimatedFees: (sender: SS58String) => Promise<bigint>
    createTx: (sender: SS58String) => AsyncTransaction<any, any, any, any>
  }
}

export const createXcmSdk = <
  C extends Record<string, Array<XcmV3Junction>>,
  T extends Record<string, Array<XcmV3Junction>>,
>(
  chains: C,
  tokens: T,
  tokensInChains: Record<string, Record<string, Array<XcmV3Junction> | true>>,
  getClient: (id: string) => PolkadotClient,
): XcmSdk<C, T> => {
  const apiCache = new Map<string, Promise<XcmApi>>()
  const getApi = (id: string): Promise<XcmApi> => {
    const cachedApi = apiCache.get(id)
    if (cachedApi) return cachedApi
    const client = getClient(id)
    const promise = new Promise<XcmApi>(async (res, rej) => {
      const relayApi = client.getTypedApi(relay)
      if (
        await relayApi.tx.XcmPallet.execute.isCompatible(
          CompatibilityLevel.Partial,
        )
      ) {
        res({ api: relayApi, pallet: "XcmPallet" })
        return
      }

      const paraApi = client.getTypedApi(ah)
      if (
        await paraApi.tx.PolkadotXcm.execute.isCompatible(
          CompatibilityLevel.Partial,
        )
      ) {
        res({ api: paraApi, pallet: "PolkadotXcm" })
      }
      rej("NO SUITABLE API FOUND")
    })
    apiCache.set(id, promise)
    return promise
  }
  return {
    createRoute(token, origin, dest) {
      // TODO: add real routing logic
      if (
        !(
          origin in chains &&
          dest in chains &&
          token in tokens &&
          token in tokensInChains &&
          tokensInChains[token][origin] != null &&
          tokensInChains[token][dest] != null
        )
      )
        throw new Error("NO ROUTE POSSIBLE!")

      const aLoc = junctionsToLocation(chains[origin])
      const bLoc = junctionsToLocation(chains[dest])
      const tokenLoc = junctionsToLocation(tokens[token])

      // let's figure out what we need
      if (locationsAreEq(aLoc, bLoc)) {
        // TODO: balances transfer // assets transfer!
        return {} as any
        // teleportable
      } else if (
        tokensInChains[token][origin] === true &&
        tokensInChains[token][dest] === true
      ) {
        return (amount, beneficiary) =>
          createTeleport(
            origin,
            aLoc,
            dest,
            bLoc,
            tokenLoc,
            getApi,
            amount,
            beneficiary,
          )
      } else {
        const reserve =
          tokensInChains[token][origin] === true &&
          locationsAreEq(
            junctionsToLocation(tokensInChains[token][dest] as any),
            aLoc,
          )
            ? aLoc
            : tokensInChains[token][dest] === true &&
                locationsAreEq(
                  junctionsToLocation(tokensInChains[token][origin] as any),
                  bLoc,
                )
              ? bLoc
              : locationsAreEq(
                    junctionsToLocation(tokensInChains[token][origin] as any),
                    junctionsToLocation(tokensInChains[token][dest] as any),
                  )
                ? junctionsToLocation(tokensInChains[token][origin] as any)
                : null
        if (reserve == null)
          throw new Error("Reserve location is not compatible")
        return (amount, beneficiary) =>
          createReserve(
            origin,
            aLoc,
            dest,
            bLoc,
            tokenLoc,
            reserve,
            getApi,
            amount,
            beneficiary,
          )
      }
    },
  }
}
