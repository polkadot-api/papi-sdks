import { Deltas, partitionEntries } from "@/util/watchEntries"
import { blake2b } from "@noble/hashes/blake2b"
import { combineKeys, toKeySet } from "@react-rxjs/utils"
import { Binary, TxEvent } from "polkadot-api"
import { map, scan } from "rxjs"
import { getPreimageResolver } from "../preimages"
import { originToTrack, polkadotSpenderOrigin } from "./chainConfig"
import {
  PolkadotRuntimeOriginCaller,
  ReferendaSdkTypedApi,
  ReferendumInfo,
} from "./descriptors"
import {
  OngoingReferendum,
  ReferendaSdk,
  ReferendaSdkConfig,
} from "./sdk-types"
import { BIG_BILLION, trackFetcher } from "./track"

const MAX_INLINE_SIZE = 128
type RawOngoingReferendum = (ReferendumInfo & { type: "Ongoing" })["value"]

const defaultConfig: ReferendaSdkConfig = {
  spenderOrigin: polkadotSpenderOrigin,
}
export function createReferendaSdk(
  typedApi: ReferendaSdkTypedApi,
  config?: Partial<ReferendaSdkConfig>,
): ReferendaSdk {
  const { spenderOrigin } = { ...defaultConfig, ...config }
  const resolvePreimage = getPreimageResolver(
    typedApi.query.Preimage.PreimageFor.getValues,
  )
  const getTrack = trackFetcher(typedApi)

  function enhanceOngoingReferendum(
    id: number,
    referendum: RawOngoingReferendum,
  ): OngoingReferendum {
    const resolveProposal = () => resolvePreimage(referendum.proposal)

    async function getConfirmationStart() {
      const totalVotes = referendum.tally.ayes + referendum.tally.nays
      if (totalVotes == 0n || !referendum.deciding) {
        return null
      }
      if (referendum.deciding.confirming) {
        return referendum.deciding.confirming
      }

      const [track, totalIssuance, inactiveIssuance] = await Promise.all([
        getTrack(referendum.track),
        typedApi.query.Balances.TotalIssuance.getValue(),
        typedApi.query.Balances.InactiveIssuance.getValue(),
      ])
      if (!track) return null

      const approvals = (BIG_BILLION * referendum.tally.ayes) / totalVotes
      const support =
        (BIG_BILLION * referendum.tally.support) /
        (totalIssuance - inactiveIssuance)

      const approvalBlock = track.minApproval.getBlock(approvals)
      const supportBlock = track.minSupport.getBlock(support)
      const block = Math.max(approvalBlock, supportBlock)
      if (block === Number.POSITIVE_INFINITY) return null

      return referendum.deciding.since + block
    }

    return {
      ...referendum,
      id,
      proposal: {
        rawValue: referendum.proposal,
        resolve: resolveProposal,
        decodedCall: async () => {
          const proposal = await resolveProposal()
          const token = await typedApi.compatibilityToken

          return typedApi.txFromCallData(proposal, token).decodedCall
        },
      },
      async getDetails(subscanApiKey: string) {
        const result = await fetch(
          "https://polkadot.api.subscan.io/api/scan/referenda/referendum",
          {
            method: "POST",
            body: JSON.stringify({
              referendum_index: id,
            }),
            headers: {
              "x-api-key": subscanApiKey,
            },
          },
        ).then((r) => r.json())
        // status = "Confirm" => Confirming

        return {
          title: result.data.title,
        }
      },
      getConfirmationStart,
      async getConfirmationEnd() {
        if (!referendum.deciding) return null

        const track = await getTrack(referendum.track)
        if (!track) return null

        const confirmationStart =
          referendum.deciding.confirming ?? (await getConfirmationStart())
        if (!confirmationStart) return null

        return confirmationStart + track.confirm_period
      },
      async getTrack() {
        const track = await getTrack(referendum.track)
        if (!track) {
          // Should never happen
          throw new Error("Track not found")
        }
        return track
      },
    }
  }

  async function getOngoingReferenda() {
    const entries =
      await typedApi.query.Referenda.ReferendumInfoFor.getEntries()

    return entries
      .map(({ keyArgs: [id], value: info }): OngoingReferendum | null => {
        if (info.type !== "Ongoing") return null

        return enhanceOngoingReferendum(id, info.value)
      })
      .filter((v) => !!v)
  }
  async function getOngoingReferendum(id: number) {
    const referendum =
      await typedApi.query.Referenda.ReferendumInfoFor.getValue(id)
    if (referendum?.type === "Ongoing") {
      return enhanceOngoingReferendum(id, referendum.value)
    }
    return null
  }

  const [rawReferendumById$, referendaKeyChange$] = partitionEntries(
    typedApi.query.Referenda.ReferendumInfoFor.watchEntries().pipe(
      scan(
        (acc, v) => {
          if (!v.deltas) return { ...acc, deltas: null }
          const deleted = v.deltas.deleted.map((v) => ({
            ...v,
            value: v.value.value as RawOngoingReferendum,
          }))
          const upserted = v.deltas.upserted
            .map((v) => {
              if (v.value.type === "Ongoing") {
                acc.referendums[v.args[0]] = v.value.value
                return {
                  args: v.args,
                  value: v.value.value,
                }
              }
              if (v.args[0] in acc.referendums) {
                // An Ongoing has become closed, remove from list
                deleted.push({
                  args: v.args,
                  value: acc.referendums[v.args[0]],
                })
                delete acc.referendums[v.args[0]]
              }
              return null!
            })
            .filter(Boolean)

          return {
            referendums: acc.referendums,
            deltas: { deleted, upserted },
          }
        },
        {
          referendums: {} as Record<number, RawOngoingReferendum>,
          deltas: null as Deltas<RawOngoingReferendum> | null,
        },
      ),
    ),
  )

  const getOngoingReferendumById$ = (id: number) =>
    rawReferendumById$(id).pipe(
      map((entry) => enhanceOngoingReferendum(id, entry)),
    )
  const ongoingReferenda$ = combineKeys(
    referendaKeyChange$,
    getOngoingReferendumById$,
  )
  const ongoingReferendaIds$ = referendaKeyChange$.pipe(
    toKeySet(),
    map((set) => [...set]),
  )

  const getSpenderTrack: ReferendaSdk["getSpenderTrack"] = (value) => {
    const spenderOriginType = spenderOrigin(value)
    const origin: PolkadotRuntimeOriginCaller = spenderOriginType
      ? {
          type: "Origins",
          value: {
            type: spenderOriginType,
            value: undefined,
          },
        }
      : {
          type: "system",
          value: { type: "Root", value: undefined },
        }

    return {
      origin,
      track: getTrack(
        spenderOriginType ? originToTrack[spenderOriginType] : "root",
      ).then((r) => {
        if (!r) {
          throw new Error(`Track ${spenderOriginType ?? "root"} not found`)
        }
        return r
      }),
    }
  }

  const createReferenda: ReferendaSdk["createReferenda"] = (
    origin,
    proposal,
    options,
  ) => {
    // The pallet already calculates uses the earliest_allowed in case it's too small
    const enactment_moment = options?.enactment ?? {
      type: "After",
      value: 0,
    }

    if (proposal.asBytes().length <= MAX_INLINE_SIZE) {
      return typedApi.tx.Referenda.submit({
        enactment_moment,
        proposal: {
          type: "Inline",
          value: proposal,
        },
        proposal_origin: origin,
      })
    }

    const hash = blake2b(proposal.asBytes())

    return typedApi.tx.Utility.batch_all({
      calls: [
        // Expose the deposit required for the preimage
        // maybe as part of fee + deposit
        typedApi.tx.Preimage.note_preimage({
          bytes: proposal,
        }).decodedCall,
        typedApi.tx.Referenda.submit({
          enactment_moment,
          proposal: {
            type: "Lookup",
            value: {
              hash: Binary.fromBytes(hash),
              len: proposal.asBytes().length,
            },
          },
          proposal_origin: origin,
        }).decodedCall,
      ],
    })
  }

  const createSpenderReferenda: ReferendaSdk["createSpenderReferenda"] = (
    callData,
    value,
  ) => {
    const spenderTrack = getSpenderTrack(value)

    return createReferenda(spenderTrack.origin, callData)
  }

  const getSubmittedReferendum = (txEvent: TxEvent) =>
    "events" in txEvent
      ? (typedApi.event.Referenda.Submitted.filter(txEvent.events)[0] ?? null)
      : null

  return {
    watch: {
      ongoingReferenda$,
      getOngoingReferendumById$,
      ongoingReferendaIds$,
    },
    getOngoingReferenda,
    getOngoingReferendum,
    getSpenderTrack,
    getTrack,
    createReferenda,
    createSpenderReferenda,
    getSubmittedReferendum,
  }
}
