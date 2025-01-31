import { Binary, Transaction, TxEvent } from "polkadot-api"
import { Origin } from "./chainConfig"
import {
  PolkadotRuntimeOriginCaller,
  PreimagesBounded,
  ReferendaTrackData,
  ReferendaTypesCurve,
  ReferendumInfo,
  TraitsScheduleDispatchTime,
  WhoAmount,
} from "./descriptors"
import { Observable } from "rxjs"
import { PollOutcome } from "@/voting/sdk-types"

type RawOngoingReferendum = (ReferendumInfo & { type: "Ongoing" })["value"]

export interface ReferendumDetails {
  title?: string
}

export type OngoingReferendum = Omit<RawOngoingReferendum, "proposal"> & {
  type: "Ongoing"
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

  // For easier TS usage, but will always be `null`
  outcome: PollOutcome
  getExpectedOutcome: () => Promise<PollOutcome>
}

export interface ClosedReferendum {
  type: "Approved" | "Rejected" | "Cancelled" | "TimedOut" | "Killed"
  outcome: PollOutcome
  block: number
  submission_deposit: WhoAmount | undefined
  decision_deposit: WhoAmount | undefined
}

export type Referendum = OngoingReferendum | ClosedReferendum

export interface ReferendaSdkConfig {
  spenderOrigin: (value: bigint) => Origin | null
}

/**
 * threshold are in perbillion
 */
export interface TrackFunctionDetails {
  curve: ReferendaTypesCurve
  getThreshold(block: number): bigint
  getBlock(threshold: bigint): number

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
  getReferenda(): Promise<Referendum[]>
  getReferendum(id: number): Promise<Referendum | null>
  watch: {
    referenda$: Observable<Map<number, Referendum>>
    referendaIds$: Observable<number[]>
    getReferendumById$: (key: number) => Observable<Referendum>
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
