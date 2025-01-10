import { blake2b } from "@noble/hashes/blake2b"
import { Binary, TxEvent } from "polkadot-api"
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
import { trackFetcher } from "./track"

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

      const approvals = Number(referendum.tally.ayes) / Number(totalVotes)

      const [track, totalIssuance] = await Promise.all([
        getTrack(referendum.track),
        typedApi.query.Balances.TotalIssuance.getValue(),
      ])
      if (!track) return null
      const approvalBlock = Math.max(0, track.minApproval.getBlock(approvals))
      const supportBlock = Math.max(
        0,
        track.minSupport.getBlock(
          Number(referendum.tally.support) / Number(totalIssuance),
        ),
      )
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
    enactment,
    proposal,
  ) => {
    if (proposal.asBytes().length <= MAX_INLINE_SIZE) {
      return typedApi.tx.Referenda.submit({
        enactment_moment: enactment,
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
          enactment_moment: enactment,
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

    return createReferenda(
      spenderTrack.origin,
      {
        type: "After",
        value: 0,
      },
      callData,
    )
  }

  const getSubmittedReferendum = (txEvent: TxEvent) =>
    "events" in txEvent
      ? (typedApi.event.Referenda.Submitted.filter(txEvent.events)[0] ?? null)
      : null

  return {
    getOngoingReferenda,
    getSpenderTrack,
    getTrack,
    createReferenda,
    createSpenderReferenda,
    getSubmittedReferendum,
  }
}
