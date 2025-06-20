import {
  distinctUntilChanged,
  EMPTY,
  filter,
  firstValueFrom,
  from,
  map,
  mergeMap,
  scan,
  shareReplay,
  switchMap,
  take,
  withLatestFrom,
} from "rxjs"
import { Binary, BlockInfo, PolkadotClient, SS58String } from "polkadot-api"
import { ksm, ksmAh } from "@polkadot-api/descriptors"

const nFinalizedBlocks = 10
export const createGetProof = (
  relayChainClient: PolkadotClient,
  parachainClient: PolkadotClient,
) => {
  const relayApi = relayChainClient.getTypedApi(ksm)
  const paraApi = parachainClient.getTypedApi(ksmAh)

  const latestFinalized$ = relayChainClient.finalizedBlock$.pipe(
    scan(
      (acc, value, idx) => {
        acc.idx = idx
        acc.data[idx % nFinalizedBlocks] = value
        return acc
      },
      { idx: -1, data: new Array<BlockInfo>(nFinalizedBlocks) },
    ),
    shareReplay(1),
  )

  // it's ok b/c it rellies on a hot observable: `finalizedBlock$`
  // whenever the consumer "destroys" the client, the observable
  // will complete... Thus, killing the subscription.
  // Basically, this observable is just an extension of the `finalizedBlocks$`
  let isOn = true
  const setItOff = () => {
    isOn = false
  }
  latestFinalized$.subscribe({
    complete: setItOff,
    error: setItOff,
  })

  const getProofAt =
    (storageKey: Promise<string>) => async (blockHash: string) =>
      (
        await relayChainClient._request<
          { at: string; proof: string[] },
          [keys: string[], at: string]
        >("state_getReadProof", [[await storageKey], blockHash])
      ).proof.map((part) => Binary.fromHex(part))

  const getProofForBlockAt = (
    storageKey: Promise<string>,
    height: number,
    stateRootHash: string,
  ) =>
    relayChainClient.bestBlocks$.pipe(
      withLatestFrom(latestFinalized$),
      map(([bestBlocks, finalizedBlocks]) => {
        const best = bestBlocks[0]

        // practically speaking: an impossible scenario
        if (best.number < height) return null

        let diff = best.number - height
        if (diff < bestBlocks.length)
          return {
            finalized: diff === bestBlocks.length - 1, // the last one is the finalized block
            hash: bestBlocks[diff].hash,
          }

        const finalized =
          finalizedBlocks.data[finalizedBlocks.idx % nFinalizedBlocks]
        diff = finalized.number - height

        return diff < nFinalizedBlocks
          ? {
              finalized: true,
              hash: finalizedBlocks.data[
                (finalizedBlocks.idx - diff) % nFinalizedBlocks
              ].hash,
            }
          : null // practically speaking: an impossible scenario
      }),
      filter(Boolean),
      distinctUntilChanged(
        (a, b) => a.hash === b.hash && a.finalized === b.finalized,
      ),
      switchMap((x) =>
        x.finalized
          ? [x.hash]
          : from(relayChainClient.getBlockHeader(x.hash)).pipe(
              mergeMap((header) =>
                header.stateRoot === stateRootHash ? [x.hash] : EMPTY,
              ),
            ),
      ),
      take(1),
      mergeMap(getProofAt(storageKey)),
      map((proof) => ({ proof, block: height })),
    )

  return (
    proxied: SS58String,
  ): Promise<{
    proof: Binary[]
    block: number
    at: BlockInfo
    proxied: SS58String
  }> => {
    if (!isOn) throw new Error("Client innacessible")
    const storageKey = relayApi.query.Proxy.Proxies.getKey(proxied)
    return firstValueFrom(
      parachainClient.bestBlocks$.pipe(
        map(([bestBlock]) => bestBlock),
        distinctUntilChanged((a, b) => a.hash === b.hash),
        switchMap((at) =>
          from(
            paraApi.query.RemoteProxyRelayChain.BlockToRoot.getValue({
              at: at.hash,
            }),
          ).pipe(
            map((blocks) => {
              const [height, stateRootHash] = blocks.at(-1)!
              return { height, stateRootHash: stateRootHash.asHex() }
            }),
            distinctUntilChanged((a, b) => a.height === b.height),
            switchMap(({ height, stateRootHash }) =>
              getProofForBlockAt(storageKey, height, stateRootHash),
            ),
            map((x) => ({ ...x, at, proxied })),
          ),
        ),
      ),
    )
  }
}
