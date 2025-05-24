import { SdkDefinition } from "@polkadot-api/common-sdk-utils"
import {
  InkCallableDescriptor,
  InkDescriptors,
  InkStorageDescriptor,
  Event,
} from "@polkadot-api/ink-contracts"
import {
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

export type DryRunCallParams<Addr> = [
  origin: SS58String,
  dest: Addr,
  value: bigint,
  gas_limit: Gas | undefined,
  storage_deposit_limit: bigint | undefined,
  input_data: Binary,
]
export type DryRunCallResult<Ev = any, Err = any> = {
  gas_consumed: Gas
  gas_required: Gas
  storage_deposit: Enum<{
    Refund: bigint
    Charge: bigint
  }>
  result: ResultPayload<
    {
      flags: number
      data: Binary
    },
    Err
  >
  events?: Array<Ev>
}
export type DryRunInstantiateParams = [
  origin: SS58String,
  value: bigint,
  gas_limit: Gas | undefined,
  storage_deposit_limit: bigint | undefined,
  code: Enum<{
    Upload: Binary
    Existing: FixedSizeBinary<32>
  }>,
  data: Binary,
  salt: Binary | undefined,
]
export type DryRunInstantiateResult<AddrRes, Ev = any, Err = any> = {
  gas_consumed: Gas
  gas_required: Gas
  storage_deposit: Enum<{
    Refund: bigint
    Charge: bigint
  }>
  result: ResultPayload<
    {
      result: {
        flags: number
        data: Binary
      }
    } & AddrRes,
    Err
  >
  events?: Array<Ev>
}

export type InkSdkApis<Ev = any, Err = any> = ApisTypedef<{
  ContractsApi: {
    call: RuntimeDescriptor<
      DryRunCallParams<SS58String>,
      DryRunCallResult<Ev, Err>
    >
    instantiate: RuntimeDescriptor<
      DryRunInstantiateParams,
      DryRunInstantiateResult<{ account_id: SS58String }, Ev, Err>
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
        true,
        never
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

export type ReviveAddress = FixedSizeBinary<20>
export type ReviveStorageError = Enum<{
  DoesntExist: undefined
  KeyDecodingFailed: undefined
}>
export type ReviveSdkApis<Ev = any, Err = any> = ApisTypedef<{
  ReviveApi: {
    call: RuntimeDescriptor<
      DryRunCallParams<ReviveAddress>,
      DryRunCallResult<Ev, Err>
    >
    instantiate: RuntimeDescriptor<
      DryRunInstantiateParams,
      DryRunInstantiateResult<{ addr: ReviveAddress }, Ev, Err>
    >
    get_storage: RuntimeDescriptor<
      [address: ReviveAddress, key: FixedSizeBinary<32>],
      ResultPayload<Binary | undefined, ReviveStorageError>
    >
  }
}>
export type ReviveSdkPallets = PalletsTypedef<
  {
    Revive: {
      ContractInfoOf: StorageDescriptor<
        [Key: ReviveAddress],
        {
          code_hash: FixedSizeBinary<32>
        },
        true,
        never
      >
    }
  },
  {
    Revive: {
      call: TxDescriptor<{
        dest: ReviveAddress
        value: bigint
        gas_limit: Gas
        storage_deposit_limit: bigint
        data: Binary
      }>
      instantiate: TxDescriptor<{
        value: bigint
        gas_limit: Gas
        storage_deposit_limit: bigint
        code_hash: FixedSizeBinary<32>
        data: Binary
        salt: FixedSizeBinary<32> | undefined
      }>
      instantiate_with_code: TxDescriptor<{
        value: bigint
        gas_limit: Gas
        storage_deposit_limit: bigint
        code: Binary
        data: Binary
        salt: FixedSizeBinary<32> | undefined
      }>
    }
  },
  {},
  {},
  {}
>

export type ReviveSdkDefinition = SdkDefinition<ReviveSdkPallets, ReviveSdkApis>
export type ReviveSdkTypedApi = TypedApi<ReviveSdkDefinition>
