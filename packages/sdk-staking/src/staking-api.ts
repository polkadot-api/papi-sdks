import { PolkadotClient, SS58String } from "polkadot-api"
import { dot } from "../.papi/descriptors/dist"
import { createEraCache, createKeyedEraCache } from "./eraCache"
import {
  EraOverview,
  EraRewardPoints,
  EraStakers,
  EraValidatorPrefs,
} from "./types"

export const createStakingApi = (client: PolkadotClient) => {
  const api = client.getTypedApi(dot)

  const getActiveEra = () =>
    api.query.Staking.ActiveEra.getValue().then((val) => val!.index)

  // Very expensive operation
  const [getEraStakersAndNominators] = createEraCache<{
    stakers: EraStakers
    nominators: Set<string>
  }>(async (era) => {
    const entries = await api.query.Staking.ErasStakersPaged.getEntries(era)

    const stakers: Record<SS58String, Record<SS58String, bigint>> = {}
    const nominators = new Set<SS58String>()

    entries.forEach(({ keyArgs: [_, addr], value }) => {
      stakers[addr] ??= {}
      stakers[addr] = {
        ...stakers[addr],
        ...Object.fromEntries(
          value.others.map(({ who, value }) => {
            nominators.add(who)
            return [who, value]
          }),
        ),
      }
    })

    return { stakers, nominators }
  }, getActiveEra)

  const getEraStakers = async (era: number) =>
    (await getEraStakersAndNominators(era)).stakers

  const getEraNominators = async (era: number) =>
    (await getEraStakersAndNominators(era)).nominators

  const [getEraOverview, getEraStakerOverview] =
    createKeyedEraCache<EraOverview>(
      async (era) => {
        const entries =
          await api.query.Staking.ErasStakersOverview.getEntries(era)

        const result = Object.fromEntries(
          entries.map(({ keyArgs: [_, addr], value }) => [addr, value]),
        )

        return result
      },
      (era, staker) =>
        api.query.Staking.ErasStakersOverview.getValue(era, staker).then(
          (r) => r ?? null,
        ),
      getActiveEra,
    )

  const [getEraValidatorPrefs, getEraValidatorPref] =
    createKeyedEraCache<EraValidatorPrefs>(
      async (era) => {
        const result =
          await api.query.Staking.ErasValidatorPrefs.getEntries(era)

        return Object.fromEntries(
          result.map(({ keyArgs: [, validator], value }) => [validator, value]),
        )
      },
      (era, validator) =>
        api.query.Staking.ErasValidatorPrefs.getValue(era, validator),
      getActiveEra,
    )

  const [getEraRewardPoints] = createEraCache<EraRewardPoints>(
    async (era: number) => {
      const result = await api.query.Staking.ErasRewardPoints.getValue(era)

      return {
        total: result.total,
        individual: Object.fromEntries(result.individual),
      }
    },
    getActiveEra,
  )

  const getValidatorReward = (era: number) =>
    api.query.Staking.ErasValidatorReward.getValue(era).then((r) => r ?? 0n)

  return {
    getActiveEra,
    getEraStakers,
    getEraNominators,
    getEraOverview,
    getEraStakerOverview,
    getEraValidatorPrefs,
    getEraValidatorPref,
    getEraRewardPoints,
    getValidatorReward,
  }
}

export type StakingApi = ReturnType<typeof createStakingApi>
