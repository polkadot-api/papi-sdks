import { AsyncTransaction } from "@polkadot-api/common-sdk-utils"
import {
  CompatibilityLevel,
  PolkadotClient,
  SS58String,
  TypedApi,
} from "polkadot-api"
import { createReserve } from "./create-reserve"
import { createTeleport } from "./create-teleport"
import type { ah, relay, XcmV3Junction } from "./descriptors"
import { junctionsToLocation, Location, locationsAreEq } from "./utils/location"

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
  tokensInChains: Partial<
    Record<
      keyof T & string,
      Partial<Record<keyof C & string, (keyof C & string) | true>>
    >
  >,
  getClient: (id: keyof C & string) => PolkadotClient,
): XcmSdk<C, T> => {
  const apiCache = new Map<string, Promise<XcmApi>>()
  const getApi = (id: string): Promise<XcmApi> => {
    const cachedApi = apiCache.get(id)
    if (cachedApi) return cachedApi
    const client = getClient(id)
    const promise = new Promise<XcmApi>(async (res, rej) => {
      const { relay, nextRelay, ah, nextAh } = await import("./descriptors")
      const relayApi = client.getTypedApi(relay)
      const relayCompat =
        await relayApi.tx.XcmPallet.execute.getCompatibilityLevel()
      if (relayCompat > CompatibilityLevel.Incompatible) {
        if (relayCompat === CompatibilityLevel.Partial) {
          const nextApi = client.getTypedApi(nextRelay)
          const nextCompat =
            await nextApi.tx.XcmPallet.execute.getCompatibilityLevel()
          res({
            api: (nextCompat > relayCompat ? nextApi : relayApi) as any,
            pallet: "XcmPallet",
          })
          return
        }
        res({ api: relayApi, pallet: "XcmPallet" })
        return
      }

      const paraApi = client.getTypedApi(ah)
      const paraCompat =
        await paraApi.tx.PolkadotXcm.execute.getCompatibilityLevel()
      if (paraCompat === CompatibilityLevel.Incompatible) {
        rej("NO SUITABLE API FOUND")
        return
      }
      if (paraCompat === CompatibilityLevel.Partial) {
        const nextApi = client.getTypedApi(nextAh)
        const nextCompat =
          await nextApi.tx.PolkadotXcm.execute.getCompatibilityLevel()
        res({
          api: (nextCompat > paraCompat ? nextApi : paraApi) as any,
          pallet: "PolkadotXcm",
        })
        return
      }
      res({ api: paraApi, pallet: "PolkadotXcm" })
      return
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
          tokensInChains[token]?.[origin] != null &&
          tokensInChains[token]?.[dest] != null
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
        const reserve: [keyof C & string, Location] | null =
          tokensInChains[token][origin] === true
            ? locationsAreEq(
                junctionsToLocation(
                  chains[tokensInChains[token][dest] as string],
                ),
                aLoc,
              )
              ? [origin, aLoc]
              : null
            : tokensInChains[token][dest] === true
              ? locationsAreEq(
                  junctionsToLocation(
                    chains[tokensInChains[token][origin] as string],
                  ),
                  bLoc,
                )
                ? [dest, bLoc]
                : null
              : locationsAreEq(
                    junctionsToLocation(
                      chains[tokensInChains[token][origin] as string],
                    ),
                    junctionsToLocation(
                      chains[tokensInChains[token][dest] as string],
                    ),
                  )
                ? [
                    tokensInChains[token][origin] as string,
                    junctionsToLocation(
                      chains[tokensInChains[token][origin] as string],
                    ),
                  ]
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
            ...reserve,
            getApi,
            amount,
            beneficiary,
          )
      }
    },
  }
}
