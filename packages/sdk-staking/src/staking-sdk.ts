import { SS58String } from "polkadot-api"
import { StakingSdkTypedApi } from "./descriptors"
import { StakingSdk } from "./sdk-types"

const assertEra = (activeEra: number, depth: number, era: number) => {
  if (era <= activeEra - depth || era > activeEra) {
    throw new Error("Era info is not found on chain")
  }
}

export function createStakingSdk(
  api: StakingSdkTypedApi,
  _settings: { maxActiveNominators: number },
): StakingSdk {
  // Values from ErasStakersPaged can't change after it has become the active era.
  // Papi caches per-block, but as we know this can't change and it's an expensive request, we set up the cache in here.
  let activeEraPromise = api.query.Staking.ActiveEra.getValue().then(
    (val) => val!.index,
  )
  const erasStakersCache: Record<
    number,
    Promise<
      Array<{
        keyArgs: [number, SS58String, number]
        value: {
          page_total: bigint
          others: Array<{
            who: SS58String
            value: bigint
          }>
        }
      }>
    >
  > = {}
  const getEraStakers = (era: number) => {
    if (era in erasStakersCache) return erasStakersCache[era]

    const result = api.query.Staking.ErasStakersPaged.getEntries(era)

    // It's safe for others to use this cache temporarily
    erasStakersCache[era] = result

    // Remove from cache if it's actually above the active era
    activeEraPromise.then(async (activeEra) => {
      if (activeEra >= era) return

      // refresh just-in-case it has changed in a recent block
      activeEraPromise = api.query.Staking.ActiveEra.getValue().then(
        (val) => val!.index,
      )
      if ((await activeEraPromise) < era) {
        delete erasStakersCache[era]
      }
    })

    return result
  }

  const getNominatorStatus: StakingSdk["getNominatorStatus"] = async (
    addr,
    era,
  ) => {
    const selectedEra = era ? Promise.resolve(era) : activeEraPromise
    const eraEntries = selectedEra.then(getEraStakers)

    const [activeEra, depth] = await Promise.all([
      activeEraPromise,
      api.constants.Staking.HistoryDepth(),
    ])
    era = await selectedEra
    assertEra(activeEra, depth, era)

    const active = (await eraEntries).flatMap(
      ({ keyArgs: [, validator], value: { others } }) =>
        others
          .filter(({ who }) => who === addr)
          .map(({ value }) => ({ validator, activeBond: value })),
    )
    return { era, active }
  }

  // TODO: include VoterList check
  const canNominate: StakingSdk["canNominate"] = async (addr) => {
    const [{ data }, ledger, minBond, ed] = await Promise.all([
      api.query.System.Account.getValue(addr),
      api.query.Staking.Bonded.getValue(addr).then((controller) =>
        controller ? api.query.Staking.Ledger.getValue(controller) : undefined,
      ),
      api.query.Staking.MinNominatorBond.getValue(),
      api.constants.Balances.ExistentialDeposit(),
    ])
    const maxBond = data.free - (data.reserved < ed ? data.reserved - ed : 0n)

    const canNominate = maxBond >= minBond
    if (!canNominate) return { canNominate }
    return { canNominate, maxBond, currentBond: ledger?.total ?? 0n }
  }

  return {
    getNominatorStatus,
    canNominate,
  }
}
