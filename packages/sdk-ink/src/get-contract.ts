import {
  flattenResult,
  mapResult,
  wrapAsyncTx,
} from "@polkadot-api/common-sdk-utils"
import type { InkClient, InkMetadataLookup } from "@polkadot-api/ink-contracts"
import { Binary, Enum } from "polkadot-api"
import type {
  GenericInkDescriptors,
  InkSdkTypedApi,
  ReviveSdkTypedApi,
} from "./descriptor-types"
import { getStorage } from "./get-storage"
import { ContractsProvider } from "./provider"
import type { Contract } from "./sdk-types"
import { getSignedStorage, getStorageLimit } from "./util"
import { defaultSalt } from "./get-deployer"

export function getContract<
  T extends InkSdkTypedApi | ReviveSdkTypedApi,
  Addr,
  StorageErr,
  D extends GenericInkDescriptors,
  PublicAddr,
>(
  provider: ContractsProvider<Addr, StorageErr>,
  inkClient: InkClient<D>,
  lookup: InkMetadataLookup,
  address: Addr,
  _mapAddr: (v: Addr) => PublicAddr,
): Contract<T, D, PublicAddr> {
  const codeHash = provider.getCodeHash(address)

  return {
    async isCompatible() {
      try {
        const code_hash = await codeHash
        return code_hash
          ? code_hash.asHex() === lookup.metadata.source.hash
          : false
      } catch (ex) {
        console.error(ex)
        return false
      }
    },
    getStorage: () => getStorage(provider, inkClient, lookup, address),
    async query(message, args) {
      const msg = inkClient.message(message)

      const data = msg.encode(args.data ?? {})
      const value = args.value ?? 0n
      const response = await provider.dryRunCall(
        args.origin,
        address,
        value,
        args.options?.gasLimit,
        args.options?.storageDepositLimit,
        data,
      )
      if (response.result.success) {
        const decoded = msg.decode(response.result.value)
        return mapResult(flattenResult(decoded), {
          value: (innerResponse) => ({
            response: innerResponse,
            // TODO
            events: inkClient.event.filter(address as any, response.events),
            gasRequired: response.gas_required,
            storageDeposit: getSignedStorage(response.storage_deposit),
            send: () =>
              provider.txCall({
                dest: address,
                value,
                gas_limit: response.gas_required,
                storage_deposit_limit: getStorageLimit(
                  response.storage_deposit,
                ),
                data,
              }),
          }),
        })
      }
      return {
        success: false,
        value: response.result.value,
      }
    },
    send: (message, args) =>
      wrapAsyncTx(async () => {
        const data = inkClient.message(message).encode(args.data ?? {})

        const limits = await (async () => {
          if ("gasLimit" in args)
            return {
              gas: args.gasLimit,
              storage: args.storageDepositLimit,
            }

          const response = await provider.dryRunCall(
            args.origin,
            address,
            args.value ?? 0n,
            undefined,
            undefined,
            data,
          )

          return {
            gas: response.gas_required,
            storage: getStorageLimit(response.storage_deposit),
          }
        })()

        return provider.txCall({
          dest: address,
          value: args.value ?? 0n,
          gas_limit: limits.gas,
          storage_deposit_limit: limits.storage,
          data,
        })
      }),
    async dryRunRedeploy(constructorLabel, args) {
      const code_hash = await codeHash
      if (!code_hash) {
        return {
          success: false,
          value: NotFoundError,
        }
      }
      const ctor = inkClient.constructor(constructorLabel)
      const response = await provider.dryRunInstantiate(
        args.origin,
        args.value ?? 0n,
        args.options?.gasLimit,
        args.options?.storageDepositLimit,
        Enum("Existing", code_hash),
        ctor.encode(args.data ?? {}),
        // TODO
        args.options?.salt ?? Binary.fromText(""),
      )
      if (response.result.success) {
        const decoded = ctor.decode(response.result.value.result)
        return mapResult(flattenResult(decoded), {
          value: (value) => ({
            // TODO mapAddr?
            address: response.result.value.account_id,
            response: value,
            // TODO
            events: inkClient.event.filter(address as any, response.events),
            gasRequired: response.gas_required,
            storageDeposit: getSignedStorage(response.storage_deposit),
            deploy() {
              return provider.txInstantiate({
                value: args.value ?? 0n,
                gas_limit: response.gas_required,
                storage_deposit_limit: getStorageLimit(
                  response.storage_deposit,
                ),
                code_hash,
                data: ctor.encode(args.data ?? {}),
                salt: args.options?.salt ?? defaultSalt,
              })
            },
          }),
        })
      }
      return {
        success: false,
        value: response.result.value,
      }
    },
    redeploy: (constructorLabel, args) =>
      wrapAsyncTx(async () => {
        const code_hash = await codeHash
        const hash = code_hash ?? Binary.fromBytes(new Uint8Array(32))
        const ctor = inkClient.constructor(constructorLabel)

        const gasLimit = await (async () => {
          if ("gasLimit" in args)
            return {
              gas: args.gasLimit,
              storage: args.storageDepositLimit,
            }

          const response = await provider.dryRunInstantiate(
            args.origin,
            args.value ?? 0n,
            undefined,
            undefined,
            Enum("Existing", hash),
            ctor.encode(args.data ?? {}),
            args.options?.salt ?? defaultSalt,
          )

          return {
            gas: response.gas_required,
            storage: getStorageLimit(response.storage_deposit),
          }
        })()

        return provider.txInstantiate({
          value: args.value ?? 0n,
          gas_limit: gasLimit.gas,
          storage_deposit_limit: gasLimit.storage,
          code_hash: hash,
          data: ctor.encode(args.data ?? {}),
          salt: args.options?.salt ?? defaultSalt,
        })
      }),
    filterEvents(events) {
      // TODO
      return inkClient.event.filter(address as any, events)
    },
  }
}

const NotFoundError = {
  type: "Module" as const,
  value: {
    type: "Contracts" as const,
    value: {
      type: "ContractNotFound" as const,
    },
  },
}
