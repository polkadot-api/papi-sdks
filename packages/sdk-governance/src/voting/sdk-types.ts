import { SS58String, Transaction } from "polkadot-api"
import { Observable } from "rxjs"
import { VotingConviction } from "./descriptors"

export type PollOutcome = {
  ended: number
  side: "aye" | "nay"
} | null

/**
 * Types:
 * - free: The funds locked by this vote will become free once the vote is removed.
 * - locked: The funds locked by this vote will become locked once the vote is removed.
 * - extends: Removing this vote will extend the duration of a pre-existing lock.
 * - extended: Removing this vote before its end will have it locked for the duration of the pre-existing lock.
 */
export type VoteLock =
  | {
      type: "free"
    }
  | {
      type: "locked" | "extends" | "extended"
      end: number
    }

interface CommonVote {
  poll: number
  balance: bigint

  getLock(outcome: PollOutcome): VoteLock
  remove(): Transaction<any, string, string, unknown>
}
export interface StandardVote extends CommonVote {
  type: "standard"

  direction: "aye" | "nay" | "abstain"
  conviction: VotingConviction
}
export interface SplitVote extends CommonVote {
  type: "split"

  aye: bigint
  nay: bigint
  abstain: bigint
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
export type UnlockSchedule = Array<{
  block: number
  balance: bigint
  unlocks: Array<
    | {
        type: "poll"
        id: number
      }
    | {
        type: "lock"
      }
  >
}>

export interface TrackCasting extends TrackDetails {
  type: "casting"
  votes: Vote[]
  getUnlockSchedule(pollOutcomes: Record<number, PollOutcome>): UnlockSchedule
}
export interface TrackDelegating extends TrackDetails {
  type: "delegating"
  target: SS58String
  balance: bigint
  conviction: VotingConviction
  lockDuration: number
  remove(): Transaction<any, string, string, unknown>
}
export type VotingTrack = TrackCasting | TrackDelegating

export interface DelegationPower {
  track: number
  votes: bigint
  capital: bigint
}

export interface ConvictionVotingSdk {
  getVotingTracks(account: SS58String): Promise<Array<VotingTrack>>
  getVotingTrack(account: SS58String, track: number): Promise<VotingTrack>
  votingTracks$(account: SS58String): Observable<Array<VotingTrack>>
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
