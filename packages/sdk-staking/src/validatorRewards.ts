import { SS58String } from "polkadot-api"
import { ValidatorRewards } from "./sdk-types"
import { StakingApi } from "./staking-api"
import { PERBILL } from "./types"

const createValidatorRewards = (
  address: SS58String,
  tokenReward: bigint,
  rewardPoints: {
    total: number
    individual: {
      [k: string]: number
    }
  },
  overview: {
    total: bigint
    own: bigint
    nominator_count: number
  },
  validatorPrefs: {
    commission: number
    blocked: boolean
  },
): ValidatorRewards | null => {
  const validatorPoints = rewardPoints.individual[address] ?? null
  if (validatorPoints == null) {
    return null
  }

  const activeBond = overview.total
  const reward =
    (tokenReward * BigInt(validatorPoints)) / BigInt(rewardPoints.total)
  const commissionShare = (reward * BigInt(validatorPrefs.commission)) / PERBILL
  const nominatorsShare = reward - commissionShare

  return {
    address,
    blocked: validatorPrefs.blocked,
    commission: validatorPrefs.commission / Number(PERBILL),
    points: validatorPoints,
    activeBond,
    reward,
    commissionShare,
    nominatorsShare,
    selfStake: overview.own,
    nominatorCount: overview.nominator_count,
  }
}

export const getValidatorRewardsFn =
  ({
    getValidatorReward,
    getEraRewardPoints,
    getEraStakerOverview,
    getEraValidatorPref,
  }: StakingApi) =>
  async (validator: SS58String, era: number) => {
    const [tokenReward, rewardPoints, eraOverview, validatorPrefs] =
      await Promise.all([
        getValidatorReward(era),
        getEraRewardPoints(era),
        getEraStakerOverview(era, validator),
        getEraValidatorPref(era, validator),
      ])

    return (
      eraOverview &&
      createValidatorRewards(
        validator,
        tokenReward,
        rewardPoints,
        eraOverview,
        validatorPrefs,
      )
    )
  }

export const getEraValidatorsFn =
  ({
    getValidatorReward,
    getEraRewardPoints,
    getEraOverview,
    getEraValidatorPrefs,
  }: StakingApi) =>
  async (era: number) => {
    const [totalRewards, rewardPoints, eraOverview, validatorPrefs] =
      await Promise.all([
        getValidatorReward(era),
        getEraRewardPoints(era),
        getEraOverview(era),
        getEraValidatorPrefs(era),
      ])

    let totalBond = 0n
    const validators = Object.entries(eraOverview)
      .map(([address, overview]) => {
        if (!overview) return null

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
          overview,
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
