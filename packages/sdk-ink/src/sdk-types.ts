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
  type ResultPayload,
  type SS58String,
  type TypedApi,
} from "polkadot-api"
import type {
  Gas,
  GenericInkDescriptors,
  InkSdkApis,
  InkSdkPallets,
  InkSdkTypedApi,
  ReviveSdkTypedApi,
} from "./descriptor-types"
import type { SdkStorage } from "./get-storage"

export interface InkSdk<
  T extends InkSdkTypedApi | ReviveSdkTypedApi,
  D extends GenericInkDescriptors,
  Addr,
  StorageErr,
> {
  getContract(adddress: Addr): Contract<T, D, Addr, StorageErr>
  getDeployer(code: Binary): Deployer<T, D, Addr>
  readDeploymentEvents: (
    events?: Array<
      GenericEvent & {
        topics: FixedSizeBinary<number>[]
      }
    >,
  ) => Array<{
    address: Addr
    contractEvents: Array<D["__types"]["event"]>
  }>
}

type DryRunDeployFn<
  T extends InkSdkTypedApi | ReviveSdkTypedApi,
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
  T extends InkSdkTypedApi | ReviveSdkTypedApi,
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
    : any

export type StorageRootType<T extends InkStorageDescriptor> = "" extends keyof T
  ? T[""]["value"]
  : never

export interface Contract<
  T extends InkSdkTypedApi | ReviveSdkTypedApi,
  D extends GenericInkDescriptors,
  Addr,
  StorageErr,
> {
  accountId: SS58String
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
      GetErr<T> | FlattenErrors<D["__types"]["messages"][L]["response"]>
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
