import {
  AsyncTransaction,
  FlattenErrors,
  FlattenValues,
} from "@polkadot-api/common-sdk-utils"
import {
  type GenericEvent,
  type InkStorageDescriptor,
} from "@polkadot-api/ink-contracts"
import {
  Enum,
  HexString,
  SizedHex,
  type ResultPayload,
  type SS58String,
  type TypedApi,
} from "polkadot-api"
import type { PasAh, Passet, WndAh } from "../.papi/descriptors/dist"
import type { GenericInkDescriptors } from "./descriptor-types"
import type { SdkStorage } from "./get-storage"

export type AllTypedApis = {
  passet: TypedApi<Passet>
  pasAh: TypedApi<PasAh>
  wndAh: TypedApi<WndAh>
}
export type CommonTypedApi = AllTypedApis[keyof AllTypedApis]

export type ReadDeployerEvents<D extends GenericInkDescriptors> = (
  events?: Array<{
    event: GenericEvent
    topics: SizedHex<number>[]
  }>,
) => Array<{
  address: SizedHex<20>
  contractEvents: Array<D["__types"]["event"]>
}>

export interface InkSdk {
  addressIsMapped: (address: SS58String) => Promise<boolean>
  getContract: GetContract
  getDeployer: <D extends GenericInkDescriptors>(
    contractDescriptors: D,
    code: Uint8Array,
  ) => DeployerSdk<D>
  readDeploymentEvents: <D extends GenericInkDescriptors>(
    contractDescriptors: D,
    events?: Array<{
      event: GenericEvent
      topics: SizedHex<number>[]
    }>,
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

export type Gas = {
  ref_time: bigint
  proof_size: bigint
}

type DryRunDeployFn<D extends GenericInkDescriptors> = <
  L extends string & keyof D["__types"]["constructors"],
>(
  constructor: L,
  args: DryRunDeployArgs<D["__types"]["constructors"][L]["message"]>,
) => Promise<
  ResultPayload<
    {
      address: SizedHex<20>
      response: FlattenValues<D["__types"]["messages"][L]["response"]>
      events: D["__types"]["event"][]
      gasRequired: Gas
      storageDeposit: bigint
      deploy: () => AsyncTransaction<any, any, any, any>
    },
    | GetErr<CommonTypedApi>
    | FlattenErrors<D["__types"]["messages"][L]["response"]>
  >
>

type DeployFn<D extends GenericInkDescriptors> = <
  L extends string & keyof D["__types"]["constructors"],
>(
  constructor: L,
  args: DeployArgs<D["__types"]["constructors"][L]["message"]>,
) => AsyncTransaction<any, any, any, any>

type EstimateAddrFn<D extends GenericInkDescriptors> = <
  L extends string & keyof D["__types"]["constructors"],
>(
  constructor: L,
  args: Data<D["__types"]["constructors"][L]["message"]> & {
    origin: SS58String
    value?: bigint
    nonce?: number
    salt?: SizedHex<32>
  },
) => Promise<SizedHex<20> | null>

export interface DeployerSdk<D extends GenericInkDescriptors> {
  dryRun: DryRunDeployFn<D>
  deploy: DeployFn<D>
  estimateAddress: EstimateAddrFn<D>
}

type GetErr<T> =
  T extends TypedApi<infer D>
    ? D["descriptors"]["apis"] extends {
        ReviveApi: {
          call: [
            any,
            {
              result: ResultPayload<
                {
                  flags: number
                  data: Uint8Array
                },
                infer R
              >
            },
          ]
        }
      }
      ? R
      : any
    : any

export type StorageRootType<T extends InkStorageDescriptor> = "" extends keyof T
  ? T[""]["value"]
  : never

export type ReviveStorageError = Enum<{
  DoesntExist: undefined
  KeyDecodingFailed: undefined
}>

export interface ContractSdk<D extends GenericInkDescriptors> {
  accountId: SS58String
  getBalance(): Promise<bigint>
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
        storageDeposit: bigint
        send: () => AsyncTransaction<any, any, any, any>
      },
      | GetErr<CommonTypedApi>
      | FlattenErrors<D["__types"]["messages"][L]["response"]>
      | {
          type: "FlagReverted"
          value: {
            message: string
            raw: Uint8Array
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
  dryRunRedeploy: DryRunDeployFn<D>
  redeploy: DeployFn<D>
  filterEvents: (
    events?: Array<{
      event: GenericEvent
      topics: HexString[]
    }>,
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
  salt: SizedHex<32>
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
