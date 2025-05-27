import { mapResult, Result } from "@polkadot-api/common-sdk-utils"
import {
  Binary,
  FixedSizeBinary,
  ResultPayload,
  SS58String,
  Transaction,
} from "polkadot-api"
import {
  DryRunCallParams,
  DryRunCallResult,
  DryRunInstantiateParams,
  DryRunInstantiateResult,
  Gas,
  InkSdkTypedApi,
  ReviveAddress,
  ReviveSdkTypedApi,
  ReviveStorageError,
  StorageError,
} from "./descriptor-types"

export interface ContractsProvider<Addr, StorageErr> {
  dryRunCall(...args: DryRunCallParams<Addr>): Promise<DryRunCallResult>
  dryRunInstantiate(
    ...args: DryRunInstantiateParams
  ): Promise<DryRunInstantiateResult<{ addr: Addr }>>
  getStorage(
    addr: Addr,
    key: Binary,
  ): Promise<ResultPayload<Binary | undefined, StorageErr>>
  getCodeHash(addr: Addr): Promise<FixedSizeBinary<32> | undefined>
  txCall(payload: {
    dest: Addr
    value: bigint
    gas_limit: Gas
    storage_deposit_limit?: bigint
    data: Binary
  }): Transaction<any, any, any, any>
  txInstantiate(payload: {
    value: bigint
    gas_limit: Gas
    storage_deposit_limit?: bigint
    code_hash: FixedSizeBinary<32>
    data: Binary
    salt?: Binary
  }): Transaction<any, any, any, any>
  txInstantiateWithCode(payload: {
    value: bigint
    gas_limit: Gas
    storage_deposit_limit?: bigint
    code: Binary
    data: Binary
    salt?: Binary
  }): Transaction<any, any, any, any>
}

const defaultSalt = Binary.fromText("")
export const contractsProvider = (
  typedApi: InkSdkTypedApi,
): ContractsProvider<SS58String, StorageError> => {
  return {
    dryRunCall: (...args) => typedApi.apis.ContractsApi.call(...args),
    dryRunInstantiate: async (
      origin,
      value,
      gas_limit,
      storage_deposit_limit,
      code,
      data,
      salt,
    ) => {
      const response = await typedApi.apis.ContractsApi.instantiate(
        origin,
        value,
        gas_limit,
        storage_deposit_limit,
        code,
        data,
        salt ?? defaultSalt,
      )
      const result: Result<
        {
          result: {
            flags: number
            data: Binary
          }
        } & {
          account_id: SS58String
        }
      > = response.result
      return {
        ...response,
        result: mapResult(result, {
          value: ({ account_id, result }) => ({
            result,
            addr: account_id,
          }),
        }),
      }
    },
    getStorage: (...args) => typedApi.apis.ContractsApi.get_storage(...args),
    getCodeHash: (addr) =>
      typedApi.query.Contracts.ContractInfoOf.getValue(addr).then(
        (r) => r?.code_hash,
      ),
    txCall: ({ data, dest, gas_limit, value, storage_deposit_limit }) =>
      typedApi.tx.Contracts.call({
        data,
        dest: {
          type: "Id",
          value: dest,
        },
        gas_limit,
        storage_deposit_limit,
        value,
      }),
    txInstantiate: (payload) =>
      typedApi.tx.Contracts.instantiate({
        salt: defaultSalt,
        storage_deposit_limit: undefined,
        ...payload,
      }),
    txInstantiateWithCode: (payload) =>
      typedApi.tx.Contracts.instantiate_with_code({
        salt: defaultSalt,
        storage_deposit_limit: undefined,
        ...payload,
      }),
  }
}

export const reviveProvider = (
  typedApi: ReviveSdkTypedApi,
): ContractsProvider<ReviveAddress, ReviveStorageError> => {
  return {
    dryRunCall: (...args) => typedApi.apis.ReviveApi.call(...args),
    dryRunInstantiate: (...args) =>
      typedApi.apis.ReviveApi.instantiate(...args),
    getStorage: (...args) => typedApi.apis.ReviveApi.get_storage(...args),
    getCodeHash: (addr) =>
      typedApi.query.Revive.ContractInfoOf.getValue(addr).then(
        (r) => r?.code_hash,
      ),
    txCall: (payload) => {
      if (payload.storage_deposit_limit == null) {
        throw new Error("Pallet revive requires storage deposit limit")
      }
      return typedApi.tx.Revive.call({
        storage_deposit_limit: payload.storage_deposit_limit,
        ...payload,
      })
    },
    txInstantiate: (payload) => {
      if (payload.storage_deposit_limit == null) {
        throw new Error("Pallet revive requires storage deposit limit")
      }
      return typedApi.tx.Revive.instantiate({
        storage_deposit_limit: payload.storage_deposit_limit,
        salt: payload.salt,
        ...payload,
      })
    },
    txInstantiateWithCode: (payload) => {
      if (payload.storage_deposit_limit == null) {
        throw new Error("Pallet revive requires storage deposit limit")
      }
      return typedApi.tx.Revive.instantiate_with_code({
        storage_deposit_limit: payload.storage_deposit_limit,
        salt: payload.salt,
        ...payload,
      })
    },
  }
}
