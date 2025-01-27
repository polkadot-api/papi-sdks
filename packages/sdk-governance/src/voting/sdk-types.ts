import { ReferendumInfo } from "@/referenda/descriptors"
import { SS58String, Transaction } from "polkadot-api"
import { Observable } from "rxjs"
import { VotingConviction } from "./descriptors"

export type PollOutcome = {
  ended: number
  side: "aye" | "nay"
} | null
export const getReferendumOutcome = (referendum: ReferendumInfo) => {
  if (referendum.type === "Approved" || referendum.type === "Rejected") {
    return {
      ended: referendum.value[0],
      side: referendum.type === "Approved" ? "aye" : "nay",
    }
  }
  return null
}

export interface StandardVote {
  type: "standard"
  poll: number
  direction: "aye" | "nay" | "abstain"
  balance: bigint
  conviction: VotingConviction | null

  getLock(poll: PollOutcome): number | null
  remove(): Transaction<any, string, string, unknown>
}
export interface SplitVote {
  type: "split"
  poll: number
  aye: bigint
  nay: bigint
  abstain: bigint
  remove(): Transaction<any, string, string, unknown>
}

export type AccountVote = StandardVote | SplitVote
export interface AccountCasting {
  type: "casting"
  track: number

  votes: AccountVote[]

  using: bigint
  lock: {
    block: number
    balance: bigint
  } | null
  unlock(): Transaction<any, string, string, unknown>
}
export interface AccountDelegation {
  type: "delegation"
  track: number

  target: SS58String
  balance: bigint
  conviction: VotingConviction
  remove(): Transaction<any, string, string, unknown>

  lock: {
    block: number
    balance: bigint
  } | null
  unlock(): Transaction<any, string, string, unknown>
}

export interface DelegationPower {
  track: number
  votes: bigint
  capital: bigint
}

export interface ConvictionVotingSdk {
  getVotes(account: SS58String): Promise<Array<AccountCasting>>
  getVotes(account: SS58String, track: number): Promise<AccountCasting | null>
  votes$(account: SS58String): Observable<Array<AccountCasting>>
  votes$(account: SS58String, track: number): Observable<AccountCasting | null>

  getDelegations(account: SS58String): Promise<Array<AccountDelegation>>
  getDelegations(
    account: SS58String,
    track: number,
  ): Promise<AccountDelegation | null>
  delegations$(account: SS58String): Observable<Array<AccountDelegation>>
  delegations$(
    account: SS58String,
    track: number,
  ): Observable<AccountDelegation | null>

  getDelegationPower(account: SS58String): Promise<Array<DelegationPower>>
  getDelegationPower(
    account: SS58String,
    track: number,
  ): Promise<DelegationPower>
  delegationPower$(account: SS58String): Observable<Array<DelegationPower>>
  delegationPower$(
    account: SS58String,
    track: number,
  ): Observable<DelegationPower>

  getTrackVoting(
    account: SS58String,
  ): Promise<Array<AccountCasting | AccountDelegation>>
  getTrackVoting(
    account: SS58String,
    track: number,
  ): Promise<AccountCasting | AccountDelegation>

  vote(
    poll: number,
    vote: Partial<{
      aye: bigint
      nay: bigint
      abstain: bigint
    }>,
  ): Transaction<any, string, string, unknown>
  voteWithConviction(
    poll: number,
    vote: "aye" | "nay",
    value: bigint,
    conviction: VotingConviction,
  ): Transaction<any, string, string, unknown>
}
