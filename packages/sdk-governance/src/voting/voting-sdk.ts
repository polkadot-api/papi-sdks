import { partitionEntries } from "@/util/watchEntries"
import { combineKeys, toKeySet } from "@react-rxjs/utils"
import { SS58String } from "polkadot-api"
import { firstValueFrom, map } from "rxjs"
import {
  ConvictionVotingVoteVoting,
  VotingConviction,
  VotingSdkTypedApi,
} from "./descriptors"
import {
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
  ): {
    votes: AccountVote[] | AccountDelegation
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
      return {
        votes: votingFor.value.votes.map(([poll, vote]) => {
          const getVote = (): AccountVote["vote"] => {
            if (vote.type === "Standard") {
              const convictionValue = vote.value.vote & 0x7f

              return {
                type: "standard",
                direction: vote.value.vote & 0x80 ? "aye" : "nay",
                balance: vote.value.balance,
                conviction: {
                  type: convictions[convictionValue],
                  value: undefined,
                },
              }
            }
            const votes = {
              aye: vote.value.aye,
              nay: vote.value.nay,
              abstain: (vote.value as any).abstain ?? 0n,
            }
            const votesWithValue = Object.entries(votes).filter(
              ([, v]) => v > 0n,
            )
            if (votesWithValue.length === 1) {
              return {
                type: "standard",
                direction: votesWithValue[0][0] as any,
                balance: votesWithValue[0][1],
                conviction: null,
              }
            }
            return {
              type: "split",
              ...votes,
            }
          }

          return {
            type: "vote",
            track: track,
            poll,
            vote: getVote(),
            lock,
            remove() {
              return typedApi.tx.ConvictionVoting.remove_vote({
                class: track,
                index: poll,
              })
            },
            unlock,
          }
        }),
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

  const track$ = (account: SS58String, track: number) =>
    typedApi.query.ConvictionVoting.VotingFor.watchValue(account, track).pipe(
      map((v) => enhanceVotingFor([account, track], v)),
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
      getTrackById$(id).pipe(
        map(({ track, value }) => enhanceVotingFor([account, track], value)),
      )

    return { getTrackById$: getEnhancedTrackById$, trackIds$, trackKeyChanges$ }
  }

  const getTrack = (account: SS58String, track: number) =>
    firstValueFrom(track$(account, track).pipe(map((v) => v.votes)))
  const getTracks = (account: SS58String) => {
    const { getTrackById$, trackKeyChanges$ } = tracks$(account)
    return firstValueFrom(
      combineKeys(trackKeyChanges$, getTrackById$).pipe(
        map((map) => Array.from(map.values()).map((v) => v.votes)),
      ),
    )
  }

  const getVotes = async (account: SS58String) => {
    const tracks = await getTracks(account)
    return tracks.filter((t) => Array.isArray(t)).flat()
  }
  const getTrackVotes = async (account: SS58String, track: number) => {
    const trackValue = await getTrack(account, track)
    return Array.isArray(trackValue) ? trackValue : []
  }

  const getDelegations = async (account: SS58String) => {
    const tracks = await getTracks(account)
    return tracks.filter((t): t is AccountDelegation => Array.isArray(t))
  }
  const getDelegation = async (account: SS58String, track: number) => {
    const trackValue = await getTrack(account, track)
    return Array.isArray(trackValue) ? null : trackValue
  }

  function getDelegationPower(account: SS58String): Promise<DelegationPower[]>
  function getDelegationPower(
    account: SS58String,
    track: number,
  ): Promise<DelegationPower>
  async function getDelegationPower(account: SS58String, track?: number) {
    if (track == null) {
      const { getTrackById$, trackKeyChanges$ } = tracks$(account)
      return firstValueFrom(
        combineKeys(trackKeyChanges$, getTrackById$).pipe(
          map((map) => Array.from(map.values()).map((v) => v.delegationPower)),
        ),
      )
    }

    return (await firstValueFrom(track$(account, track))).delegationPower
  }

  return {
    getTracks,
    getTrack,
    getVotes,
    getTrackVotes,
    getDelegations,
    getDelegation,
    getDelegationPower,
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

const convictions: VotingConviction["type"][] = [
  "None",
  "Locked1x",
  "Locked2x",
  "Locked3x",
  "Locked4x",
  "Locked5x",
  "Locked6x",
]
