import { Binary, Transaction, TxEvent } from "polkadot-api"
import { Origin } from "./referenda-chainConfig"
import {
  PolkadotRuntimeOriginCaller,
  PreimagesBounded,
  ReferendumInfo,
  TraitsScheduleDispatchTime,
} from "./referenda-descriptors"

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
}

export interface ReferendaSdkConfig {
  spenderOrigin: (value: bigint) => Origin | null
}

export interface ReferendaSdk {
  getOngoingReferenda(): Promise<OngoingReferendum[]>
  getSpenderTrack(value: bigint): {
    origin: PolkadotRuntimeOriginCaller
    enactment: () => Promise<number>
  }
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
