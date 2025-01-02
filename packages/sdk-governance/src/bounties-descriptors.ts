import {
  ApisTypedef,
  Binary,
  Enum,
  FixedSizeArray,
  FixedSizeBinary,
  PalletsTypedef,
  PlainDescriptor,
  SS58String,
  StorageDescriptor,
  TxDescriptor,
  TypedApi,
} from "polkadot-api"
import {
  PolkadotRuntimeOriginCaller,
  PreimagesBounded,
} from "./referenda-descriptors"

export type BountiesBountyStatus = Enum<{
  Proposed: undefined
  Approved: undefined
  Funded: undefined
  CuratorProposed: {
    curator: SS58String
  }
  Active: {
    curator: SS58String
    update_due: number
  }
  PendingPayout: {
    curator: SS58String
    beneficiary: SS58String
    unlock_at: number
  }
}>
export interface BountyWithoutDescription {
  proposer: SS58String
  value: bigint
  fee: bigint
  curator_deposit: bigint
  bond: bigint
  status: BountiesBountyStatus
}

type BountiesSdkPallets = PalletsTypedef<
  {
    Preimage: {
      PreimageFor: StorageDescriptor<
        [Key: [Binary, number]],
        Binary,
        true,
        never
      >
    }
    Bounties: {
      /**
       * Number of bounty proposals that have been made.
       */
      BountyCount: StorageDescriptor<[], number, false, never>
      /**
       * Bounties that have been made.
       */
      Bounties: StorageDescriptor<
        [Key: number],
        BountyWithoutDescription,
        true,
        never
      >
      /**
       * The description of each bounty.
       */
      BountyDescriptions: StorageDescriptor<[Key: number], Binary, true, never>
    }
    Scheduler: {
      /**
       * Items to be executed, indexed by the block number that they should be executed on.
       */
      Agenda: StorageDescriptor<
        [Key: number],
        Array<
          | {
              maybe_id?: FixedSizeBinary<32> | undefined
              priority: number
              call: PreimagesBounded
              maybe_periodic?: FixedSizeArray<2, number> | undefined
              origin: PolkadotRuntimeOriginCaller
            }
          | undefined
        >,
        false,
        never
      >
    }
  },
  {
    Bounties: {
      approve_bounty: TxDescriptor<{
        bounty_id: number
      }>
      propose_curator: TxDescriptor<{
        bounty_id: number
        curator: MultiAddress
        fee: bigint
      }>
      unassign_curator: TxDescriptor<{
        bounty_id: number
      }>
      accept_curator: TxDescriptor<{
        bounty_id: number
      }>
      award_bounty: TxDescriptor<{
        bounty_id: number
        beneficiary: MultiAddress
      }>
      claim_bounty: TxDescriptor<{
        bounty_id: number
      }>
      close_bounty: TxDescriptor<{
        bounty_id: number
      }>
      extend_bounty_expiry: TxDescriptor<{
        bounty_id: number
        remark: Binary
      }>
    }
  },
  {
    Bounties: {
      /**
       *New bounty proposal.
       */
      BountyProposed: PlainDescriptor<{
        index: number
      }>
    }
  },
  {},
  {}
>
type BountiesSdkDefinition = SdkDefinition<BountiesSdkPallets, ApisTypedef<{}>>
export type BountiesSdkTypedApi = TypedApi<BountiesSdkDefinition>

type SdkDefinition<P, R> = {
  descriptors: Promise<any> & {
    pallets: P
    apis: R
  }
  asset: any
  metadataTypes: any
}

export type MultiAddress = Enum<{
  Id: SS58String
  Index: undefined
  Raw: Binary
  Address32: FixedSizeBinary<32>
  Address20: FixedSizeBinary<20>
}>
