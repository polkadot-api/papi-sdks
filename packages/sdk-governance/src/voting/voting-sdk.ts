import { partitionEntries } from "@/util/watchEntries"
import { combineKeys, toKeySet } from "@react-rxjs/utils"
import { SS58String } from "polkadot-api"
import { combineLatest, firstValueFrom, map, Observable } from "rxjs"
import {
  ConvictionVotingVoteAccountVote,
  ConvictionVotingVoteVoting,
  VotingConviction,
  VotingSdkTypedApi,
} from "./descriptors"
import {
  AccountCasting,
  AccountDelegation,
  AccountVote,
  ConvictionVotingSdk,
  DelegationPower,
} from "./sdk-types"

export function createConvictionVotingSdk(
  typedApi: VotingSdkTypedApi,
): ConvictionVotingSdk {
  const enhanceVotingFor = (
    [account, track]: [SS58String, number],
    votingFor: ConvictionVotingVoteVoting,
    voteLockingPeriod: number,
  ): {
    votes: AccountCasting | AccountDelegation
    delegationPower: DelegationPower
  } => {
    const lock = votingFor.value.prior[1]
      ? {
          block: votingFor.value.prior[0],
          balance: votingFor.value.prior[1],
        }
      : null

    const unlock = () =>
      typedApi.tx.ConvictionVoting.unlock({
        class: track,
        target: {
          type: "Id",
          value: account,
        },
      })

    const delegationPower = {
      track,
      ...votingFor.value.delegations,
    }

    if (votingFor.type === "Casting") {
      const votes = votingFor.value.votes.map(
        ([poll, vote]: [
          number,
          ConvictionVotingVoteAccountVote,
        ]): AccountVote => {
          const remove = () =>
            typedApi.tx.ConvictionVoting.remove_vote({
              class: track,
              index: poll,
            })

          if (vote.type === "Standard") {
            const convictionValue = vote.value.vote & 0x7f
            const conviction = {
              type: convictions[convictionValue],
              value: undefined,
            }
            const direction: "aye" | "nay" =
              vote.value.vote & 0x80 ? "aye" : "nay"

            return {
              type: "standard",
              poll,
              direction,
              balance: vote.value.balance,
              conviction,
              getLock(outcome) {
                return convictionValue && outcome?.side === direction
                  ? outcome.ended +
                      convictionLockMultiplier[conviction.type] *
                        voteLockingPeriod
                  : null
              },
              remove,
            }
          }
          const votes = {
            aye: vote.value.aye,
            nay: vote.value.nay,
            abstain: (vote.value as any).abstain ?? 0n,
          }
          const votesWithValue = Object.entries(votes).filter(([, v]) => v > 0n)
          if (votesWithValue.length === 1) {
            return {
              type: "standard",
              poll,
              direction: votesWithValue[0][0] as any,
              balance: votesWithValue[0][1],
              conviction: null,
              getLock() {
                return null
              },
              remove,
            }
          }
          return {
            type: "split",
            poll,
            ...votes,
            remove,
          }
        },
      )

      return {
        votes: {
          type: "casting",
          lock,
          unlock,
          track,
          votes,
          using: votes
            .map((v) =>
              v.type === "standard" ? v.balance : v.abstain + v.aye + v.nay,
            )
            .reduce((a, b) => a + b),
        },
        delegationPower,
      }
    }
    return {
      votes: {
        type: "delegation",
        track,
        lock,
        target: votingFor.value.target,
        balance: votingFor.value.balance,
        conviction: votingFor.value.conviction,
        remove() {
          return typedApi.tx.ConvictionVoting.undelegate({
            class: track,
          })
        },
        unlock,
      },
      delegationPower,
    }
  }

  const voteLockingPeriod$ =
    typedApi.constants.ConvictionVoting.VoteLockingPeriod()
  const track$ = (account: SS58String, track: number) =>
    combineLatest([
      typedApi.query.ConvictionVoting.VotingFor.watchValue(account, track),
      voteLockingPeriod$,
    ]).pipe(
      map(([v, lockPeriod]) =>
        enhanceVotingFor([account, track], v, lockPeriod),
      ),
    )
  const tracks$ = (account: SS58String) => {
    const [getTrackById$, trackKeyChanges$] = partitionEntries(
      typedApi.query.ConvictionVoting.VotingFor.watchEntries(account).pipe(
        map((v) => ({
          deltas: v.deltas
            ? {
                deleted: v.deltas.deleted.map((d) => ({
                  args: [d.args[1]],
                  value: { track: d.args[1], value: d.value },
                })),
                upserted: v.deltas.upserted.map((d) => ({
                  args: [d.args[1]],
                  value: { track: d.args[1], value: d.value },
                })),
              }
            : null,
        })),
      ),
    )

    const trackIds$ = trackKeyChanges$.pipe(
      toKeySet(),
      map((set) => [...set]),
    )

    const getEnhancedTrackById$ = (id: number) =>
      combineLatest([getTrackById$(id), voteLockingPeriod$]).pipe(
        map(([{ track, value }, lockPeriod]) =>
          enhanceVotingFor([account, track], value, lockPeriod),
        ),
      )

    return { getTrackById$: getEnhancedTrackById$, trackIds$, trackKeyChanges$ }
  }

  function getTrackVoting(
    account: SS58String,
  ): Promise<Array<AccountCasting | AccountDelegation>>
  function getTrackVoting(
    account: SS58String,
    track: number,
  ): Promise<AccountCasting | AccountDelegation>
  function getTrackVoting(account: SS58String, track?: number) {
    if (track != null) {
      return firstValueFrom(track$(account, track).pipe(map((v) => v.votes)))
    }

    const { getTrackById$, trackKeyChanges$ } = tracks$(account)
    return firstValueFrom(
      combineKeys(trackKeyChanges$, getTrackById$).pipe(
        map((map) => Array.from(map.values()).map((v) => v.votes)),
      ),
    )
  }

  function votes$(account: SS58String): Observable<Array<AccountCasting>>
  function votes$(
    account: SS58String,
    track: number,
  ): Observable<AccountCasting | null>
  function votes$(account: SS58String, track?: number) {
    if (track != null) {
      return track$(account, track).pipe(
        map((v) => (v.votes.type === "casting" ? v.votes : null)),
      )
    }

    const { getTrackById$, trackKeyChanges$ } = tracks$(account)
    return combineKeys(trackKeyChanges$, getTrackById$).pipe(
      map((map) =>
        Array.from(map.values())
          .map((v) => (v.votes.type === "casting" ? v.votes : null))
          .filter((v) => !!v),
      ),
    )
  }

  function delegations$(
    account: SS58String,
  ): Observable<Array<AccountDelegation>>
  function delegations$(
    account: SS58String,
    track: number,
  ): Observable<AccountDelegation | null>
  function delegations$(account: SS58String, track?: number) {
    if (track != null) {
      return track$(account, track).pipe(
        map((v) => (v.votes.type === "delegation" ? v.votes : null)),
      )
    }

    const { getTrackById$, trackKeyChanges$ } = tracks$(account)
    return combineKeys(trackKeyChanges$, getTrackById$).pipe(
      map((map) =>
        Array.from(map.values())
          .map((v) => (v.votes.type === "delegation" ? v.votes : null))
          .filter((v) => !!v),
      ),
    )
  }

  function delegationPower$(
    account: SS58String,
  ): Observable<Array<DelegationPower>>
  function delegationPower$(
    account: SS58String,
    track: number,
  ): Observable<DelegationPower>
  function delegationPower$(account: SS58String, track?: number) {
    if (track != null) {
      return track$(account, track).pipe(map((v) => v.delegationPower))
    }

    const { getTrackById$, trackKeyChanges$ } = tracks$(account)
    return combineKeys(trackKeyChanges$, getTrackById$).pipe(
      map((map) => Array.from(map.values()).map((v) => v.delegationPower)),
    )
  }

  return {
    getTrackVoting,
    getVotes: promisifyDual(votes$),
    votes$,
    getDelegationPower: promisifyDual(delegationPower$),
    delegationPower$,
    getDelegations: promisifyDual(delegations$),
    delegations$,
    vote(poll, vote) {
      const voteEntries = Object.entries(vote).filter(
        ([, value]) => (value ?? 0n) > 0n,
      )
      const hasAbstain = (vote.abstain ?? 0n) > 0n

      const singleVote =
        voteEntries.length === 1
          ? {
              vote: voteEntries[0][0] === "aye" ? 0x80 : 0,
              balance: voteEntries[0][1],
            }
          : null

      return typedApi.tx.ConvictionVoting.vote({
        poll_index: poll,
        vote: hasAbstain
          ? {
              type: "SplitAbstain",
              value: {
                abstain: vote.abstain ?? 0n,
                aye: vote.aye ?? 0n,
                nay: vote.nay ?? 0n,
              },
            }
          : singleVote
            ? {
                type: "Standard",
                value: singleVote,
              }
            : {
                type: "Split",
                value: {
                  aye: vote.aye ?? 0n,
                  nay: vote.nay ?? 0n,
                },
              },
      })
    },
    voteWithConviction(poll, vote, value, conviction) {
      const voteValue =
        (vote === "aye" ? 0x80 : 0) |
        Math.max(0, convictions.indexOf(conviction.type))

      return typedApi.tx.ConvictionVoting.vote({
        poll_index: poll,
        vote: {
          type: "Standard",
          value: {
            vote: voteValue,
            balance: value,
          },
        },
      })
    },
  }
}

const convictionLockMultiplier: Record<VotingConviction["type"], number> = {
  None: 0,
  Locked1x: 1,
  Locked2x: 2,
  Locked3x: 4,
  Locked4x: 8,
  Locked5x: 16,
  Locked6x: 32,
}

const convictions = Object.keys(
  convictionLockMultiplier,
) as VotingConviction["type"][]

function promisifyDual<A, B>(fn: {
  (account: SS58String): Observable<A>
  (account: SS58String, track: number): Observable<B>
}): {
  (account: SS58String): Promise<A>
  (account: SS58String, track: number): Promise<B>
} {
  return ((account: SS58String, track?: number) =>
    firstValueFrom((fn as any)(account, track))) as any
}
