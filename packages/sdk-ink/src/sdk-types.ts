import {
  AsyncTransaction,
  FlattenErrors,
  FlattenValues,
  SdkDefinition,
} from "@polkadot-api/common-sdk-utils"
import {
  type GenericEvent,
  type InkStorageDescriptor,
} from "@polkadot-api/ink-contracts"
import {
  Binary,
  FixedSizeBinary,
  HexString,
  type ResultPayload,
  type SS58String,
  type TypedApi,
} from "polkadot-api"
import type { PasAh, Passet, WndAh } from "../.papi/descriptors/dist"
import type {
  Gas,
  GenericInkDescriptors,
  InkSdkApis,
  InkSdkPallets,
  InkSdkTypedApi,
  ReviveSdkApis,
  ReviveSdkPallets,
  ReviveSdkTypedApi,
  ReviveStorageError,
} from "./descriptor-types"
import type { SdkStorage } from "./get-storage"

export type AllTypedApis = {
  passet: TypedApi<Passet>
  pasAh: TypedApi<PasAh>
  wndAh: TypedApi<WndAh>
}
export type CommonTypedApi = AllTypedApis[keyof AllTypedApis]

export type ReadDeployerEvents<D extends GenericInkDescriptors, Addr> = (
  events?: Array<
    GenericEvent & {
      topics: FixedSizeBinary<number>[]
    }
  >,
) => Array<{
  address: Addr
  contractEvents: Array<D["__types"]["event"]>
}>

export interface InkV5Sdk<
  T extends InkSdkTypedApi | ReviveSdkTypedApi,
  D extends GenericInkDescriptors,
  Addr,
  StorageErr,
> {
  getContract(adddress: Addr): Contract<T, D, Addr, StorageErr>
  getDeployer(code: Binary): Deployer<T, D, Addr>
  readDeploymentEvents: ReadDeployerEvents<D, Addr>
}

/**
 * @deprecated Old interface, will be removed in a future version.
 */
export interface ReviveSdk<
  T extends ReviveSdkTypedApi,
  D extends GenericInkDescriptors,
  Addr,
  StorageErr,
> extends InkV5Sdk<T, D, Addr, StorageErr> {
  addressIsMapped: (address: SS58String) => Promise<boolean>
}

export type ContractSdk<D extends GenericInkDescriptors> = Contract<
  CommonTypedApi,
  D,
  HexString,
  ReviveStorageError
>
export type DeployerSdk<D extends GenericInkDescriptors> = Deployer<
  CommonTypedApi,
  D,
  HexString
>
export interface InkSdk {
  addressIsMapped: (address: SS58String) => Promise<boolean>
  getContract: GetContract
  getDeployer: <D extends GenericInkDescriptors>(
    contractDescriptors: D,
    code: Binary,
  ) => DeployerSdk<D>
  readDeploymentEvents: <D extends GenericInkDescriptors>(
    contractDescriptors: D,
    events?: Array<
      GenericEvent & {
        topics: FixedSizeBinary<number>[]
      }
    >,
  ) => Array<{
    address: HexString
    contractEvents: Array<D["__types"]["event"]>
  }>
}

export interface GetContract {
  <D extends GenericInkDescriptors>(
    contractDescriptors: D,
  ): (address: HexString) => ContractSdk<D>
  <D extends GenericInkDescriptors>(
    contractDescriptors: D,
    address: HexString,
  ): ContractSdk<D>
}

export interface InkSdkOptions {
  /**
   * Target the latest block instead of the finalized block for any query or
   * dry-run operation.
   *
   * This makes it possible to have quicker updates, but be mindful that the
   * data returned might become invalid at any point, e.g. a contract that
   * apparently was successfully deployed might suddenly disappear, just to
   * reappear a few seconds later, or maybe never? Be really mindful you can get
   * inconsistencies.
   */
  atBest: boolean
}
export const defaultOptions: InkSdkOptions = {
  atBest: false,
}

type DryRunDeployFn<
  T extends InkSdkTypedApi | ReviveSdkTypedApi | CommonTypedApi,
  Addr,
  D extends GenericInkDescriptors,
> = <L extends string & keyof D["__types"]["constructors"]>(
  constructor: L,
  args: DryRunDeployArgs<D["__types"]["constructors"][L]["message"]>,
) => Promise<
  ResultPayload<
    {
      address: Addr
      response: FlattenValues<D["__types"]["messages"][L]["response"]>
      events: D["__types"]["event"][]
      gasRequired: Gas
      storageDeposit: bigint
      deploy: () => AsyncTransaction<any, any, any, any>
    },
    GetErr<T> | FlattenErrors<D["__types"]["messages"][L]["response"]>
  >
