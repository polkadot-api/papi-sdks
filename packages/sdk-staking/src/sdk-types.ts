import { AsyncTransaction } from "@polkadot-api/common-sdk-utils"
import { SS58String } from "polkadot-api"
import { Observable } from "rxjs"
import {
  NominationPoolsCommissionClaimPermission,
  NominationPoolsPoolState,
  StakingRewardDestination,
} from "../.papi/descriptors/dist"

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
    totalLocked: bigint
    maxBond: bigint
    nominating: {
      validators: SS58String[]
    } | null
    unlocks: Array<{
      value: bigint
      era: number
    }>
    payee: StakingRewardDestination | null
  }
  nominationPool: {
    currentBond: bigint
    points: bigint
    pendingRewards: bigint
    pool: number | null
    unlocks: Array<{
      value: bigint
      era: number
    }>
  }
}

export interface NominationPool {
  id: number
  name: string
  addresses: {
    pool: SS58String
    depositor: SS58String
    commission?: SS58String
    root?: SS58String
    nominator?: SS58String
    bouncer?: SS58String
  }
  commission: {
    current: number
    max?: number
    change_rate?: {
      max_increase: number
      min_delay: number
    }
    throttleFrom?: number
    claimPermission?: NominationPoolsCommissionClaimPermission
  }
  memberCount: number
  bond: bigint
  points: bigint
  state: NominationPoolsPoolState["type"]
  nominations: SS58String[]
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

  /**
   * Gets the list of nominators that were active for a specific era
   *
   * @param era Optional era, defaults to ActiveEra.
   */
  getActiveNominators: (era?: number) => Promise<Array<SS58String>>

  getAccountStatus$: (address: SS58String) => Observable<AccountStatus>

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

  /**
   * Unbonds `amount` tokens from the nomination pool of `member`.
   *
   * Will throw an error if the member is not in a nomination pool, or if it doesn't have a large enough bond.
   */
  unbondNominationPool: (member: SS58String, amount: bigint) => AsyncTransaction
  getNominationPools: () => Promise<NominationPool[]>
  getNominationPool$: (id: number) => Observable<NominationPool | null>

  upsertNomination: (
    nominator: SS58String,
    config: Partial<{
      bond: bigint
      validators: SS58String[]
      payee: StakingRewardDestination
    }>,
  ) => AsyncTransaction
  stopNomination: (nominator: SS58String) => AsyncTransaction
}
