import {
  ApisTypedef,
  Binary,
  Enum,
  FixedSizeArray,
  FixedSizeBinary,
  PalletsTypedef,
  SS58String,
  StorageDescriptor,
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
  {},
  {},
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
