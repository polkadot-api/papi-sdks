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
import { Observable } from "rxjs"

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
  getTrack: () => Promise<ReferendaTrack>
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
  getOngoingReferendum(id: number): Promise<OngoingReferendum | null>
  watch: {
    ongoingReferenda$: Observable<Map<number, OngoingReferendum>>
    ongoingReferendaIds$: Observable<number[]>
    getOngoingReferendumById$: (key: number) => Observable<OngoingReferendum>
  }
  getSpenderTrack(value: bigint): {
    origin: PolkadotRuntimeOriginCaller
    track: Promise<ReferendaTrack>
  }

  getTrack(id: number | string): Promise<ReferendaTrack | null>

  createReferenda(
    origin: PolkadotRuntimeOriginCaller,
    proposal: Binary,
    options?: Partial<{
      enactment: TraitsScheduleDispatchTime
    }>,
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
