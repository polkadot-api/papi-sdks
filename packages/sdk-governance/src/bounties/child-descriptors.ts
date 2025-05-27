import { SdkDefinition } from "@polkadot-api/common-sdk-utils"
import {
  ApisTypedef,
  Binary,
  DescriptorEntry,
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

export type ChildBountiesV0Storage = {
  ChildBounties: {
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
}

export type ChildBountiesV1Storage = {
  ChildBounties: {
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
    ChildBountyDescriptionsV1: StorageDescriptor<
      FixedSizeArray<2, number>,
      Binary,
      true,
      never
    >
  }
}

type ChildBountiesSdkPallets<
  St extends DescriptorEntry<StorageDescriptor<any, any, any, any>>,
> = PalletsTypedef<
  St,
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
  {},
  {},
  {},
  {}
>
type ChildBountiesSdkDefinition<
  St extends DescriptorEntry<StorageDescriptor<any, any, any, any>>,
> = SdkDefinition<ChildBountiesSdkPallets<St>, ApisTypedef<{}>>
export type ChildBountiesSdkTypedApi<
  St extends DescriptorEntry<StorageDescriptor<any, any, any, any>> =
    | ChildBountiesV0Storage
    | ChildBountiesV1Storage,
> = TypedApi<ChildBountiesSdkDefinition<St>>
