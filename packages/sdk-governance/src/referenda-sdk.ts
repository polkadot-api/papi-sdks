import { blake2b } from "@noble/hashes/blake2b"
import { Binary, TxEvent } from "polkadot-api"
import { keyBy } from "./keyBy"
import { getPreimageResolver } from "./preimages"
import { originToTrack, polkadotSpenderOrigin } from "./referenda-chainConfig"
import {
  PolkadotRuntimeOriginCaller,
  ReferendaSdkTypedApi,
  ReferendumInfo,
} from "./referenda-descriptors"
import {
  OngoingReferendum,
  ReferendaSdk,
  ReferendaSdkConfig,
} from "./referenda-sdk-types"

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

  function enhanceOngoingReferendum(
    id: number,
    referendum: RawOngoingReferendum,
  ): OngoingReferendum {
    const resolveProposal = () => resolvePreimage(referendum.proposal)

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
      enactment: async () => {
        const referendaTracks = await typedApi.constants.Referenda.Tracks()
        const tracks = keyBy(
          referendaTracks.map(([_, track]) => track),
          (track) => track.name,
        )
        const rootEnactment = tracks["root"].min_enactment_period
        if (!spenderOriginType) return rootEnactment

        const track = originToTrack[spenderOriginType] ?? ""
        return tracks[track]?.min_enactment_period ?? rootEnactment
      },
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
    createReferenda,
    createSpenderReferenda,
    getSubmittedReferendum,
  }
}
