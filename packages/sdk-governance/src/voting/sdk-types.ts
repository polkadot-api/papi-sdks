import { SS58String, Transaction } from "polkadot-api"
import { VotingConviction } from "./descriptors"

export interface AccountVote {
  type: "vote"
  track: number
  poll: number

  vote:
    | {
        type: "standard"
        direction: "aye" | "nay" | "abstain"
        balance: bigint
        conviction: VotingConviction | null
      }
    | {
        type: "split"
        aye: bigint
        nay: bigint
        abstain: bigint
      }

  remove(): Transaction<any, string, string, unknown>

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
  getVotes(account: SS58String): Promise<Array<AccountVote>>
  getTrackVotes(account: SS58String, track: number): Promise<Array<AccountVote>>

  getDelegations(account: SS58String): Promise<Array<AccountDelegation>>
  getDelegation(
    account: SS58String,
    track: number,
  ): Promise<AccountDelegation | null>

  getDelegationPower(account: SS58String): Promise<Array<DelegationPower>>
  getDelegationPower(
    account: SS58String,
    track: number,
  ): Promise<DelegationPower | null>

  getTracks(
    account: SS58String,
  ): Promise<Array<AccountVote[] | AccountDelegation>>
  getTrack(
    account: SS58String,
    track: number,
  ): Promise<AccountVote[] | AccountDelegation | null>

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
