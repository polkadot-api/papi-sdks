import type { SdkDefinition } from "@polkadot-api/common-sdk-utils"
import type {
  ApisTypedef,
  Enum,
  FixedSizeBinary,
  PalletsTypedef,
  PlainDescriptor,
  SS58String,
  StorageDescriptor,
  TypedApi,
} from "polkadot-api"

type VestingSdkPallets = PalletsTypedef<
  {
    System: {
      /**
       * The current block number being processed. Set by `execute_block`.
       */
      Number: StorageDescriptor<[], number, false, never>
    }
    Balances: {
      /**
       * Any liquidity locks on some account balances.
       */
      Locks: StorageDescriptor<
        [Key: SS58String],
        Array<{
          id: FixedSizeBinary<8>
          amount: bigint
          reasons: Enum<{
            Fee: undefined
            Misc: undefined
            All: undefined
          }>
        }>,
        false,
        never
      >
    }
    Vesting: {
      /**
       * Information regarding the vesting of a given account.
       */
      Vesting: StorageDescriptor<
        [Key: SS58String],
        Array<{
          locked: bigint
          per_block: bigint
          starting_block: number
        }>,
        true,
        never
      >
    }
  },
  {},
  {},
  {},
  {
    Babe: {
      /**
       * The expected average block time at which BABE should be creating
       * blocks. Since BABE is probabilistic it is not trivial to figure out
       * what the expected average block time should be based on the slot
       * duration and the security parameter `c` (where `1 - c` represents
       * the probability of a slot being empty).
       */
      ExpectedBlockTime: PlainDescriptor<bigint>
    }
  },
  {}
>

type VestingSdkDefinition = SdkDefinition<VestingSdkPallets, ApisTypedef<{}>>
export type VestingSdkTypedApi = TypedApi<VestingSdkDefinition>
