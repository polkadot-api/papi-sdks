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
  Transaction,
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
} from "./descriptor-types"
import type { SdkStorage } from "./get-storage"

export interface InkSdk<
  T extends InkSdkTypedApi,
  D extends GenericInkDescriptors,
> {
  getContract(adddress: SS58String): Contract<T, D>
  getDeployer(code: Binary): Deployer<T, D>
  readDeploymentEvents: (
    origin: SS58String,
    events?: Array<
      GenericEvent & {
        topics: FixedSizeBinary<number>[]
      }
    >,
  ) => {
    address: string
    contractEvents: Array<D["__types"]["event"]>
  } | null
}

type DryRunDeployFn<
  T extends InkSdkTypedApi,
  D extends GenericInkDescriptors,
> = <L extends string & keyof D["__types"]["constructors"]>(
  constructor: L,
  args: DryRunRedeployArgs<D["__types"]["constructors"][L]["message"]>,
) => Promise<
  ResultPayload<
    {
      address: SS58String
      response: FlattenValues<D["__types"]["messages"][L]["response"]>
      events: D["__types"]["event"][]
      gasRequired: Gas
    },
    GetErr<T> | FlattenErrors<D["__types"]["messages"][L]["response"]>
  >
>

type DeployFn<D extends GenericInkDescriptors> = <
  L extends string & keyof D["__types"]["constructors"],
>(
  constructor: L,
  args: RedeployArgs<D["__types"]["constructors"][L]["message"]>,
) => AsyncTransaction<any, any, any, any>

export interface Deployer<
  T extends InkSdkTypedApi,
  D extends GenericInkDescriptors,
> {
  dryRun: DryRunDeployFn<T, D>
  deploy: DeployFn<D>
}

type GetErr<T> =
  T extends TypedApi<SdkDefinition<InkSdkPallets, InkSdkApis<any, infer R>>>
    ? R
    : any

export type StorageRootType<T extends InkStorageDescriptor> = "" extends keyof T
  ? T[""]["value"]
  : never

export interface Contract<
  T extends InkSdkTypedApi,
  D extends GenericInkDescriptors,
> {
  isCompatible(): Promise<boolean>
  getStorage(): SdkStorage<D["__types"]["storage"]>
  query: <L extends string & keyof D["__types"]["messages"]>(
    message: L,
    args: QueryArgs<D["__types"]["messages"][L]["message"]>,
  ) => Promise<
    ResultPayload<
      {
        response: FlattenValues<D["__types"]["messages"][L]["response"]>
        events: D["__types"]["event"][]
        gasRequired: Gas
        send: () => Transaction<any, any, any, any>
      },
      GetErr<T> | FlattenErrors<D["__types"]["messages"][L]["response"]>
    >
  >
  send: <L extends string & keyof D["__types"]["messages"]>(
    message: L,
    args: SendArgs<D["__types"]["messages"][L]["message"]>,
  ) => AsyncTransaction<any, any, any, any>
  dryRunRedeploy: DryRunDeployFn<T, D>
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
    }

type SendArgs<D> = Data<D> & {
  options?: Omit<QueryOptions, "gasLimit">
  value?: bigint
} & GasInput

type DeployOptions = Partial<{
  gasLimit: Gas
  storageDepositLimit: bigint
  salt: Binary
}>
type DryRunRedeployArgs<D> = Data<D> & {
  options?: DeployOptions
  value?: bigint
  origin: SS58String
}
type RedeployArgs<D> = Data<D> & {
  options?: Omit<DeployOptions, "gasLimit">
  value?: bigint
} & GasInput
