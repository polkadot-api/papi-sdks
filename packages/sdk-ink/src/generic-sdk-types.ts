import {
    AsyncTransaction
} from "@polkadot-api/common-sdk-utils"
import {
    Binary,
    FixedSizeBinary,
    type ResultPayload,
    type SS58String
} from "polkadot-api"
import type {
    Gas
} from "./descriptor-types"
import { Data, DeployArgs, DryRunDeployArgs, QueryArgs, SendArgs } from "./sdk-types"

type DryRunDeployFn<
  Addr,
> = (
  args: DryRunDeployArgs<Binary>,
) => Promise<
  ResultPayload<
    {
      address: Addr
      response: unknown
      // events: D["__types"]["event"][]
      gasRequired: Gas
      storageDeposit: bigint
      deploy: () => AsyncTransaction<any, any, any, any>
    },
    unknown
  >
>

type DeployFn = (
  args: DeployArgs<Binary>,
) => AsyncTransaction<any, any, any, any>

type EstimateAddrFn<Addr> = (
  args: Data<Binary> & {
    origin: SS58String
    value?: bigint
    nonce?: number
    salt?: FixedSizeBinary<32>
  },
) => Promise<Addr | null>

export interface GenericDeployer<
  Addr,
> {
  dryRun: DryRunDeployFn<Addr>
  deploy: DeployFn
  estimateAddress: EstimateAddrFn<Addr>
}

export interface GenericContract<
  Addr,
> {
  accountId: SS58String
  query: (
    args: QueryArgs<Binary>,
  ) => Promise<
    ResultPayload<
      {
        response: unknown,
        // events: D["__types"]["event"][]
        gasRequired: Gas
        storageDeposit: bigint
        send: () => AsyncTransaction<any, any, any, any>
      },
      unknown
    >
  >
  send: (
    args: SendArgs<Binary>,
  ) => AsyncTransaction<any, any, any, any>
  dryRunRedeploy: DryRunDeployFn<Addr>
  redeploy: DeployFn
}

export interface GenericReviveSdk<
  Addr,
> {
  getContract(adddress: Addr): GenericContract<Addr>
  getDeployer(code: Binary): GenericDeployer<Addr>
  addressIsMapped: (address: SS58String) => Promise<boolean>
}
