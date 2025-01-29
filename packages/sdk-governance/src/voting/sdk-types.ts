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
  conviction: VotingConviction

  getLock(outcome: PollOutcome): number | null
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
export type Vote = StandardVote | SplitVote

interface TrackDetails {
  track: number
  delegationPower: DelegationPower
  lock: {
    block: number
    balance: bigint
  } | null
  unlock(): Transaction<any, string, string, unknown>
}
export interface TrackCasting extends TrackDetails {
  type: "casting"
  votes: Vote[]
  using: bigint
}
export interface TrackDelegating extends TrackDetails {
  type: "delegation"
  target: SS58String
  balance: bigint
  conviction: VotingConviction
  remove(): Transaction<any, string, string, unknown>
}
export type VotingTrack = TrackCasting | TrackDelegating

export interface DelegationPower {
  track: number
  votes: bigint
  capital: bigint
}

export interface ConvictionVotingSdk {
  getVotingTrack(account: SS58String): Promise<Array<VotingTrack>>
  getVotingTrack(account: SS58String, track: number): Promise<VotingTrack>
  votingTrack$(account: SS58String): Observable<Array<VotingTrack>>
  votingTrack$(account: SS58String, track: number): Observable<VotingTrack>

  vote(
    vote: "aye" | "nay",
    poll: number,
    value: bigint,
    conviction?: VotingConviction,
  ): Transaction<any, string, string, unknown>
  voteAbstain(
    poll: number,
    value: bigint,
  ): Transaction<any, string, string, unknown>
  voteSplit(
    poll: number,
    vote: Partial<{
      aye: bigint
      nay: bigint
      abstain: bigint
    }>,
  ): Transaction<any, string, string, unknown>
}
