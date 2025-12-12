import {
  AsyncTransaction,
  mapResult,
  Result,
  wrapAsyncTx,
} from "@polkadot-api/common-sdk-utils"
import { GenericEvent } from "@polkadot-api/ink-contracts"
import {
  Binary,
  CompatibilityLevel,
  Enum,
  FixedSizeBinary,
  ResultPayload,
  SS58String,
  Transaction,
  TypedApi,
} from "polkadot-api"
import { mergeUint8 } from "polkadot-api/utils"
import {
  DryRunCallParams,
  DryRunCallResult,
  DryRunInstantiateParams,
  DryRunInstantiateResult,
  Gas,
  GenericTransaction,
  InkSdkTypedApi,
  NewReviveSdkTypedApi,
  OldReviveSdkTypedApi,
  ReviveAddress,
  ReviveSdkTypedApi,
  ReviveStorageError,
  StorageError,
  TraceCallResult,
} from "./descriptor-types"
import {
  getDeploymentAddressWithNonce,
  getDeploymentAddressWithSalt,
  getDeploymentHash,
  ss58ToEthereum,
  u256ToValue,
  valueToU256,
} from "./util"
import { AllTypedApis, CommonTypedApi } from "./sdk-types"
import { Passet } from "../.papi/descriptors/dist"

export interface ContractsProvider<Addr, StorageErr> {
  getBalance(addr: Addr): Promise<bigint>
  dryRunCall(...args: DryRunCallParams<Addr>): Promise<DryRunCallResult>
  dryRunInstantiate(
    ...args: DryRunInstantiateParams
  ): Promise<DryRunInstantiateResult<{ addr: Addr }>>
  getEstimatedAddress(
    origin: SS58String,
    value: bigint,
    code: Enum<{
      Upload: Binary
      Existing: FixedSizeBinary<32>
    }>,
    data: Binary,
    salt?: Binary,
    nonce?: number,
  ): Promise<Addr | null>
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
  }): AsyncTransaction
  txInstantiate(payload: {
    value: bigint
    gas_limit: Gas
    storage_deposit_limit?: bigint
    code_hash: FixedSizeBinary<32>
    data: Binary
    salt?: Binary
  }): AsyncTransaction
  txInstantiateWithCode(payload: {
    value: bigint
    gas_limit: Gas
    storage_deposit_limit?: bigint
    code: Binary
    data: Binary
    salt?: Binary
  }): AsyncTransaction
}

