import { SS58String } from "polkadot-api"
import { StakingApi } from "./staking-api"
import { PERBILL } from "./types"

export const getNominatorRewardsFn =
  ({
    getValidatorReward,
    getEraRewardPoints,
    getEraStakers,
    getEraOverview,
    getEraValidatorPrefs,
  }: StakingApi) =>
  async (addr: SS58String, era: number) => {
    const [
      tokenReward,
      rewardPoints,
      eraStakers,
      eraOverview,
      erasValidatorPrefs,
    ] = await Promise.all([
      getValidatorReward(era),
      getEraRewardPoints(era),
      getEraStakers(era),
      getEraOverview(era),
      getEraValidatorPrefs(era),
    ])

    const entries = Object.entries(eraStakers)
      .filter(([, stakers]) => stakers[addr])
      .map(([validator, stakers]) => {
        const bond = stakers[addr]

        const validatorPoints = rewardPoints.individual[validator] ?? null
        const validatorPrefs = erasValidatorPrefs[validator] ?? null
        const validatorOverview = eraOverview[validator] ?? null
        if (validatorPoints == null || !validatorPrefs || !validatorOverview) {
          console.error("Validator doesn't have points or prefs", {
            rewardPoints,
            validatorPrefs,
            validator,
            validatorOverview,
          })
          return [validator, { bond, commission: 0n, reward: 0n }] as const
        }

        const validatorShare =
          (tokenReward * BigInt(validatorPoints)) / BigInt(rewardPoints.total)
        const commissionShare =
          (validatorShare * BigInt(validatorPrefs.commission)) / PERBILL
        const nominatorsShare = validatorShare - commissionShare

        const reward = (nominatorsShare * bond) / validatorOverview.total
        const commission = (commissionShare * bond) / validatorOverview.total

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
