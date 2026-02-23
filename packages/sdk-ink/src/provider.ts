import { AsyncTransaction, wrapAsyncTx } from "@polkadot-api/common-sdk-utils"
import { GenericEvent } from "@polkadot-api/ink-contracts"
import { SizedHex } from "@polkadot-api/substrate-bindings"
import {
  CompatibilityLevel,
  Enum,
  ResultPayload,
  SS58String,
  Transaction,
  TypedApi,
} from "polkadot-api"
import { mergeUint8 } from "polkadot-api/utils"

import { Passet } from "../.papi/descriptors/dist"
import {
  AllTypedApis,
  CommonTypedApi,
  Gas,
  ReviveStorageError,
} from "./sdk-types"
import {
  getDeploymentAddressWithNonce,
  getDeploymentAddressWithSalt,
  getDeploymentHash,
  ss58ToEthereum,
  U256,
  u256ToValue,
  valueToU256,
} from "./util"

export interface ContractsProvider {
  getBalance(addr: SizedHex<20>): Promise<bigint>
  dryRunCall(...args: DryRunCallParams): Promise<DryRunCallResult>
  dryRunInstantiate(
    ...args: DryRunInstantiateParams
  ): Promise<DryRunInstantiateResult>
  getEstimatedAddress(
    origin: SS58String,
    value: bigint,
    code: Enum<{
      Upload: Uint8Array
      Existing: SizedHex<32>
    }>,
    data: Uint8Array,
    salt?: SizedHex<32>,
    nonce?: number,
  ): Promise<SizedHex<20> | null>
  getStorage(
    addr: SizedHex<20>,
    key: SizedHex<32> | Uint8Array,
  ): Promise<ResultPayload<Uint8Array | undefined, ReviveStorageError>>
  getCodeHash(addr: SizedHex<20>): Promise<SizedHex<32> | undefined>
  txCall(payload: {
    dest: SizedHex<20>
    value: bigint
    gas_limit: Gas
    storage_deposit_limit?: bigint
    data: Uint8Array
  }): AsyncTransaction
  txInstantiate(payload: {
    value: bigint
    gas_limit: Gas
    storage_deposit_limit?: bigint
    code_hash: SizedHex<32>
    data: Uint8Array
    salt?: SizedHex<32>
  }): AsyncTransaction
  txInstantiateWithCode(payload: {
    value: bigint
    gas_limit: Gas
    storage_deposit_limit?: bigint
    code: Uint8Array
    data: Uint8Array
    salt?: SizedHex<32>
  }): AsyncTransaction
}

const logToEvent = ({
  address,
  topics,
  data,
}: {
  address: SizedHex<20>
  topics: Array<SizedHex<32>>
  data: Uint8Array
}): {
  event: GenericEvent
  topics: Array<SizedHex<32>>
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
  topics: SizedHex<32>[]
}> => [
  ...trace.logs.map(logToEvent),
  ...trace.calls.flatMap(getEventsFromTrace),
]

