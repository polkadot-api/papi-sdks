import { SdkDefinition } from "@polkadot-api/common-sdk-utils"
import {
  ApisTypedef,
  PalletsTypedef,
  PlainDescriptor,
  SS58String,
  StorageDescriptor,
  TypedApi,
} from "polkadot-api"

type StakingSdkPallets = PalletsTypedef<
  {
    System: {
      /**
       * The full account information for a particular account ID.
       */
      Account: StorageDescriptor<
        [Key: SS58String],
        {
          data: {
            free: bigint
            reserved: bigint
            frozen: bigint
          }
        },
        false,
        never
      >
    }
    Staking: {
      /**
       * Map from all (unlocked) "controller" accounts to the info regarding the staking.
       *
       * Note: All the reads and mutations to this storage *MUST* be done through the methods exposed
       * by [`StakingLedger`] to ensure data and lock consistency.
       */
      Ledger: StorageDescriptor<
        [Key: SS58String],
        {
          stash: SS58String
          total: bigint
          active: bigint
          unlocking: Array<{
            value: bigint
            era: number
          }>
          legacy_claimed_rewards: Array<number>
        },
        true,
        never
      >
      /**
       * The minimum active bond to become and maintain the role of a nominator.
       */
      MinNominatorBond: StorageDescriptor<[], bigint, false, never>
      /**
       * Map from all locked "stash" accounts to the controller account.
       *
       * TWOX-NOTE: SAFE since `AccountId` is a secure hash.
       */
      Bonded: StorageDescriptor<[Key: SS58String], SS58String, true, never>
      /**
       * The active era information, it holds index and start.
       *
       * The active era is the era being currently rewarded. Validator set of this era must be
       * equal to [`SessionInterface::validators`].
       */
      ActiveEra: StorageDescriptor<
        [],
        {
          index: number
          start?: bigint | undefined
        },
        true,
        never
      >
      /**
       * Summary of validator exposure at a given era.
       *
       * This contains the total stake in support of the validator and their own stake. In addition,
       * it can also be used to get the number of nominators backing this validator and the number of
       * exposure pages they are divided into. The page count is useful to determine the number of
       * pages of rewards that needs to be claimed.
       *
       * This is keyed first by the era index to allow bulk deletion and then the stash account.
       * Should only be accessed through `EraInfo`.
       *
       * Is it removed after [`Config::HistoryDepth`] eras.
       * If stakers hasn't been set or has been removed then empty overview is returned.
       */
      ErasStakersOverview: StorageDescriptor<
        [number, SS58String],
        {
          total: bigint
          own: bigint
          nominator_count: number
          page_count: number
        },
        true,
        never
      >
      /**
       * Similar to `ErasStakers`, this holds the preferences of validators.
       *
       * This is keyed first by the era index to allow bulk deletion and then the stash account.
       *
       * Is it removed after [`Config::HistoryDepth`] eras.
       */
      ErasValidatorPrefs: StorageDescriptor<
        [number, SS58String],
        {
          commission: number
          blocked: boolean
        },
        false,
        never
      >
      /**
       * The total validator era payout for the last [`Config::HistoryDepth`] eras.
       *
       * Eras that haven't finished yet or has been removed doesn't have reward.
       */
      ErasValidatorReward: StorageDescriptor<[Key: number], bigint, true, never>
      /**
       * Rewards for the last [`Config::HistoryDepth`] eras.
       * If reward hasn't been set or has been removed then 0 reward is returned.
       */
      ErasRewardPoints: StorageDescriptor<
        [Key: number],
        {
          total: number
          individual: Array<[SS58String, number]>
        },
        false,
        never
      >
      /**
       * Paginated exposure of a validator at given era.
       *
       * This is keyed first by the era index to allow bulk deletion, then stash account and finally
       * the page. Should only be accessed through `EraInfo`.
       *
       * This is cleared after [`Config::HistoryDepth`] eras.
       */
      ErasStakersPaged: StorageDescriptor<
        [number, SS58String, number],
        {
          page_total: bigint
          others: Array<{
            who: SS58String
            value: bigint
          }>
        },
        true,
        never
      >
    }
  },
  {},
  {},
  {},
  {
    Balances: {
      /**
       * The minimum amount required to keep an account open. MUST BE GREATER THAN ZERO!
       *
       * If you *really* need it to be zero, you can enable the feature `insecure_zero_ed` for
       * this pallet. However, you do so at your own risk: this will open up a major DoS vector.
       * In case you have multiple sources of provider references, you may also get unexpected
       * behaviour if you set this to zero.
       *
       * Bottom line: Do yourself a favour and make it at least one!
       */
      ExistentialDeposit: PlainDescriptor<bigint>
    }
    Staking: {
      /**
       * Number of eras to keep in history.
       *
       * Following information is kept for eras in `[current_era -
       * HistoryDepth, current_era]`: `ErasStakers`, `ErasStakersClipped`,
       * `ErasValidatorPrefs`, `ErasValidatorReward`, `ErasRewardPoints`,
       * `ErasTotalStake`, `ErasStartSessionIndex`, `ClaimedRewards`, `ErasStakersPaged`,
       * `ErasStakersOverview`.
       *
       * Must be more than the number of eras delayed by session.
       * I.e. active era must always be in history. I.e. `active_era >
       * current_era - history_depth` must be guaranteed.
       *
       * If migrating an existing pallet from storage value to config value,
       * this should be set to same value or greater as in storage.
       *
       * Note: `HistoryDepth` is used as the upper bound for the `BoundedVec`
       * item `StakingLedger.legacy_claimed_rewards`. Setting this value lower than
       * the existing value can lead to inconsistencies in the
       * `StakingLedger` and will need to be handled properly in a migration.
       * The test `reducing_history_depth_abrupt` shows this effect.
       */
      HistoryDepth: PlainDescriptor<number>
    }
  },
  {}
>

type StakingSdkApis = ApisTypedef<{}>

type StakingSdkDefinition = SdkDefinition<StakingSdkPallets, StakingSdkApis>
export type StakingSdkTypedApi = TypedApi<StakingSdkDefinition>
