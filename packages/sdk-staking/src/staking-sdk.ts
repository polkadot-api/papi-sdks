import { PolkadotClient } from "polkadot-api"
import { dot, MultiAddress } from "../.papi/descriptors/dist"
import { getAccountStatus } from "./accountStatus"
import { getNominatorRewardsFn } from "./nominatorRewards"
import { StakingSdk } from "./sdk-types"
import { createStakingApi } from "./staking-api"
import { getEraValidatorsFn, getValidatorRewardsFn } from "./validatorRewards"
import { wrapAsyncTx } from "@polkadot-api/common-sdk-utils"

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

  const unbondNominationPool: StakingSdk["unbondNominationPool"] = (
    address,
    unbond,
  ) =>
    wrapAsyncTx(async () => {
      const member =
        await api.query.NominationPools.PoolMembers.getValue(address)
      if (!member) {
        // Unsure what's expected. I could return a transaction that will be invalid, but I guess it's better to fail fast.
        throw new Error("Not a member of a pool")
      }

      const currentBond = await api.apis.NominationPoolsApi.points_to_balance(
        member.pool_id,
        member.points,
      )
      if (unbond > currentBond) {
        throw new Error(
          `Current bond is smaller than unbonding amount ${currentBond} < ${unbond}`,
        )
      }

      const resultingBond = currentBond - unbond
      const resultingPoints =
        await api.apis.NominationPoolsApi.balance_to_points(
          member.pool_id,
          resultingBond,
        )

      return api.tx.NominationPools.unbond({
        member_account: MultiAddress.Id(address),
        unbonding_points: member.points - resultingPoints,
      })
    })

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
    unbondNominationPool,
  }
}
