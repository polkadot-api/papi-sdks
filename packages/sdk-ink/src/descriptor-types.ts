import { SdkDefinition } from "@polkadot-api/common-sdk-utils"
import {
  InkCallableDescriptor,
  InkDescriptors,
  InkStorageDescriptor,
  Event,
} from "@polkadot-api/ink-contracts"
import type {
  ApisTypedef,
  Binary,
  Enum,
  FixedSizeBinary,
  PalletsTypedef,
  ResultPayload,
  RuntimeDescriptor,
  SS58String,
  StorageDescriptor,
  TxDescriptor,
  TypedApi,
} from "polkadot-api"

export type MultiAddress = Enum<{
  Id: SS58String
  Index: undefined
  Raw: Binary
  Address32: FixedSizeBinary<32>
  Address20: FixedSizeBinary<20>
}>

export type Gas = {
  ref_time: bigint
  proof_size: bigint
}

export type StorageError = Enum<{
  DoesntExist: undefined
  KeyDecodingFailed: undefined
  MigrationInProgress: undefined
}>
export type InkSdkApis<Ev = any, Err = any> = ApisTypedef<{
  ContractsApi: {
    call: RuntimeDescriptor<
      [
        origin: SS58String,
        dest: SS58String,
        value: bigint,
        gas_limit: Gas | undefined,
        storage_deposit_limit: bigint | undefined,
        input_data: Binary,
      ],
      {
        gas_consumed: Gas
        gas_required: Gas
        storage_deposit: Enum<{
          Refund: bigint
          Charge: bigint
        }>
        debug_message: Binary
        result: ResultPayload<
          {
            flags: number
            data: Binary
          },
          Err
        >
        events?: Array<Ev>
      }
    >
    instantiate: RuntimeDescriptor<
      [
        origin: SS58String,
        value: bigint,
        gas_limit: Gas | undefined,
        storage_deposit_limit: bigint | undefined,
        code: Enum<{
          Upload: Binary
          Existing: FixedSizeBinary<32>
        }>,
        data: Binary,
        salt: Binary,
      ],
      {
        gas_consumed: Gas
        gas_required: Gas
        storage_deposit: Enum<{
          Refund: bigint
          Charge: bigint
        }>
        debug_message: Binary
        result: ResultPayload<
          {
            result: {
              flags: number
              data: Binary
            }
            account_id: SS58String
          },
          Err
        >
        events?: Array<Ev>
      }
    >
    get_storage: RuntimeDescriptor<
      [address: SS58String, key: Binary],
      ResultPayload<Binary | undefined, StorageError>
    >
  }
}>
export type InkSdkPallets = PalletsTypedef<
  {
    Contracts: {
      ContractInfoOf: StorageDescriptor<
        [Key: SS58String],
        {
          code_hash: FixedSizeBinary<32>
        },
        true
      >
    }
  },
  {
    Contracts: {
      call: TxDescriptor<{
        dest: MultiAddress
        value: bigint
        gas_limit: Gas
        storage_deposit_limit: bigint | undefined
        data: Binary
      }>
      instantiate: TxDescriptor<{
        value: bigint
        gas_limit: Gas
        storage_deposit_limit: bigint | undefined
        code_hash: FixedSizeBinary<32>
        data: Binary
        salt: Binary
      }>
      instantiate_with_code: TxDescriptor<{
        value: bigint
        gas_limit: Gas
        storage_deposit_limit: bigint | undefined
        code: Binary
        data: Binary
        salt: Binary
      }>
    }
  },
  {},
  {},
  {}
>

export type InkSdkDefinition = SdkDefinition<InkSdkPallets, InkSdkApis>
export type InkSdkTypedApi = TypedApi<InkSdkDefinition>
export type GenericInkDescriptors = InkDescriptors<
  InkStorageDescriptor,
  InkCallableDescriptor,
  InkCallableDescriptor,
  Event
>