export const reviveProvider = (
  allApis: AllTypedApis,
  atBest: boolean,
): ContractsProvider => {
  const typedApi = allApis.passet as CommonTypedApi

  const callOptions = atBest ? { at: "best" } : {}
  const traceCall = async ({
    from,
    to,
    input,
    value,
  }: Pick<GenericTransaction, "from" | "to" | "input" | "value">) => {
    const isPasset = (
      await allApis.passet.getStaticApis()
    ).compat.apis.ReviveApi.trace_call.isCompatible(
      CompatibilityLevel.BackwardsCompatible,
    )
    const api = isPasset ? allApis.passet : allApis.pasAh
    return api.apis.ReviveApi.trace_call(
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
  }

  return {
    async getBalance(addr) {
      const ethBalance = await typedApi.apis.ReviveApi.balance(addr)
      const nativeToEth = await typedApi.constants.Revive.NativeToEthRatio()

      return u256ToValue(ethBalance, nativeToEth)
    },
    dryRunCall: (
      origin: SS58String,
      dest: SizedHex<20>,
      value: bigint,
      gas_limit: Gas | undefined,
      storage_deposit_limit: bigint | undefined,
      input: Uint8Array,
    ) =>
      Promise.all([
        allApis.passet
          .getStaticApis()
          .then((s) =>
            s.compat.apis.ReviveApi.call.isCompatible(
              CompatibilityLevel.Partial,
            ),
          )
          .then((isPasset) => (isPasset ? allApis.passet : allApis.pasAh))
          .then(async (api) =>
            api.apis.ReviveApi.call(
              origin,
              dest,
              value,
              gas_limit,
              storage_deposit_limit,
              input,
              callOptions,
            ),
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
          // TODO verify cast
          if ("events" in call && call.events)
            return call.events as Array<{
              event: GenericEvent
              topics: SizedHex<32>[]
            }>
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
        Upload: Uint8Array
        Existing: SizedHex<32>
      }>,
      data: Uint8Array,
      salt: SizedHex<32> | undefined,
    ) =>
      Promise.all([
        allApis.passet
          .getStaticApis()
          .then((s) =>
            s.compat.apis.ReviveApi.instantiate.isCompatible(
              CompatibilityLevel.Partial,
            ),
          )
          .then((isPasset) => (isPasset ? allApis.passet : allApis.pasAh))
          .then(async (api) =>
            api.apis.ReviveApi.instantiate(
              origin,
              value,
              gas_limit,
              storage_deposit_limit,
              code,
              data,
              salt,
              callOptions,
            ),
          ),
        typedApi.constants.Revive.NativeToEthRatio().then((nativeToEth) =>
          traceCall({
            from: ss58ToEthereum(origin),
            input: {
              // TODO fetch code
              input: mergeUint8([code.value as Uint8Array, data]),
            },
            value: valueToU256(value, nativeToEth),
          }),
        ),
      ]).then(([call, trace]) => {
        const events = (() => {
          // TODO verify cast
          if ("events" in call && call.events)
            return call.events as Array<{
              event: GenericEvent
              topics: SizedHex<32>[]
            }>
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
    getStorage: async (addr, key) => {
      const res = await (typeof key === "string"
        ? typedApi.apis.ReviveApi.get_storage(addr, key)
        : typedApi.apis.ReviveApi.get_storage_var_key(addr, key))
      if (res.success) return res
      return {
        success: false as const,
        value: res.value as ReviveStorageError,
      }
    },
    getCodeHash: async (addr) => {
      const result = await typedApi.query.Revive.AccountInfoOf.getValue(
        addr,
        callOptions,
      )
      if (result?.account_type.type !== "Contract") {
        return undefined
      }
      return result.account_type.value.code_hash
    },
    txCall: (payload) => {
      const { storage_deposit_limit } = payload
      if (storage_deposit_limit == null) {
        throw new Error("Pallet revive requires storage deposit limit")
      }

      return wrapAsyncTx(async (): Promise<Transaction> => {
        if (
          (
            await allApis.passet.getStaticApis()
          ).compat.tx.Revive.call.isCompatible(CompatibilityLevel.Partial)
        ) {
          return allApis.passet.tx.Revive.call({
            storage_deposit_limit,
            weight_limit: payload.gas_limit,
            ...payload,
          })
        }

        return (
          allApis.pasAh as Exclude<CommonTypedApi, TypedApi<Passet>>
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
          (
            await allApis.passet.getStaticApis()
          ).compat.tx.Revive.instantiate.isCompatible(
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
          typedApi as Exclude<CommonTypedApi, TypedApi<Passet>>
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
          (
            await allApis.passet.getStaticApis()
          ).compat.tx.Revive.instantiate.isCompatible(
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
          allApis.pasAh as Exclude<CommonTypedApi, TypedApi<Passet>>
        ).tx.Revive.instantiate_with_code({
          storage_deposit_limit,
          salt,
          ...payload,
        }) as Transaction
      })
    },
  }
}

type GenericTransaction = {
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

type TraceCallResult = {
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

type DryRunCallParams = [
  origin: SS58String,
  dest: SizedHex<20>,
  value: bigint,
  gas_limit: Gas | undefined,
  storage_deposit_limit: bigint | undefined,
  input_data: Uint8Array,
]
type DryRunCallResult<Ev = any, Err = any> = {
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
type DryRunInstantiateParams = [
  origin: SS58String,
  value: bigint,
  gas_limit: Gas | undefined,
  storage_deposit_limit: bigint | undefined,
  code: Enum<{
    Upload: Uint8Array
    Existing: SizedHex<32>
  }>,
  data: Uint8Array,
  salt: SizedHex<32> | undefined,
]
type DryRunInstantiateResult<Ev = any, Err = any> = {
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
      addr: SizedHex<20>
    },
    Err
  >
  events?: Array<Ev>
}
