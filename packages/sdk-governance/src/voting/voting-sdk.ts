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
  ConvictionVotingSdk,
  UnlockSchedule,
  Vote,
  VotingTrack,
} from "./sdk-types"

export function createConvictionVotingSdk(
  typedApi: VotingSdkTypedApi,
): ConvictionVotingSdk {
  const enhanceVotingFor = (
    [account, track]: [SS58String, number],
    votingFor: ConvictionVotingVoteVoting,
    voteLockingPeriod: number,
  ): VotingTrack => {
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

    const trackDetails = {
      track,
      delegationPower,
      lock,
      unlock,
    }

    if (votingFor.type === "Casting") {
      // Rollup typescript build struggles otherwise
      const rawVotes: [number, ConvictionVotingVoteAccountVote][] =
        votingFor.value.votes
      const votes = rawVotes.map(([poll, vote]): Vote => {
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
              if (convictionValue && outcome?.side === direction) {
                const end =
                  outcome.ended +
                  convictionLockMultiplier[conviction.type] * voteLockingPeriod

                return {
                  type:
                    !trackDetails.lock || trackDetails.lock.block === end
                      ? "locked"
                      : trackDetails.lock.block < end
                        ? // Only `extends` if the outer balance is greater than the vote balance
                          // Because it actually only has an effect if it's extending the lock of a larger amount of tokens
                          trackDetails.lock.balance > vote.value.balance
                          ? "extends"
                          : "locked"
                        : // Same reasoning
                          trackDetails.lock.balance < vote.value.balance
                          ? "extended"
                          : "locked",
                  end,
                }
              }
              return { type: "free" }
            },
            remove,
          }
        }
        const votes = {
          aye: vote.value.aye,
          nay: vote.value.nay,
          abstain: ((vote.value as any).abstain as bigint) ?? 0n,
        }
        const votesWithValue = Object.entries(votes).filter(([, v]) => v > 0n)
        if (votesWithValue.length === 1) {
          return {
            type: "standard",
            poll,
            direction: votesWithValue[0][0] as any,
            balance: votesWithValue[0][1],
            conviction: {
              type: "None",
              value: undefined,
            },
            getLock() {
              return { type: "free" }
            },
            remove,
          }
        }
        return {
          type: "split",
          poll,
          balance: Object.values(votes).reduce((a, b) => a + b),
          ...votes,
          getLock() {
            return { type: "free" }
          },
          remove,
        }
      })

      return {
        type: "casting",
        votes,
        getUnlockSchedule(outcomes) {
          const unlocks = votes.map((v, i) => {
            const lock = v.getLock(outcomes[i])
            return {
              type: "poll" as "poll" | "lock",
              id: v.poll,
              block: lock.type === "free" ? 0 : lock.end,
              balance: v.balance,
            }
          })
          if (trackDetails.lock) {
            unlocks.push({
              type: "lock",
              id: 0,
              ...trackDetails.lock,
            })
          }
          unlocks.sort((a, b) => Number(a.balance - b.balance))

          const result: UnlockSchedule = []

          let unlocked = 0
          const getNextGroup = () => {
            if (unlocked >= unlocks.length) return []

            const start = unlocked
            const balance = unlocks[unlocked++].balance
            while (
              unlocked < result.length &&
              unlocks[unlocked].balance === balance
            ) {
              unlocked++
            }
            return unlocks.slice(start, unlocked)
          }

          let block = 0
          while (unlocked < unlocks.length) {
            const group = getNextGroup()
            const nextBalance = unlocks[unlocked]?.balance ?? 0n
            block = Math.max(block, ...group.map((l) => l.block))
            const balance = group[0].balance - nextBalance

            result.push({
              block,
              balance,
              unlocks: group.map((v) =>
                v.type === "lock"
                  ? { type: "lock" }
                  : {
                      type: "poll",
                      id: v.id,
                    },
              ),
            })
          }

          return result
        },
        ...trackDetails,
      }
    }
    return {
      type: "delegating",
      target: votingFor.value.target,
      balance: votingFor.value.balance,
      conviction: votingFor.value.conviction,
      lockDuration:
        convictionLockMultiplier[votingFor.value.conviction.type] *
        voteLockingPeriod,
      remove() {
        return typedApi.tx.ConvictionVoting.undelegate({
          class: track,
        })
      },
      ...trackDetails,
    }
  }

  const voteLockingPeriod$ =
    typedApi.constants.ConvictionVoting.VoteLockingPeriod()
  const votingTrack$ = (account: SS58String, track: number) =>
    combineLatest([
      typedApi.query.ConvictionVoting.VotingFor.watchValue(account, track).pipe(
        map(({ value }) => value),
      ),
      voteLockingPeriod$,
    ]).pipe(
      map(([v, lockPeriod]) =>
        enhanceVotingFor([account, track], v, lockPeriod),
      ),
    )
  const watchTracks$ = (account: SS58String) => {
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

  function votingTracks$(account: SS58String): Observable<Array<VotingTrack>> {
    const { getTrackById$, trackKeyChanges$ } = watchTracks$(account)
    return combineKeys(trackKeyChanges$, getTrackById$).pipe(
      map((map) => Array.from(map.values())),
    )
  }

  return {
    votingTrack$,
    votingTracks$,
    getVotingTrack(account, track) {
      return firstValueFrom(votingTrack$(account, track))
    },
    getVotingTracks(account) {
      return firstValueFrom(votingTracks$(account))
    },
    voteSplit(poll, vote) {
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
    vote(vote, poll, value, conviction) {
      const voteValue =
        (vote === "aye" ? 0x80 : 0) |
        Math.max(0, convictions.indexOf(conviction ? conviction.type : "None"))

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
    voteAbstain(poll, value) {
      return typedApi.tx.ConvictionVoting.vote({
        poll_index: poll,
        vote: {
          type: "SplitAbstain",
          value: {
            abstain: value,
            aye: 0n,
            nay: 0n,
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
