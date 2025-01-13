import { getPreimageResolver } from "@/preimages"
import { memo } from "@/util/memo"
import { BountiesSdkTypedApi, MultiAddress } from "./descriptors"
import { findCalls } from "./find-referenda"

export const scheduledFinder = (typedApi: BountiesSdkTypedApi) => {
  const resolvePreimage = getPreimageResolver(
    typedApi.query.Preimage.PreimageFor.getValues,
  )

  const getScheduledCalls = memo(async () => {
    const agenda = await typedApi.query.Scheduler.Agenda.getEntries()
    const token = await typedApi.compatibilityToken

    const scheduled = agenda.flatMap(
      ({ keyArgs: [height], value: values }) =>
        values
          ?.filter((v) => !!v)
          .map((value) => ({
            height,
            call: value.call,
          })) ?? [],
    )

    const resolvedCalls = await Promise.all(
      scheduled.map(({ height, call }) =>
        resolvePreimage(call)
          .then(
            (callData) => typedApi.txFromCallData(callData, token).decodedCall,
          )
          .then((decodedCall) => ({ height, call: decodedCall }))
          .catch((ex) => {
            console.error(ex)
            return null
          }),
      ),
    )
    return resolvedCalls.filter((v) => !!v)
  })
  async function findScheduledApproved(bountyId: number) {
    const calls = await getScheduledCalls()

    return calls
      .filter(({ call }) =>
        findCalls({ pallet: "Bounties", name: "approve_bounty" }, call).some(
          (v) => v?.bounty_id === bountyId,
        ),
      )
      .map(({ height }) => height)
  }

  async function findScheduledCuratorProposed(bountyId: number) {
    const calls = await getScheduledCalls()

    return calls
      .map(({ call, height }) => {
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
        return { height, proposeCuratorCalls }
      })
      .filter((v) => v !== null)
  }

  return { findScheduledApproved, findScheduledCuratorProposed }
}
