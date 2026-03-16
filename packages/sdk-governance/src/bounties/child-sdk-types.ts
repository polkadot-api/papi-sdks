import { SS58String, Transaction } from "polkadot-api"
import { Observable } from "rxjs"
import {
  BountiesChildBountyStatus,
  ChildBountyWithoutDescription,
} from "./child-descriptors"

export interface GenericChildBounty extends ChildBountyWithoutDescription {
  type: BountiesChildBountyStatus["type"]
  id: number
  description: string | null
  account: SS58String
}

interface ClosableBounty {
  close(): Transaction
}
export interface AddedChildBounty extends GenericChildBounty, ClosableBounty {
  type: "Added"
  proposeCurator(curator: SS58String, fee: bigint): Transaction
}

interface CuratorUnassignable {
  unassignCurator(): Transaction
}
export interface CuratorProposedChildBounty
  extends GenericChildBounty, CuratorUnassignable, ClosableBounty {
  type: "CuratorProposed"
  curator: SS58String
  acceptCuratorRole(): Transaction
}
export interface ActiveChildBounty
  extends GenericChildBounty, CuratorUnassignable, ClosableBounty {
  type: "Active"
  curator: SS58String
  award(beneficiary: SS58String): Transaction
}
export interface PendingPayoutChildBounty
  extends GenericChildBounty, CuratorUnassignable {
  type: "PendingPayout"
  curator: SS58String
  beneficiary: SS58String
  unlockAt: number
  claim(): Transaction
}

export type ChildBounty =
  | AddedChildBounty
  | CuratorProposedChildBounty
  | ActiveChildBounty
  | PendingPayoutChildBounty

export interface ChildBountiesSdk {
  watch(parentId: number): {
    bounties$: Observable<Map<number, ChildBounty>>
    bountyIds$: Observable<number[]>
    getBountyById$: (key: number) => Observable<ChildBounty>
  }
  getChildBounty(parentId: number, id: number): Promise<ChildBounty | null>
  getChildBounties(parentId: number): Promise<ChildBounty[]>
}
