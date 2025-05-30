import { SdkDefinition } from "@polkadot-api/common-sdk-utils"
import {
  ApisTypedef,
  Binary,
  ChainDefinition,
  Enum,
  FixedSizeArray,
  PalletsTypedef,
  PlainDescriptor,
  SS58String,
  StorageDescriptor,
  TxCallData,
  TxDescriptor,
  TypedApi,
} from "polkadot-api"

export type WhoAmount = {
  who: SS58String
  amount: bigint
}
type BasicReferendumInfo = [
  number,
  WhoAmount | undefined,
  WhoAmount | undefined,
]

type ExtendableEnum<T extends {}> = Enum<T> | { type: string; value: unknown }

type PolkadotRuntimeOriginCallerVariants = {
  system: ExtendableEnum<{
    Root: undefined
  }>
  Origins: ExtendableEnum<{
    Treasurer: undefined
    SmallTipper: undefined
    BigTipper: undefined
    SmallSpender: undefined
    MediumSpender: undefined
    BigSpender: undefined
  }>
}
export type PolkadotRuntimeOriginCallerOriginal =
  Enum<PolkadotRuntimeOriginCallerVariants>
export type PolkadotRuntimeOriginCaller =
  ExtendableEnum<PolkadotRuntimeOriginCallerVariants>

export type PreimagesBounded = Enum<{
  Legacy: {
    hash: Binary
  }
  Inline: Binary
  Lookup: {
    hash: Binary
    len: number
  }
}>
export type TraitsScheduleDispatchTime = Enum<{
  At: number
  After: number
}>

export type ReferendumInfo<TOrigin = unknown> = Enum<{
  Ongoing: {
    track: number
    origin: TOrigin
    proposal: PreimagesBounded
    enactment: Enum<{
      At: number
      After: number
    }>
    submitted: number
    submission_deposit: WhoAmount
    decision_deposit?: WhoAmount | undefined
    deciding?:
      | {
          since: number
          confirming?: number | undefined
        }
      | undefined
    tally: {
      ayes: bigint
      nays: bigint
      support: bigint
    }
    in_queue: boolean
    alarm?: [number, FixedSizeArray<2, number>] | undefined
  }
  Approved: BasicReferendumInfo
  Rejected: BasicReferendumInfo
  Cancelled: BasicReferendumInfo
  TimedOut: BasicReferendumInfo
  Killed: number
}>

export type ReferendaTypesCurve = Enum<{
  LinearDecreasing: {
    length: number
    floor: number
    ceil: number
  }
  SteppedDecreasing: {
    begin: number
    end: number
    step: number
    period: number
  }
  Reciprocal: {
    factor: bigint
    x_offset: bigint
    y_offset: bigint
  }
}>

export type ReferendaTrackData = {
  name: string
  max_deciding: number
  decision_deposit: bigint
  prepare_period: number
  decision_period: number
  confirm_period: number
  min_enactment_period: number
  min_approval: ReferendaTypesCurve
  min_support: ReferendaTypesCurve
}

type ReferendaSdkPallets<TOrigin> = PalletsTypedef<
  {
    Preimage: {
      PreimageFor: StorageDescriptor<
        [Key: [Binary, number]],
        Binary,
        true,
        never
      >
    }
    Referenda: {
      /**
       * Information concerning any given referendum.
       */
      ReferendumInfoFor: StorageDescriptor<
        [Key: number],
        ReferendumInfo<TOrigin>,
        true,
        never
      >
    }
    Balances: {
      TotalIssuance: StorageDescriptor<[], bigint, false, never>
      InactiveIssuance: StorageDescriptor<[], bigint, false, never>
    }
  },
  {
    Referenda: {
      submit: TxDescriptor<{
        proposal_origin: TOrigin
        proposal: PreimagesBounded
        enactment_moment: TraitsScheduleDispatchTime
      }>
    }
    Utility: {
      batch_all: TxDescriptor<{
        calls: Array<TxCallData>
      }>
    }
    Preimage: {
      note_preimage: TxDescriptor<{
        bytes: Binary
      }>
    }
  },
  {
    Referenda: {
      Submitted: PlainDescriptor<{
        index: number
        track: number
        proposal: PreimagesBounded
      }>
    }
  },
  {},
  {
    Referenda: {
      Tracks: PlainDescriptor<Array<[number, ReferendaTrackData]>>
    }
  },
  {}
>
type ReferendaSdkDefinition<TOrigin> = SdkDefinition<
  ReferendaSdkPallets<TOrigin>,
  ApisTypedef<{}>
>
export type ReferendaSdkTypedApi<TOrigin = unknown> = TypedApi<
  ReferendaSdkDefinition<TOrigin>
>

export type RuntimeOriginCaller<T extends TypedApi<ChainDefinition>> =
  T extends TypedApi<infer D>
    ? D["descriptors"]["pallets"]["__tx"]["Referenda"]["submit"]["___"]["proposal_origin"]
    : Enum<Record<string, unknown>>
