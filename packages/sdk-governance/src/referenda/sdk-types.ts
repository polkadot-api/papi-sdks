import { Binary, Transaction, TxEvent } from "polkadot-api"
import { Origin } from "./chainConfig"
import {
  PolkadotRuntimeOriginCaller,
  PreimagesBounded,
  ReferendaTrackData,
  ReferendaTypesCurve,
  ReferendumInfo,
  TraitsScheduleDispatchTime,
} from "./descriptors"

type RawOngoingReferendum = (ReferendumInfo & { type: "Ongoing" })["value"]

export interface ReferendumDetails {
  title?: string
}

export type OngoingReferendum = Omit<RawOngoingReferendum, "proposal"> & {
  id: number
  proposal: {
    rawValue: PreimagesBounded
    resolve: () => Promise<Binary>
    decodedCall: () => Promise<{
      type: string
      value: {
        type: string
        value: any
      }
    }>
  }
  getDetails: (apiKey: string) => Promise<ReferendumDetails>
  getConfirmationStart: () => Promise<number | null>
  getConfirmationEnd: () => Promise<number | null>
}

export interface ReferendaSdkConfig {
  spenderOrigin: (value: bigint) => Origin | null
}

/**
 * threshold are in percentage [0-1]
 */
export interface TrackFunctionDetails {
  curve: ReferendaTypesCurve
  getThreshold(block: number): number
  getBlock(threshold: number): number
  getData(step?: number): Array<{
    block: number
    threshold: number
  }>
}
export type ReferendaTrack = Omit<
  ReferendaTrackData,
  "min_approval" | "min_support"
> & {
  minApproval: TrackFunctionDetails
  minSupport: TrackFunctionDetails
}

export interface ReferendaSdk {
  getOngoingReferenda(): Promise<OngoingReferendum[]>
  getSpenderTrack(value: bigint): {
    origin: PolkadotRuntimeOriginCaller
    track: Promise<ReferendaTrack>
  }

  getTrack(id: number | string): Promise<ReferendaTrack | null>

  createReferenda(
    origin: PolkadotRuntimeOriginCaller,
    enactment: TraitsScheduleDispatchTime,
    proposal: Binary,
  ): Transaction<any, string, string, unknown>
  createSpenderReferenda(
    callData: Binary,
    value: bigint,
  ): Transaction<any, string, string, unknown>
  getSubmittedReferendum(txEvent: TxEvent): {
    index: number
    track: number
    proposal: PreimagesBounded
  } | null
}