const defaultSalt = Binary.fromText("")
export const contractsProvider = (
  typedApi: InkSdkTypedApi,
  atBest?: boolean,
): ContractsProvider<SS58String, StorageError> => {
  const callOptions = atBest ? { at: "best" } : {}
  const dryRunInstantiate = async (
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
  ) => {
    const response = await typedApi.apis.ContractsApi.instantiate(
      origin,
      value,
      gas_limit,
      storage_deposit_limit,
      code,
      data,
      salt ?? defaultSalt,
      callOptions,
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
  }

  return {
    async getBalance(addr) {
      const account = await typedApi.query.System.Account.getValue(addr)
      return account.data.free
    },
    dryRunCall: (...args) =>
      typedApi.apis.ContractsApi.call(...args, callOptions),
    dryRunInstantiate,
    getEstimatedAddress: async (origin, value, code, data, salt) => {
      const result = await dryRunInstantiate(
        origin,
        value,
        undefined,
        undefined,
        code,
        data,
        salt,
      )
      return result.result.success ? result.result.value.addr : null
    },
    getStorage: (...args) =>
      typedApi.apis.ContractsApi.get_storage(...args, callOptions),
    getCodeHash: (addr) =>
      typedApi.query.Contracts.ContractInfoOf.getValue(addr, callOptions).then(
        (r) => r?.code_hash,
      ),
    txCall: ({ data, dest, gas_limit, value, storage_deposit_limit }) =>
      wrapAsyncTx(async () =>
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
      ),
    txInstantiate: (payload) =>
      wrapAsyncTx(async () =>
        typedApi.tx.Contracts.instantiate({
          storage_deposit_limit: undefined,
          ...payload,
          salt: payload.salt ?? defaultSalt,
        }),
      ),
    txInstantiateWithCode: (payload) =>
      wrapAsyncTx(async () =>
        typedApi.tx.Contracts.instantiate_with_code({
          storage_deposit_limit: undefined,
          ...payload,
          salt: payload.salt ?? defaultSalt,
        }),
      ),
  }
}

const logToEvent = ({
  address,
  topics,
  data,
}: {
  address: FixedSizeBinary<20>
  topics: Array<FixedSizeBinary<32>>
  data: Binary
}): {
  event: GenericEvent
  topics: Binary[]
} => ({
  topics,
  event: {
    type: "Revive",
    value: {
      type: "ContractEmitted",
      value: {
        contract: address,
        data,
      },
    },
  },
})
const getEventsFromTrace = (
  trace: TraceCallResult,
): Array<{
  event: GenericEvent
  topics: Binary[]
}> => [
  ...trace.logs.map(logToEvent),
  ...trace.calls.flatMap(getEventsFromTrace),
]

export const reviveProvider = (
  allApis: AllTypedApis,
  atBest: boolean,
): ContractsProvider<ReviveAddress, ReviveStorageError> => {
  const typedApi = allApis.passet as CommonTypedApi | ReviveSdkTypedApi

  const callOptions = atBest ? { at: "best" } : {}
  const traceCall = ({
    from,
    to,
    input,
    value,
  }: Pick<GenericTransaction, "from" | "to" | "input" | "value">) =>
    typedApi.apis.ReviveApi.trace_call(
      {
        authorization_list: [],
        blob_versioned_hashes: [],
        blobs: [],
        from,
        input: {
          data: input.data,
          input: input.input,
        },
        to,
        value,
        access_list: undefined,
        chain_id: undefined,
        "r#type": undefined,
        gas: undefined,
        gas_price: undefined,
        max_fee_per_blob_gas: undefined,
        max_fee_per_gas: undefined,
        max_priority_fee_per_gas: undefined,
        nonce: undefined,
      },
      Enum("CallTracer", {
        only_top_call: false,
        with_logs: true,
      }),
      callOptions,
    ).catch((ex) => {
      console.error(ex)
      return {
        success: false as const,
      }
    })

  return {
    async getBalance(addr) {
      const ethBalance = await typedApi.apis.ReviveApi.balance(addr)
      const nativeToEth = await typedApi.constants.Revive.NativeToEthRatio()

      return u256ToValue(ethBalance, nativeToEth)
    },
    dryRunCall: (
      origin: SS58String,
      dest: ReviveAddress,
      value: bigint,
      gas_limit: Gas | undefined,
      storage_deposit_limit: bigint | undefined,
      input: Binary,
    ) =>
      Promise.all([
        typedApi.apis.ReviveApi.call(
          origin,
          dest,
          value,
          gas_limit,
          storage_deposit_limit,
          input,
          callOptions,
        ),
        traceCall({
          from: ss58ToEthereum(origin),
          input: {
            input,
          },
          to: dest,
        }),
      ]).then(([call, trace]) => {
        const events = (() => {
          if ("events" in call && call.events) return call.events
          if (!trace.success) return undefined

          if ("type" in trace.value) {
            if (trace.value.type === "Prestate") {
              console.error("Unexpected prestate response for events")
              return undefined
            }
            return getEventsFromTrace(trace.value.value)
          }
          return getEventsFromTrace(trace.value)
        })()

        if ("weight_required" in call) {
          return {
            ...call,
            events,
            gas_required: call.weight_required,
            gas_consumed: call.weight_consumed,
          }
        } else {
          return {
            ...call,
            events,
          }
        }
      }),
    dryRunInstantiate: (
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
    ) =>
      Promise.all([
        typedApi.apis.ReviveApi.instantiate(
          origin,
          value,
          gas_limit,
          storage_deposit_limit,
          code,
          data,
          salt,
          callOptions,
        ),
        typedApi.constants.Revive.NativeToEthRatio().then((nativeToEth) =>
          traceCall({
            from: ss58ToEthereum(origin),
            input: {
              input: Binary.fromBytes(
                mergeUint8([code.value.asBytes(), data.asBytes()]),
              ),
            },
            value: valueToU256(value, nativeToEth),
          }),
        ),
      ]).then(([call, trace]) => {
        const events = (() => {
          if ("events" in call && call.events) return call.events
          if (!trace.success) return undefined

          if ("type" in trace.value) {
            if (trace.value.type === "Prestate") {
              console.error("Unexpected prestate response for events")
              return undefined
            }
            return getEventsFromTrace(trace.value.value)
          }
          return getEventsFromTrace(trace.value)
        })()

        if ("weight_required" in call) {
          return {
            ...call,
            events,
            gas_required: call.weight_required,
            gas_consumed: call.weight_consumed,
          }
        } else {
          return {
            ...call,
            events,
          }
        }
      }),
    getEstimatedAddress: async (
      origin,
      _value,
      code_arg,
      data,
      salt,
      nonce_arg,
    ) => {
      if (salt) {
        const code =
          code_arg.type === "Upload"
            ? code_arg.value
            : await typedApi.query.Revive.PristineCode.getValue(
                code_arg.value,
                callOptions,
              )
        if (!code) return null
        return getDeploymentAddressWithSalt(
          origin,
          getDeploymentHash(code, data),
          salt,
        )
      }

      const nonce =
        nonce_arg != null
          ? nonce_arg
          : (await typedApi.query.System.Account.getValue(origin, callOptions))
              .nonce
      return getDeploymentAddressWithNonce(origin, nonce)
    },
    getStorage: async (...args) => {
      // the optional part makes it awkward to work with…
      const var_key_call = typedApi.apis.ReviveApi
        .get_storage_var_key as CommonTypedApi["apis"]["ReviveApi"]["get_storage_var_key"]
      const call = (await var_key_call.isCompatible(CompatibilityLevel.Partial))
        ? var_key_call
        : typedApi.apis.ReviveApi.get_storage

      const res = await call(...args, callOptions)
      if (res.success) return res
      return {
        success: false as const,
        value: res.value as ReviveStorageError,
      }
    },
    getCodeHash: async (addr) => {
      const newApi = typedApi as NewReviveSdkTypedApi
      if (
        await newApi.query.Revive.AccountInfoOf.isCompatible(
          CompatibilityLevel.Partial,
        )
      ) {
        const result = await newApi.query.Revive.AccountInfoOf.getValue(
          addr,
          callOptions,
        )
        if (result?.account_type.type !== "Contract") {
          return undefined
        }
        return result.account_type.value.code_hash
      }

      const oldApi = typedApi as OldReviveSdkTypedApi
      const result = await oldApi.query.Revive.ContractInfoOf.getValue(
        addr,
        callOptions,
      )
      return result?.code_hash
    },
    txCall: (payload) => {
      const { storage_deposit_limit } = payload
      if (storage_deposit_limit == null) {
        throw new Error("Pallet revive requires storage deposit limit")
      }

      return wrapAsyncTx(async (): Promise<Transaction> => {
        if (
          await allApis.passet.tx.Revive.call.isCompatible(
            CompatibilityLevel.Partial,
          )
        ) {
          return allApis.passet.tx.Revive.call({
            storage_deposit_limit,
            weight_limit: payload.gas_limit,
            ...payload,
          })
        }

        return (
          typedApi as Exclude<
            CommonTypedApi | ReviveSdkTypedApi,
            TypedApi<Passet>
          >
        ).tx.Revive.call({
          storage_deposit_limit,
          ...payload,
        })
      })
    },
    txInstantiate: (payload) => {
      const { salt, storage_deposit_limit } = payload
      if (storage_deposit_limit == null) {
        throw new Error("Pallet revive requires storage deposit limit")
      }

      return wrapAsyncTx(async () => {
        if (
          await allApis.passet.tx.Revive.instantiate.isCompatible(
            CompatibilityLevel.Partial,
          )
        ) {
          return allApis.passet.tx.Revive.instantiate({
            storage_deposit_limit,
            salt,
            weight_limit: payload.gas_limit,
            ...payload,
          })
        }

        return (
          typedApi as Exclude<
            CommonTypedApi | ReviveSdkTypedApi,
            TypedApi<Passet>
          >
        ).tx.Revive.instantiate({
          storage_deposit_limit,
          salt,
          ...payload,
        }) as Transaction
      })
    },
    txInstantiateWithCode: (payload) => {
      const { salt, storage_deposit_limit } = payload
      if (storage_deposit_limit == null) {
        throw new Error("Pallet revive requires storage deposit limit")
      }

      return wrapAsyncTx(async () => {
        if (
          await allApis.passet.tx.Revive.instantiate.isCompatible(
            CompatibilityLevel.Partial,
          )
        ) {
          return allApis.passet.tx.Revive.instantiate_with_code({
            storage_deposit_limit,
            salt,
            weight_limit: payload.gas_limit,
            ...payload,
          })
        }

        return (
          typedApi as Exclude<
            CommonTypedApi | ReviveSdkTypedApi,
            TypedApi<Passet>
          >
        ).tx.Revive.instantiate_with_code({
          storage_deposit_limit,
          salt,
          ...payload,
        }) as Transaction
      })
    },
  }
}
