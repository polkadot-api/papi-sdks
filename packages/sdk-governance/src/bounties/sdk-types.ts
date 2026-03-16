import { SS58String, Transaction, TxEvent } from "polkadot-api"
import { Observable } from "rxjs"
import { OngoingReferendum } from "../referenda/sdk-types"
import {
  BountiesBountyStatus,
  BountyWithoutDescription,
  MultiAddress,
} from "./descriptors"

export interface GenericBounty extends BountyWithoutDescription {
  type: BountiesBountyStatus["type"]
  id: number
  description: string | null
  account: SS58String
}

interface ClosableBounty {
  close(): Transaction
}
export interface ProposedBounty<
  TEnums extends {
    origin: unknown
  } = { origin: unknown },
>
  extends GenericBounty, ClosableBounty {
  type: "Proposed"
  approve(): Transaction
  filterApprovingReferenda(referenda: OngoingReferendum<TEnums>[]): Promise<
    Array<{
      referendum: OngoingReferendum<TEnums>
      proposeCuratorCalls: {
        curator: MultiAddress
        fee: bigint
      }[]
    }>
  >
  getScheduledApprovals(): Promise<number[]>
  // TODO incoming approveWithCurator()
}
export interface ApprovedBounty extends GenericBounty {
  type: "Approved" | "ApprovedWithCurator"
}
export interface FundedBounty<
  TEnums extends {
    origin: unknown
  } = { origin: unknown },
>
  extends GenericBounty, ClosableBounty {
  type: "Funded"
  proposeCurator(curator: SS58String, fee: bigint): Transaction
  filterProposingReferenda(referenda: OngoingReferendum<TEnums>[]): Promise<
    Array<{
      referendum: OngoingReferendum<TEnums>
      proposeCuratorCalls: {
        curator: MultiAddress
        fee: bigint
      }[]
    }>
  >
  getScheduledProposals(): Promise<
    Array<{
      height: number
      proposeCuratorCalls: {
        curator: MultiAddress
        fee: bigint
      }[]
    }>
  >
}

interface CuratorUnassignable {
  unassignCurator(): Transaction
}
export interface CuratorProposedBounty
  extends GenericBounty, CuratorUnassignable, ClosableBounty {
  type: "CuratorProposed"
  curator: SS58String
  acceptCuratorRole(): Transaction
}
export interface ActiveBounty
  extends GenericBounty, CuratorUnassignable, ClosableBounty {
  type: "Active"
  curator: SS58String
  updateDue: number
  extendExpiry(remark?: string): Transaction
  award(beneficiary: SS58String): Transaction
}
export interface PendingPayoutBounty
  extends GenericBounty, CuratorUnassignable {
  type: "PendingPayout"
  curator: SS58String
  beneficiary: SS58String
  unlockAt: number
  claim(): Transaction
}

export type Bounty<
  TEnums extends {
    origin: unknown
  } = { origin: unknown },
> =
  | ProposedBounty<TEnums>
  | ApprovedBounty
  | FundedBounty<TEnums>
  | CuratorProposedBounty
  | ActiveBounty
  | PendingPayoutBounty

export interface BountiesSdk<
  TEnums extends {
    origin: unknown
  } = { origin: unknown },
> {
  watch: {
    bounties$: Observable<Map<number, Bounty<TEnums>>>
    bountyIds$: Observable<number[]>
    getBountyById$: (key: number) => Observable<Bounty<TEnums>>
  }
  getBounty(id: number): Promise<Bounty<TEnums> | null>
  getBounties(): Promise<Bounty<TEnums>[]>
  getProposedBounty(txEvent: TxEvent): Promise<ProposedBounty<TEnums> | null>
}
