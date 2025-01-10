import {
  ApisTypedef,
  Binary,
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

type WhoAmount = {
  who: SS58String
  amount: bigint
}
type BasicReferndumInfo = [number, WhoAmount | undefined, WhoAmount | undefined]

export type PolkadotRuntimeOriginCaller = Enum<{
  system: Enum<{
    Root: undefined
    Signed: SS58String
    None: undefined
  }>
  Origins: Enum<{
    StakingAdmin: undefined
    Treasurer: undefined
    FellowshipAdmin: undefined
    GeneralAdmin: undefined
    AuctionAdmin: undefined
    LeaseAdmin: undefined
    ReferendumCanceller: undefined
    ReferendumKiller: undefined
    SmallTipper: undefined
    BigTipper: undefined
    SmallSpender: undefined
    MediumSpender: undefined
    BigSpender: undefined
    WhitelistedCaller: undefined
    WishForChange: undefined
  }>
  ParachainsOrigin: Enum<{
    Parachain: number
  }>
  XcmPallet: any
  Void: undefined
}>

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

export type ReferendumInfo = Enum<{
  Ongoing: {
    track: number
    origin: PolkadotRuntimeOriginCaller
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
  Approved: BasicReferndumInfo
  Rejected: BasicReferndumInfo
  Cancelled: BasicReferndumInfo
  TimedOut: BasicReferndumInfo
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

export type ReferendaTrack = {
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

type ReferendaSdkPallets = PalletsTypedef<
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
        ReferendumInfo,
        true,
        never
      >
    }
    Balances: {
      TotalIssuance: StorageDescriptor<[], bigint, false, never>
    }
  },
  {
    Referenda: {
      submit: TxDescriptor<{
        proposal_origin: PolkadotRuntimeOriginCaller
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
      Tracks: PlainDescriptor<Array<[number, ReferendaTrack]>>
    }
  }
>
type ReferendaSdkDefinition = SdkDefinition<
  ReferendaSdkPallets,
  ApisTypedef<{}>
>
export type ReferendaSdkTypedApi = TypedApi<ReferendaSdkDefinition>

type SdkDefinition<P, R> = {
  descriptors: Promise<any> & {
    pallets: P
    apis: R
  }
  asset: any
  metadataTypes: any
}
