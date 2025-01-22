import { SdkDefinition } from "@polkadot-api/common-sdk-utils"
import {
  ApisTypedef,
  Binary,
  Enum,
  FixedSizeBinary,
  PalletsTypedef,
  SS58String,
  StorageDescriptor,
  TxDescriptor,
  TypedApi,
} from "polkadot-api"

export type ConvictionVotingVoteAccountVote = Enum<{
  Standard: {
    vote: number
    balance: bigint
  }
  Split: {
    aye: bigint
    nay: bigint
  }
  SplitAbstain: {
    aye: bigint
    nay: bigint
    abstain: bigint
  }
}>

export type VotingConviction = Enum<{
  None: undefined
  Locked1x: undefined
  Locked2x: undefined
  Locked3x: undefined
  Locked4x: undefined
  Locked5x: undefined
  Locked6x: undefined
}>

export type ConvictionVotingVoteVoting = Enum<{
  Casting: {
    votes: Array<[number, ConvictionVotingVoteAccountVote]>
    delegations: {
      votes: bigint
      capital: bigint
    }
    prior: [number, bigint]
  }
  Delegating: {
    balance: bigint
    target: SS58String
    conviction: VotingConviction
    delegations: {
      votes: bigint
      capital: bigint
    }
    prior: [number, bigint]
  }
}>

type BountiesSdkPallets = PalletsTypedef<
  {
    ConvictionVoting: {
      VotingFor: StorageDescriptor<
        [SS58String, number],
        ConvictionVotingVoteVoting,
        false,
        never
      >
    }
  },
  {
    ConvictionVoting: {
      vote: TxDescriptor<{
        poll_index: number
        vote: ConvictionVotingVoteAccountVote
      }>
      delegate: TxDescriptor<{
        class: number
        to: MultiAddress
        conviction: VotingConviction
        balance: bigint
      }>
      undelegate: TxDescriptor<{
        class: number
      }>
      unlock: TxDescriptor<{
        class: number
        target: MultiAddress
      }>
      remove_vote: TxDescriptor<{
        class?: number | undefined
        index: number
      }>
    }
  },
  {},
  {},
  {}
>
type BountiesSdkDefinition = SdkDefinition<BountiesSdkPallets, ApisTypedef<{}>>
export type BountiesSdkTypedApi = TypedApi<BountiesSdkDefinition>

export type MultiAddress = Enum<{
  Id: SS58String
  Index: undefined
  Raw: Binary
  Address32: FixedSizeBinary<32>
  Address20: FixedSizeBinary<20>
}>
