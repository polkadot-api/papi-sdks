import { PolkadotClient } from "polkadot-api"
import { dot } from "../.papi/descriptors/dist"
import { getAccountStatus } from "./accountStatus"
import { getNominatorRewardsFn } from "./nominatorRewards"
import { StakingSdk } from "./sdk-types"
import { createStakingApi } from "./staking-api"
import { getEraValidatorsFn, getValidatorRewardsFn } from "./validatorRewards"

export function createStakingSdk(client: PolkadotClient): StakingSdk {
  const api = client.getTypedApi(dot)
  const stakingApi = createStakingApi(client)

  const eraOrActive = async (era?: number) => {
    const [activeEra, depth] = await Promise.all([
      stakingApi.getActiveEra(),
      api.constants.Staking.HistoryDepth(),
    ])

    era = era ?? activeEra
    if (era <= activeEra - depth || era > activeEra) {
      throw new Error("Era info is not found on chain")
    }

    return era
  }

  const getNominatorActiveValidators: StakingSdk["getNominatorActiveValidators"] =
    async (addr, era) => {
      era = await eraOrActive(era)

      return Object.entries(await stakingApi.getEraStakers(era))
        .filter(([, others]) => addr in others)
        .map(([validator, others]) => ({
          validator,
          activeBond: others[addr],
        }))
    }

  const getNominatorRewards = getNominatorRewardsFn(stakingApi)
  const getValidatorRewards = getValidatorRewardsFn(stakingApi)
  const getEraValidators = getEraValidatorsFn(stakingApi)

  return {
    getNominatorActiveValidators,
    getNominatorRewards: async (addr, era) => {
      era = await eraOrActive(era)
      return getNominatorRewards(addr, era)
    },
    getAccountStatus: getAccountStatus(api),
    getValidatorRewards: async (addr, era) => {
      era = await eraOrActive(era)
      return getValidatorRewards(addr, era)
    },
    getEraValidators: async (era) => {
      era = await eraOrActive(era)
      return getEraValidators(era)
    },
  }
}
