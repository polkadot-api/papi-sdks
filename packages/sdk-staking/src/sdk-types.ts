import { SS58String } from "polkadot-api"

export interface StakingSdk {
  /**
   * Get nominator status for specific era.
   * @param address Nominator address to check.
   * @param era Optionally pass era, defaults to ActiveEra.
   */
  getNominatorStatus: (
    address: SS58String,
    era?: number,
  ) => Promise<Array<{ validator: SS58String; activeBond: bigint }>>

  getNominatorRewards: (
    address: SS58String,
    era?: number,
  ) => Promise<{
    total: bigint
    activeBond: bigint
    byValidator: Record<
      SS58String,
      {
        reward: bigint
        bond: bigint
      }
    >
  }>

  getValidatorRewards: (
    address: SS58String,
    era?: number,
  ) => Promise<{
    reward: bigint
    activeBond: bigint
    nominatorsShare: bigint
    byNominator: Record<
      SS58String,
      {
        reward: bigint
        bond: bigint
      }
    >
  } | null>

  canNominate: (address: SS58String) => Promise<
    | { canNominate: false }
    | {
        canNominate: true
        currentBond: bigint
        maxBond: bigint
      }
  >
}
