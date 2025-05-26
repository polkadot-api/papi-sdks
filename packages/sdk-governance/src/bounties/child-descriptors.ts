import { SdkDefinition } from "@polkadot-api/common-sdk-utils"
import {
  ApisTypedef,
  Binary,
  Enum,
  FixedSizeArray,
  PalletsTypedef,
  SS58String,
  StorageDescriptor,
  TxDescriptor,
  TypedApi,
} from "polkadot-api"
import { MultiAddress } from "./descriptors"

export type BountiesChildBountyStatus = Enum<{
  Added: undefined
  CuratorProposed: {
    curator: SS58String
  }
  Active: {
    curator: SS58String
  }
  PendingPayout: {
    curator: SS58String
    beneficiary: SS58String
    unlock_at: number
  }
}>
export interface ChildBountyWithoutDescription {
  parent_bounty: number
  value: bigint
  fee: bigint
  curator_deposit: bigint
  status: BountiesChildBountyStatus
}

type ChildBountiesSdkPallets = PalletsTypedef<
  {
    ChildBounties: {
      /**
       * Number of child bounties per parent bounty.
       * Map of parent bounty index to number of child bounties.
       */
      ParentChildBounties: StorageDescriptor<
        [Key: number],
        number,
        false,
        never
      >
      /**
       * Child bounties that have been added.
       */
      ChildBounties: StorageDescriptor<
        FixedSizeArray<2, number>,
        ChildBountyWithoutDescription,
        true,
        never
      >
      /**
       * The description of each child-bounty.
       */
      ChildBountyDescriptions: StorageDescriptor<
        [Key: number],
        Binary,
        true,
        never
      >
    }
  },
  {
    ChildBounties: {
      add_child_bounty: TxDescriptor<{
        parent_bounty_id: number
        value: bigint
        description: Binary
      }>
      propose_curator: TxDescriptor<{
        parent_bounty_id: number
        child_bounty_id: number
        curator: MultiAddress
        fee: bigint
      }>
      accept_curator: TxDescriptor<{
        parent_bounty_id: number
        child_bounty_id: number
      }>
      unassign_curator: TxDescriptor<{
        parent_bounty_id: number
        child_bounty_id: number
      }>
      award_child_bounty: TxDescriptor<{
        parent_bounty_id: number
        child_bounty_id: number
        beneficiary: MultiAddress
      }>
      claim_child_bounty: TxDescriptor<{
        parent_bounty_id: number
        child_bounty_id: number
      }>
      close_child_bounty: TxDescriptor<{
        parent_bounty_id: number
        child_bounty_id: number
      }>
    }
  },
  {
    // ChildBounties: {
    //   /**
    //    *A child-bounty is added.
    //    */
    //   Added: PlainDescriptor<Anonymize<I60p8l86a8cm59>>
    //   /**
    //    *A child-bounty is awarded to a beneficiary.
    //    */
    //   Awarded: PlainDescriptor<Anonymize<I3m3sk2lgcabvp>>
    //   /**
    //    *A child-bounty is claimed by beneficiary.
    //    */
    //   Claimed: PlainDescriptor<Anonymize<I5pf572duh4oeg>>
    //   /**
    //    *A child-bounty is cancelled.
    //    */
    //   Canceled: PlainDescriptor<Anonymize<I60p8l86a8cm59>>
    // }
  },
  {},
  {},
  {}
>
type ChildBountiesSdkDefinition = SdkDefinition<
  ChildBountiesSdkPallets,
  ApisTypedef<{}>
>
export type ChildBountiesSdkTypedApi = TypedApi<ChildBountiesSdkDefinition>
