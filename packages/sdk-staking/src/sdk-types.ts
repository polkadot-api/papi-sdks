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

export interface AccountStatus {
  balance: {
    raw: {
      free: bigint
      reserved: bigint
      frozen: bigint
      existentialDeposit: bigint
    }
    // Total tokens in the account
    total: bigint
    // Portion of `total` balance that is somehow locked (overlap reserved, frozen and existential deposit)
    locked: bigint
    // Portion of `free` balance that can't be transferred.
    untouchable: bigint
    // Portion of `free` balance that can be transferred.
    spendable: bigint
  }
  nomination: {
    canNominate: boolean
    minNominationBond: bigint
    lastMinRewardingBond: bigint
    controller: SS58String | null
    currentBond: bigint
    maxBond: bigint
    nominating: {
      validators: SS58String[]
    } | null
    // unlocks: Array<{}>
  }
  nominationPool: {
    currentBond: bigint
    pendingRewards: bigint
    pool: number | null
    // unlocks: Array<{}>
  }
}

export interface StakingSdk {
  /**
   * Get validator rewards for a specific era.
   *
   * @param address Validator address to check.
   * @param era Optional era, defaults to ActiveEra.
   */
  getValidatorRewards: (
    address: SS58String,
    era?: number,
  ) => Promise<ValidatorRewards | null>

  /**
   * Gets the active validators info for a specific era
   *
   * @param era Optional era, defaults to ActiveEra.
   */
  getEraValidators: (era?: number) => Promise<{
    totalRewards: bigint
    totalPoints: number
    totalBond: bigint
    validators: ValidatorRewards[]
  }>

  getAccountStatus: (address: SS58String) => Promise<AccountStatus>

  /**
   * Get nominator status for specific era.
   *
   * Expensive operation: will fetch (and cache) every nominator
   *
   * @param address Nominator address to check.
   * @param era Optional era, defaults to ActiveEra.
   */
  getNominatorActiveValidators: (
    address: SS58String,
    era?: number,
  ) => Promise<Array<{ validator: SS58String; activeBond: bigint }>>

  /**
   * Get nominator rewards for specific era.
   *
   * Expensive operation: will fetch (and cache) every nominator
   *
   * @param address Nominator address to check.
   * @param era Optional era, defaults to ActiveEra.
   */
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
}
