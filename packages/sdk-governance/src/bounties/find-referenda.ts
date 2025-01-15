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

const getDecodedSpenderReferenda = keyedMemo(
  async (ongoingReferenda: OngoingReferendum[]) => {
    const spenderReferenda = ongoingReferenda.filter(
      (ref) =>
        (ref.origin.type === "Origins" &&
          spenderOrigins.includes(ref.origin.value.type)) ||
        (ref.origin.type === "system" && ref.origin.value.type === "Root"),
    )
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
  },
  new WeakMap(),
)

export async function findApprovingReferenda(
  ongoingReferenda: OngoingReferendum[],
  bountyId: number,
) {
  const spenderReferenda = await getDecodedSpenderReferenda(ongoingReferenda)

  return spenderReferenda
    .filter(({ call }) =>
      findCalls(
        {
          pallet: "Bounties",
          name: "approve_bounty",
        },
        call,
      ).some((v) => v?.bounty_id === bountyId),
    )
    .map(({ referendum }) => referendum)
}

export async function findProposingCuratorReferenda(
  ongoingReferenda: OngoingReferendum[],
  bountyId: number,
) {
  const spenderReferenda = await getDecodedSpenderReferenda(ongoingReferenda)

  return spenderReferenda
    .map(({ call, referendum }) => {
      const proposeCuratorCalls = findCalls(
        {
          pallet: "Bounties",
          name: "propose_curator",
        },
        call,
      )
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
