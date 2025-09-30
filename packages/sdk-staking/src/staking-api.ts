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
  const [getEraStakers] = createEraCache<EraStakers>(async (era) => {
    const entries = await api.query.Staking.ErasStakersPaged.getEntries(era)

    const result: Record<SS58String, Record<SS58String, bigint>> = {}

    entries.forEach(({ keyArgs: [_, addr], value }) => {
      result[addr] ??= {}
      result[addr] = {
        ...result[addr],
        ...Object.fromEntries(
          value.others.map(({ who, value }) => [who, value]),
        ),
      }
    })

    return result
  }, getActiveEra)

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
    getEraOverview,
    getEraStakerOverview,
    getEraValidatorPrefs,
    getEraValidatorPref,
    getEraRewardPoints,
    getValidatorReward,
  }
}

export type StakingApi = ReturnType<typeof createStakingApi>
