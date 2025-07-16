import { SS58String } from "polkadot-api"

export interface ValidatorRewards {
  address: SS58String
  // In [0-1]
  commission: number
  blocked: boolean
  points: number
  reward: bigint
  commissionShare: bigint
  nominatorsShare: bigint
  activeBond: bigint
  selfStake: bigint
  nominatorCount: number
}

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
    totalCommission: bigint
    activeBond: bigint
    byValidator: Record<
      SS58String,
      {
        reward: bigint
        bond: bigint
        // Amount the validator has taken as commission thanks to the nominator
        commission: bigint
      }
    >
  }>

  getValidatorRewards: (
    address: SS58String,
    era?: number,
  ) => Promise<ValidatorRewards | null>

  getEraValidators: (era?: number) => Promise<{
    totalRewards: bigint
    totalPoints: number
    totalBond: bigint
    validators: ValidatorRewards[]
  }>

  canNominate: (address: SS58String) => Promise<
    | { canNominate: false }
    | {
        canNominate: true
        currentBond: bigint
        maxBond: bigint
      }
  >
}
