import { SS58String } from "polkadot-api"
import { StakingSdkTypedApi } from "./descriptors"
import { StakingSdk } from "./sdk-types"

const assertEra = (activeEra: number, depth: number, era: number) => {
  if (era <= activeEra - depth || era > activeEra) {
    throw new Error("Era info is not found on chain")
  }
}

const PERBILL = 1000000000n

const createEraCache = <T>(
  getFn: (era: number) => Promise<T>,
  getActiveEra: () => Promise<number>,
) => {
  const cache: Record<number, Promise<T>> = {}

  const getEraValue = (era: number) => {
    if (era in cache) return cache[era]

    const result = getFn(era)

    // It's safe for others to use this cache temporarily
    cache[era] = result

    // Remove from cache if it's actually above the active era
    getActiveEra().then((activeEra) => {
      if (activeEra <= era) {
        delete cache[era]
      }
    })

    return result
  }

  return [getEraValue, cache] as const
}

export function createStakingSdk(
  api: StakingSdkTypedApi,
  _settings: { maxActiveNominators: number },
): StakingSdk {
  const getActiveEra = () =>
    api.query.Staking.ActiveEra.getValue().then((val) => val!.index)

  // Values from ErasStakersPaged can't change after it has become the active era.
  // Papi caches per-block, but as we know this can't change and it's an expensive request, we set up the cache in here.
  const [getEraStakers, erasStakersCache] = createEraCache(async (era) => {
    const entries = await api.query.Staking.ErasStakersPaged.getEntries(era)

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
  }, getActiveEra)

  const getEraStaker = async (era: number, staker: SS58String) => {
    if (era in erasStakersCache) {
      const eraStakers = await erasStakersCache[era]
      return eraStakers[staker] ?? null
    }

    const result = await api.query.Staking.ErasStakersPaged.getEntries(
      era,
      staker,
    )

    return result
      ? {
          total: result
            .map(({ value }) => value.page_total)
            .reduce((a, b) => a + b, 0n),
          others: Object.fromEntries(
            result.flatMap(({ value }) =>
              value.others.map((v) => [v.who, v.value]),
            ),
          ),
        }
      : null
  }

  const [getEraValidatorPrefs, eraValidatorPrefsCache] = createEraCache(
    async (era) => {
      const result = await api.query.Staking.ErasValidatorPrefs.getEntries(era)

      return Object.fromEntries(
        result.map(({ keyArgs: [, validator], value }) => [validator, value]),
      )
    },
    getActiveEra,
  )
  const getEraValidatorPref = async (era: number, validator: SS58String) => {
    if (era in eraValidatorPrefsCache) {
      return (
        (await eraValidatorPrefsCache[era])[validator] ?? {
          commission: 0,
          blocked: false,
        }
      )
    }

    return api.query.Staking.ErasValidatorPrefs.getValue(era, validator)
  }

  const [getEraRewardPoints] = createEraCache(async (era: number) => {
    const result = await api.query.Staking.ErasRewardPoints.getValue(era)

    return {
      total: result.total,
      individual: Object.fromEntries(result.individual),
    }
  }, getActiveEra)

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

    const [tokenReward, rewardPoints, eraStakers, erasValidatorPrefs] =
      await Promise.all([
        api.query.Staking.ErasValidatorReward.getValue(era).then(
          (r) => r ?? 0n,
        ),
        getEraRewardPoints(era),
        getEraStakers(era),
        getEraValidatorPrefs(era),
      ])

    const entries = Object.entries(eraStakers)
      .filter(([, stakers]) => stakers.others[addr])
      .map(([validator, stakers]) => {
        const bond = stakers.others[addr]

        const validatorPoints = rewardPoints.individual[validator] ?? null
        const validatorPrefs = erasValidatorPrefs[validator] ?? null
        if (validatorPoints == null || !validatorPrefs) {
          console.error("Validator doesn't have points or prefs", {
            rewardPoints,
            validatorPrefs,
            validator,
          })
          return [validator, { bond, commission: 0n, reward: 0n }] as const
        }

        const validatorShare =
          (tokenReward * BigInt(validatorPoints)) / BigInt(rewardPoints.total)
        const commissionShare =
          (validatorShare * BigInt(validatorPrefs.commission)) / PERBILL
        const nominatorsShare = validatorShare - commissionShare

        const reward = (nominatorsShare * bond) / stakers.total
        const commission = (commissionShare * bond) / stakers.total

        return [
          validator,
          {
            bond,
            commission,
            reward,
          },
        ] as const
      })

    const total = entries
      .map(([, { reward }]) => reward)
      .reduce((a, b) => a + b, 0n)
    const totalCommission = entries
      .map(([, { commission }]) => commission)
      .reduce((a, b) => a + b, 0n)
    const activeBond = entries
      .map(([, { bond }]) => bond)
      .reduce((a, b) => a + b, 0n)

    return {
      total,
      totalCommission,
      activeBond,
      byValidator: Object.fromEntries(entries),
    }
  }

  const createValidatorRewards = (
    address: SS58String,
    tokenReward: bigint,
    rewardPoints: {
      total: number
      individual: {
        [k: string]: number
      }
    },
    eraStaker: {
      total: bigint
      others: Record<SS58String, bigint>
    },
    validatorPrefs: {
      commission: number
      blocked: boolean
    },
  ) => {
    const validatorPoints = rewardPoints.individual[address] ?? null
    if (validatorPoints == null) {
      return null
    }

    const activeBond = eraStaker.total
    const reward =
      (tokenReward * BigInt(validatorPoints)) / BigInt(rewardPoints.total)
    const commissionShare =
      (reward * BigInt(validatorPrefs.commission)) / PERBILL
    const nominatorsShare = reward - commissionShare

    const byNominatorEntries = Object.entries(eraStaker.others).map(
      ([addr, bond]) =>
        [
          addr,
          {
            bond,
            reward: (nominatorsShare * bond) / activeBond,
            commission: (commissionShare * bond) / activeBond,
          },
        ] as const,
    )

    return {
      address,
      blocked: validatorPrefs.blocked,
      commission: validatorPrefs.commission,
      points: validatorPoints,
      activeBond,
      byNominator: Object.fromEntries(byNominatorEntries),
      reward,
      commissionShare,
      nominatorsShare,
    }
  }

  const getValidatorRewards: StakingSdk["getValidatorRewards"] = async (
    validator,
    era,
  ) => {
    era = await eraOrActive(era)

    const [tokenReward, rewardPoints, eraStaker, validatorPrefs] =
      await Promise.all([
        api.query.Staking.ErasValidatorReward.getValue(era).then(
          (r) => r ?? 0n,
        ),
        getEraRewardPoints(era),
        getEraStaker(era, validator),
        getEraValidatorPref(era, validator),
      ])

    return (
      eraStaker &&
      createValidatorRewards(
        validator,
        tokenReward,
        rewardPoints,
        eraStaker,
        validatorPrefs,
      )
    )
  }

  const getEraValidators: StakingSdk["getEraValidators"] = async (era) => {
    era = await eraOrActive(era)

    const [totalRewards, rewardPoints, eraStakers, validatorPrefs] =
      await Promise.all([
        api.query.Staking.ErasValidatorReward.getValue(era).then(
          (r) => r ?? 0n,
        ),
        getEraRewardPoints(era),
        getEraStakers(era),
        getEraValidatorPrefs(era),
      ])

    let totalBond = 0n
    const validators = Object.entries(eraStakers)
      .map(([address, eraStaker]) => {
        const prefs = validatorPrefs[address]
        if (!prefs) {
          console.error(
            "No prefs for validator",
            address,
            validators,
            validatorPrefs,
          )
          return null
        }

        const validator = createValidatorRewards(
          address,
          totalRewards,
          rewardPoints,
          eraStaker,
          prefs,
        )
        totalBond += validator?.activeBond ?? 0n
        return validator
      })
      .filter((v) => v != null)

    return {
      validators,
      totalBond,
      totalPoints: rewardPoints.total,
      totalRewards,
    }
  }

  return {
    getNominatorStatus,
    canNominate,
    getNominatorRewards,
    getValidatorRewards,
    getEraValidators,
  }
}
