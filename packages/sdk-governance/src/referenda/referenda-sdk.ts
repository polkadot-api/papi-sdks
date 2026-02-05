import { partitionEntries } from "@/util/watchEntries"
import { Binary, Blake2256 } from "@polkadot-api/substrate-bindings"
import { combineKeys, toKeySet } from "@react-rxjs/utils"
import { TxEvent } from "polkadot-api"
import { map } from "rxjs"
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
  Referendum,
} from "./sdk-types"
import { BIG_BILLION, trackFetcher } from "./track"

const MAX_INLINE_SIZE = 128
type RawOngoingReferendum<T> = (ReferendumInfo<T> & {
  type: "Ongoing"
})["value"]

const defaultConfig: ReferendaSdkConfig = {
  spenderOrigin: polkadotSpenderOrigin,
}
export function createReferendaSdk<TOrigin extends PolkadotRuntimeOriginCaller>(
  typedApi: ReferendaSdkTypedApi<TOrigin>,
  config?: Partial<ReferendaSdkConfig>,
): ReferendaSdk<{ origin: TOrigin }> {
  const { spenderOrigin } = { ...defaultConfig, ...config }
  const resolvePreimage = getPreimageResolver(
    typedApi.query.Preimage.PreimageFor.getValues,
  )
  const getTrack = trackFetcher(typedApi)

  function enhanceOngoingReferendum(
    id: number,
    referendum: RawOngoingReferendum<TOrigin>,
  ): OngoingReferendum<{ origin: TOrigin }> {
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
    async function getConfirmationEnd() {
      if (!referendum.deciding) return null

      const track = await getTrack(referendum.track)
      if (!track) return null

      const confirmationStart =
        referendum.deciding.confirming ?? (await getConfirmationStart())
      if (!confirmationStart) return null

      return confirmationStart + track.confirm_period
    }

    return {
      ...referendum,
      type: "Ongoing",
      id,
      proposal: {
        rawValue: referendum.proposal,
        resolve: resolveProposal,
        decodedCall: async () => {
          const proposal = await resolveProposal()
          const staticApis = await typedApi.getStaticApis()

          return staticApis.decodeCallData(proposal)
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
      getConfirmationEnd,
      async getTrack() {
        const track = await getTrack(referendum.track)
        if (!track) {
          // Should never happen
          throw new Error("Track not found")
        }
        return track
      },
      outcome: null,
      async getExpectedOutcome() {
        const confirmationEnd = await getConfirmationEnd()
        return confirmationEnd
          ? {
              side:
                referendum.tally.ayes > referendum.tally.nays ? "aye" : "nay",
              ended: confirmationEnd,
            }
          : null
      },
    }
  }
  function enhanceReferendumInfo(
    id: number,
    info: ReferendumInfo<TOrigin>,
  ): Referendum<{ origin: TOrigin }> {
    if (info.type === "Ongoing") return enhanceOngoingReferendum(id, info.value)
    if (info.type === "Killed")
      return {
        type: "Killed",
        block: info.value,
        submission_deposit: undefined,
        decision_deposit: undefined,
        outcome: null,
      }

    const [block, submission_deposit, decision_deposit] = info.value
    return {
      type: info.type,
      block,
      submission_deposit,
      decision_deposit,
      outcome:
        info.type === "Approved"
          ? { side: "aye", ended: block }
          : info.type === "Rejected"
            ? {
                side: "nay",
                ended: block,
              }
            : null,
    }
  }

  async function getReferenda() {
    const entries =
      await typedApi.query.Referenda.ReferendumInfoFor.getEntries()

    return entries.map(({ keyArgs: [id], value: info }) =>
      enhanceReferendumInfo(id, info),
    )
  }
  async function getReferendum(id: number) {
    const referendum =
      await typedApi.query.Referenda.ReferendumInfoFor.getValue(id)
    return referendum ? enhanceReferendumInfo(id, referendum) : null
  }

  const [rawReferendumById$, referendaKeyChange$] = partitionEntries(
    typedApi.query.Referenda.ReferendumInfoFor.watchEntries(),
  )

  const getReferendumById$ = (id: number) =>
    rawReferendumById$(id).pipe(
      map((entry) => enhanceReferendumInfo(id, entry)),
    )
  const referenda$ = combineKeys(referendaKeyChange$, getReferendumById$)
  const referendaIds$ = referendaKeyChange$.pipe(
    toKeySet(),
    map((set) => [...set]),
  )

  const getSpenderTrack: ReferendaSdk<{
    origin: TOrigin
  }>["getSpenderTrack"] = (value) => {
    const spenderOriginType = spenderOrigin(value)
    const origin = spenderOriginType
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
      origin: origin as TOrigin,
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

  const createReferenda: ReferendaSdk<{
    origin: TOrigin
  }>["createReferenda"] = (origin, proposal, options) => {
    // The pallet already calculates uses the earliest_allowed in case it's too small
    const enactment_moment = options?.enactment ?? {
      type: "After",
      value: 0,
    }

    if (proposal.length <= MAX_INLINE_SIZE) {
      return typedApi.tx.Referenda.submit({
        enactment_moment,
        proposal: {
          type: "Inline",
          value: proposal,
        },
        proposal_origin: origin,
      })
    }

    const hash = Blake2256(proposal)

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
              hash: Binary.toHex(hash),
              len: proposal.length,
            },
          },
          proposal_origin: origin,
        }).decodedCall,
      ],
    })
  }

  const createSpenderReferenda: ReferendaSdk<{
    origin: TOrigin
  }>["createSpenderReferenda"] = (callData, value) => {
    const spenderTrack = getSpenderTrack(value)

    return createReferenda(spenderTrack.origin, callData)
  }

  const getSubmittedReferendum = (txEvent: TxEvent) => {
    if (!("events" in txEvent)) return null
    const event = typedApi.event.Referenda.Submitted.filter(txEvent.events)[0]
    return (event as any) ?? null
  }

  return {
    watch: {
      referenda$,
      getReferendumById$,
      referendaIds$,
    },
    getReferenda,
    getReferendum,
    getSpenderTrack,
    getTrack,
    createReferenda,
    createSpenderReferenda,
    getSubmittedReferendum,
  }
}
