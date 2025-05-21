import {
  PolkadotRuntimeOriginCaller,
  PolkadotRuntimeOriginCallerOriginal,
} from "@/referenda/descriptors"
import { OngoingReferendum } from "@/referenda/sdk-types"
import { keyedMemo } from "@/util/memo"
import { MultiAddress } from "./descriptors"

const spenderOrigins = [
  "Treasurer",
  "SmallSpender",
  "MediumSpender",
  "BigSpender",
  "SmallTipper",
  "BigTipper",
]

const uncachedGetDecodedSpenderReferenda = async <
  TOrigin extends PolkadotRuntimeOriginCaller,
>(
  ongoingReferenda: OngoingReferendum<{ origin: TOrigin }>[],
) => {
  const spenderReferenda = ongoingReferenda.filter((ref) => {
    const origin = ref.origin as PolkadotRuntimeOriginCallerOriginal
    return (
      (origin.type === "Origins" &&
        spenderOrigins.includes(origin.value.type)) ||
      (origin.type === "system" && origin.value.type === "Root")
    )
  })
  const response = await Promise.all(
    spenderReferenda.map((referendum) =>
      referendum.proposal
        .decodedCall()
        .then((call) => ({
          referendum,
          call,
        }))
        .catch((ex) => {
          console.error(ex)
          return null
        }),
    ),
  )
  return response.filter((v) => !!v)
}
const getDecodedSpenderReferenda: typeof uncachedGetDecodedSpenderReferenda =
  keyedMemo(uncachedGetDecodedSpenderReferenda, new WeakMap())

const filterApproveCuratorCalls = (calls: any[], bountyId: number) =>
  calls
    .filter(
      (v) =>
        v?.bounty_id === bountyId &&
        typeof v.curator === "object" &&
        typeof v.fee === "bigint",
    )
    .map((v) => ({
      curator: v.curator as MultiAddress,
      fee: v.fee as bigint,
    }))

export async function findApprovingReferenda<
  TOrigin extends PolkadotRuntimeOriginCaller,
>(
  ongoingReferenda: OngoingReferendum<{ origin: TOrigin }>[],
  bountyId: number,
) {
  const spenderReferenda = await getDecodedSpenderReferenda(ongoingReferenda)

  return spenderReferenda
    .map(({ call, referendum }) => {
      const approveWithCuratorCalls = filterApproveCuratorCalls(
        findCalls(
          {
            pallet: "Bounties",
            name: "approve_bounty_with_curator",
          },
          call,
        ),
        bountyId,
      )

      const approveCalls = findCalls(
        {
          pallet: "Bounties",
          name: "approve_bounty",
        },
        call,
      ).filter((v) => v?.bounty_id === bountyId)

      const approveThenProposeCalls = approveCalls.length
        ? filterApproveCuratorCalls(
            findCalls(
              {
                pallet: "Bounties",
                name: "propose_curator",
              },
              call,
            ),
            bountyId,
          )
        : []

      if (!(approveCalls.length + approveWithCuratorCalls.length)) return null
      return {
        referendum,
        proposeCuratorCalls: [
          ...approveWithCuratorCalls,
          ...approveThenProposeCalls,
        ],
      }
    })
    .filter((v) => v !== null)
}

export async function findProposingCuratorReferenda<
  TOrigin extends PolkadotRuntimeOriginCaller,
>(
  ongoingReferenda: OngoingReferendum<{ origin: TOrigin }>[],
  bountyId: number,
) {
  const spenderReferenda = await getDecodedSpenderReferenda(ongoingReferenda)

  return spenderReferenda
    .map(({ call, referendum }) => {
      const proposeCuratorCalls = filterApproveCuratorCalls(
        findCalls(
          {
            pallet: "Bounties",
            name: "propose_curator",
          },
          call,
        ),
        bountyId,
      )
      if (!proposeCuratorCalls.length) return null
      return { referendum, proposeCuratorCalls }
    })
    .filter((v) => v !== null)
}

export const findCalls = (
  call: { pallet: string; name: string },
  obj: any,
): any[] => {
  if (typeof obj !== "object") return []
  if (Array.isArray(obj)) {
    const approves = []
    for (const item of obj) approves.push(...findCalls(call, item))
    return approves
  }
  if (obj?.type === call.pallet && obj?.value?.type === call.name) {
    return [obj.value.value]
  }
  const approves = []
  for (const key of Object.keys(obj))
    approves.push(...findCalls(call, obj[key]))
  return approves
}
