import { Binary, Transaction, TxEvent } from "polkadot-api"
import { Origin } from "./chainConfig"
import {
  PreimagesBounded,
  ReferendaTrackData,
  ReferendaTypesCurve,
  ReferendumInfo,
  TraitsScheduleDispatchTime,
  WhoAmount,
} from "./descriptors"
import { Observable } from "rxjs"
import { PollOutcome } from "@/voting/sdk-types"

type RawOngoingReferendum<T> = (ReferendumInfo<T> & { type: "Ongoing" })["value"]

export interface ReferendumDetails {
  title?: string
}

export type OngoingReferendum<T extends {
  origin: unknown
} = { origin: unknown }> = Omit<RawOngoingReferendum<T['origin']>, "proposal"> & {
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

export type Referendum<TEnums extends {
  origin: unknown
}> = OngoingReferendum<TEnums> | ClosedReferendum

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

export interface ReferendaSdk<TEnums extends {
  origin: unknown
}> {
  getReferenda(): Promise<Referendum<TEnums>[]>
  getReferendum(id: number): Promise<Referendum<TEnums> | null>
  watch: {
    referenda$: Observable<Map<number, Referendum<TEnums>>>
    referendaIds$: Observable<number[]>
    getReferendumById$: (key: number) => Observable<Referendum<TEnums>>
  }
  getSpenderTrack(value: bigint): {
    origin: TEnums['origin']
    track: Promise<ReferendaTrack>
  }

  getTrack(id: number | string): Promise<ReferendaTrack | null>

  createReferenda(
    origin: TEnums['origin'],
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
