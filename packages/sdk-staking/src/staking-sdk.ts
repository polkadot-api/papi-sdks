import { SS58String } from "polkadot-api"
import { StakingSdkTypedApi } from "./descriptors"
import { StakingSdk } from "./sdk-types"

const assertEra = (activeEra: number, depth: number, era: number) => {
  if (era <= activeEra - depth || era > activeEra) {
    throw new Error("Era info is not found on chain")
  }
}

const PERBILL = 1000000000n

export function createStakingSdk(
  api: StakingSdkTypedApi,
  _settings: { maxActiveNominators: number },
): StakingSdk {
  // Values from ErasStakersPaged can't change after it has become the active era.
  // Papi caches per-block, but as we know this can't change and it's an expensive request, we set up the cache in here.
  const getActiveEra = () =>
    api.query.Staking.ActiveEra.getValue().then((val) => val!.index)
  const erasStakersCache: Record<
    number,
    Promise<
      Record<
        SS58String,
        {
          total: bigint
          others: Record<SS58String, bigint>
        }
      >
    >
  > = {}
  const getEraStakers = (era: number) => {
    if (era in erasStakersCache) return erasStakersCache[era]

    const result = api.query.Staking.ErasStakersPaged.getEntries(era).then(
      (entries) => {
        const result: Record<
          SS58String,
          {
            total: bigint
            others: Record<SS58String, bigint>
          }
        > = {}

        entries.forEach(({ keyArgs: [_, addr], value }) => {
          result[addr] ??= {
            total: 0n,
            others: {},
          }
          result[addr].total += value.page_total
          result[addr].others = {
            ...result[addr].others,
            ...Object.fromEntries(
              value.others.map(({ who, value }) => [who, value]),
            ),
          }
        })

        return result
      },
    )

    // It's safe for others to use this cache temporarily
    erasStakersCache[era] = result

    // Remove from cache if it's actually above the active era
    getActiveEra().then((activeEra) => {
      if (activeEra < era) {
        delete erasStakersCache[era]
      }
    })

    return result
  }

  const eraOrActive = async (era?: number) => {
    const selectedEra = era ? Promise.resolve(era) : getActiveEra()

    const [activeEra, depth] = await Promise.all([
      getActiveEra(),
      api.constants.Staking.HistoryDepth(),
    ])
    era = await selectedEra
    assertEra(activeEra, depth, era)

    return era
  }

  const getNominatorStatus: StakingSdk["getNominatorStatus"] = async (
    addr,
    era,
  ) => {
    era = await eraOrActive(era)

    return Object.entries(await getEraStakers(era))
      .filter(([, { others }]) => addr in others)
      .map(([validator, { others }]) => ({
        validator,
        activeBond: others[addr],
      }))
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

  const getNominatorRewards: StakingSdk["getNominatorRewards"] = async (
    addr,
    era,
  ) => {
    era = await eraOrActive(era)

    const eraStakersPromise = getEraStakers(era)
    const erasValidatorPrefsPromise =
      api.query.Staking.ErasValidatorPrefs.getEntries(era)
    const [tokenReward, rewardPoints] = await Promise.all([
      api.query.Staking.ErasValidatorReward.getValue(era).then((r) => r ?? 0n),
      api.query.Staking.ErasRewardPoints.getValue(era),
    ])
    const [eraStakers, erasValidatorPrefs] = await Promise.all([
      eraStakersPromise,
      erasValidatorPrefsPromise,
    ])

    const entries = Object.entries(eraStakers)
      .filter(([, stakers]) => stakers.others[addr])
      .map(([validator, stakers]) => {
        const bond = stakers.others[addr]

        const validatorPoints = rewardPoints.individual.find(
          ([addr]) => validator === addr,
        )
        const validatorPrefs = erasValidatorPrefs.find(
          ({ keyArgs: [, addr] }) => validator === addr,
        )
        if (!validatorPoints || !validatorPrefs) {
          console.error("Validator doesn't have points or prefs", {
            rewardPoints,
            validatorPrefs,
            validator,
          })
          return [validator, { bond, reward: 0n }] as const
        }

        const validatorShare =
          (tokenReward * BigInt(validatorPoints[1])) /
          BigInt(rewardPoints.total)
        const nominatorsShare =
          (validatorShare *
            (PERBILL - BigInt(validatorPrefs.value.commission))) /
          PERBILL

        const reward = (nominatorsShare * bond) / stakers.total

        return [
          validator,
          {
            bond,
            reward,
          },
        ] as const
      })

    const total = entries
      .map(([, { reward }]) => reward)
      .reduce((a, b) => a + b, 0n)
    const activeBond = entries
      .map(([, { bond }]) => bond)
      .reduce((a, b) => a + b, 0n)

    return {
      total,
      activeBond,
      byValidator: Object.fromEntries(entries),
    }
  }

  return {
    getNominatorStatus,
    canNominate,
    getNominatorRewards,
  }
}
