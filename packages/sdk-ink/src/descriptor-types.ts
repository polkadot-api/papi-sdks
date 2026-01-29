import { SdkDefinition } from "@polkadot-api/common-sdk-utils"
import {
  Event,
  InkCallableDescriptor,
  InkDescriptors,
  InkStorageDescriptor,
} from "@polkadot-api/ink-contracts"
import { SizedHex } from "@polkadot-api/substrate-bindings"
import {
  ApisTypedef,
  Enum,
  FixedSizeArray,
  PalletsTypedef,
  PlainDescriptor,
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
  Raw: Uint8Array
  Address32: SizedHex<32>
  Address20: SizedHex<20>
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
  input_data: Uint8Array,
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
      data: Uint8Array
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
    Upload: Uint8Array
    Existing: SizedHex<32>
  }>,
  data: Uint8Array,
  salt: Uint8Array | undefined,
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
        data: Uint8Array
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
      [address: SS58String, key: Uint8Array],
      ResultPayload<Uint8Array | undefined, StorageError>
    >
  }
}>

export type InkSdkPallets = PalletsTypedef<
  {
    System: {
      Account: StorageDescriptor<
        [Key: SS58String],
        {
          data: {
            free: bigint
          }
        },
        false,
        never
      >
    }
    Contracts: {
      ContractInfoOf: StorageDescriptor<
        [Key: SS58String],
        {
          code_hash: SizedHex<32>
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
        data: Uint8Array
      }>
      instantiate: TxDescriptor<{
        value: bigint
        gas_limit: Gas
        storage_deposit_limit: bigint | undefined
        code_hash: SizedHex<32>
        data: Uint8Array
        salt: Uint8Array
      }>
      instantiate_with_code: TxDescriptor<{
        value: bigint
        gas_limit: Gas
        storage_deposit_limit: bigint | undefined
        code: Uint8Array
        data: Uint8Array
        salt: Uint8Array
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

export type ReviveAddress = SizedHex<20>
export type ReviveStorageError = Enum<{
  DoesntExist: undefined
  KeyDecodingFailed: undefined
}>

export type U256 = FixedSizeArray<4, bigint>
export type GenericTransaction = {
  blob_versioned_hashes: Array<SizedHex<32>>
  // Upcoming parameter, pop doesn't have it
  authorization_list?: Array<unknown>
  blobs: Array<Uint8Array>
  from?: SizedHex<20> | undefined
  input: {
    input?: Uint8Array | undefined
    data?: Uint8Array | undefined
  }
  to?: SizedHex<20> | undefined
  value?: U256 | undefined
}

export type TraceCallResult = {
  from: SizedHex<20>
  to: SizedHex<20>
  output: Uint8Array
  error?: string
  revert_reason?: string
  calls: Array<TraceCallResult>
  logs: Array<{
    address: SizedHex<20>
    topics: Array<SizedHex<32>>
    data: Uint8Array
    position: number
  }>
  value?: U256 | undefined
}

type ContractState = Array<
  [
    SizedHex<20>,
    {
      balance?: U256 | undefined
      nonce?: number | undefined
      code?: Uint8Array | undefined
      storage: Array<[Uint8Array, Uint8Array | undefined]>
    },
  ]
>

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
      [address: ReviveAddress, key: SizedHex<32>],
      ResultPayload<Uint8Array | undefined, ReviveStorageError>
    >
    get_storage_var_key?: RuntimeDescriptor<
      [address: ReviveAddress, key: Uint8Array],
      ResultPayload<Uint8Array | undefined, ReviveStorageError>
    >
    trace_call: RuntimeDescriptor<
      [
        tx: GenericTransaction,
        config: Enum<{
          CallTracer?:
            | {
                with_logs: boolean
                only_top_call?: boolean
              }
            | undefined
          PrestateTracer?:
            | {
                diff_mode: boolean
                disable_storage: boolean
                disable_code: boolean
              }
            | undefined
        }>,
      ],
      ResultPayload<
        // wnd
        | Enum<{
            Call: TraceCallResult
            Prestate: Enum<{
              Prestate: ContractState
              DiffMode: {
                pre: ContractState
                post: ContractState
              }
            }>
          }>
        // pop
        | TraceCallResult,
        Enum<{
          Data: Uint8Array
          Message: string
        }>
      >
    >
    balance: RuntimeDescriptor<[address: SizedHex<20>], U256>
  }
}>
export type ReviveSdkPallets<TStorage> = PalletsTypedef<
  {
    System: {
      Account: StorageDescriptor<
        [Key: SS58String],
        {
          nonce: number
        },
        false,
        never
      >
    }
    Revive: {
      PristineCode: StorageDescriptor<
        [Key: SizedHex<32>],
        Uint8Array,
        true,
        never
      >
      OriginalAccount: StorageDescriptor<
        [Key: SizedHex<20>],
        SS58String,
        true,
        never
      >
    } & TStorage
  },
  {
    Revive: {
      call: TxDescriptor<{
        dest: ReviveAddress
        value: bigint
        gas_limit: Gas
        storage_deposit_limit: bigint
        data: Uint8Array
      }>
      instantiate: TxDescriptor<{
        value: bigint
        gas_limit: Gas
        storage_deposit_limit: bigint
        code_hash: SizedHex<32>
        data: Uint8Array
        salt: SizedHex<32> | undefined
      }>
      instantiate_with_code: TxDescriptor<{
        value: bigint
        gas_limit: Gas
        storage_deposit_limit: bigint
        code: Uint8Array
        data: Uint8Array
        salt: SizedHex<32> | undefined
      }>
    }
  },
  {},
  {},
  {
    Revive: {
      NativeToEthRatio: PlainDescriptor<number>
    }
  },
  {}
>

type OldStorage = {
  // Old interface, only in pop now
  ContractInfoOf: StorageDescriptor<
    [Key: ReviveAddress],
    {
      code_hash: SizedHex<32>
    },
    true,
    never
  >
}
type NewStorage = {
  // New interface
  AccountInfoOf: StorageDescriptor<
    [Key: SizedHex<20>],
    {
      account_type: Enum<{
        Contract: {
          code_hash: SizedHex<32>
        }
        EOA: undefined
      }>
    },
    true,
    never
  >
}

type ReviveSdkDefinition<TStorage> = SdkDefinition<
  ReviveSdkPallets<TStorage>,
  ReviveSdkApis
>
export type ReviveSdkTypedApi = TypedApi<
  ReviveSdkDefinition<OldStorage | NewStorage>
>

export type OldReviveSdkTypedApi = TypedApi<ReviveSdkDefinition<OldStorage>>
export type NewReviveSdkTypedApi = TypedApi<ReviveSdkDefinition<NewStorage>>