>

type DeployFn<D extends GenericInkDescriptors> = <
  L extends string & keyof D["__types"]["constructors"],
>(
  constructor: L,
  args: DeployArgs<D["__types"]["constructors"][L]["message"]>,
) => AsyncTransaction<any, any, any, any>

type EstimateAddrFn<D extends GenericInkDescriptors, Addr> = <
  L extends string & keyof D["__types"]["constructors"],
>(
  constructor: L,
  args: Data<D["__types"]["constructors"][L]["message"]> & {
    origin: SS58String
    value?: bigint
    nonce?: number
    salt?: FixedSizeBinary<32>
  },
) => Promise<Addr | null>

export interface Deployer<
  T extends InkSdkTypedApi | ReviveSdkTypedApi | CommonTypedApi,
  D extends GenericInkDescriptors,
  Addr,
> {
  dryRun: DryRunDeployFn<T, Addr, D>
  deploy: DeployFn<D>
  estimateAddress: EstimateAddrFn<D, Addr>
}

type GetErr<T> =
  T extends TypedApi<SdkDefinition<InkSdkPallets, InkSdkApis<any, infer R>>>
    ? R
    : T extends TypedApi<
          SdkDefinition<ReviveSdkPallets<any>, ReviveSdkApis<any, infer R>>
        >
      ? R
      : any

export type StorageRootType<T extends InkStorageDescriptor> = "" extends keyof T
  ? T[""]["value"]
  : never

export interface Contract<
  T extends InkSdkTypedApi | ReviveSdkTypedApi | CommonTypedApi,
  D extends GenericInkDescriptors,
  Addr,
  StorageErr,
> {
  accountId: SS58String
  getBalance(): Promise<bigint>
  isCompatible(): Promise<boolean>
  getStorage(): SdkStorage<D["__types"]["storage"], StorageErr>
  query: <L extends string & keyof D["__types"]["messages"]>(
    message: L,
    args: QueryArgs<D["__types"]["messages"][L]["message"]>,
  ) => Promise<
    ResultPayload<
      {
        response: FlattenValues<D["__types"]["messages"][L]["response"]>
        events: D["__types"]["event"][]
        gasRequired: Gas
        storageDeposit: bigint
        send: () => AsyncTransaction<any, any, any, any>
      },
      | GetErr<T>
      | FlattenErrors<D["__types"]["messages"][L]["response"]>
      | {
          type: "FlagReverted"
          value: {
            message: string
            raw: Binary
            gasRequired: Gas
            storageDeposit: bigint
            send: () => AsyncTransaction<any, any, any, any>
          }
        }
    >
  >
  send: <L extends string & keyof D["__types"]["messages"]>(
    message: L,
    args: SendArgs<D["__types"]["messages"][L]["message"]>,
  ) => AsyncTransaction<any, any, any, any>
  dryRunRedeploy: DryRunDeployFn<T, Addr, D>
  redeploy: DeployFn<D>
  filterEvents: (
    events?: Array<
      | {
          event: GenericEvent
          topics: Binary[]
        }
      | (GenericEvent & {
          topics: Binary[]
        })
    >,
  ) => Array<D["__types"]["event"]>
}

type QueryOptions = Partial<{
  gasLimit: Gas
  storageDepositLimit: bigint
}>
type Data<D> = {} extends D
  ? {
      data?: D
    }
  : {
      data: D
    }

type QueryArgs<D> = Data<D> & {
  options?: QueryOptions
  value?: bigint
  origin: SS58String
}

type GasInput =
  | {
      origin: SS58String
    }
  | {
      gasLimit: Gas
      storageDepositLimit: bigint
    }

type SendArgs<D> = Data<D> & {
  value?: bigint
} & GasInput

type DeployOptions = Partial<{
  gasLimit: Gas
  storageDepositLimit: bigint
  salt: FixedSizeBinary<32>
}>
type DryRunDeployArgs<D> = Data<D> & {
  options?: DeployOptions
  value?: bigint
  origin: SS58String
}
type DeployArgs<D> = Data<D> & {
  options?: Omit<DeployOptions, "gasLimit" | "storageDepositLimit">
  value?: bigint
} & GasInput
