import {
  flattenResult,
  mapResult,
  wrapAsyncTx,
} from "@polkadot-api/common-sdk-utils"
import { type InkClient } from "@polkadot-api/ink-contracts"
import { Binary, Enum } from "polkadot-api"
import type {
  GenericInkDescriptors,
  InkSdkTypedApi,
  ReviveSdkTypedApi,
} from "./descriptor-types"
import { ContractsProvider } from "./provider"
import type { Deployer } from "./sdk-types"
import { getSignedStorage, getStorageLimit } from "./util"

export const defaultSalt = Binary.fromBytes(new Uint8Array(32).fill(0))
export function getDeployer<
  T extends InkSdkTypedApi | ReviveSdkTypedApi,
  Addr,
  StorageErr,
  D extends GenericInkDescriptors,
  PublicAddr extends string,
>(
  provider: ContractsProvider<Addr, StorageErr>,
  inkClient: InkClient<D>,
  code: Binary,
  mapAddr: (v: Addr) => PublicAddr,
): Deployer<T, D, PublicAddr> {
  return {
    async dryRun(constructorLabel, args) {
      const ctor = inkClient.constructor(constructorLabel)
      const response = await provider.dryRunInstantiate(
        args.origin,
        args.value ?? 0n,
        args.options?.gasLimit,
        args.options?.storageDepositLimit,
        Enum("Upload", code),
        ctor.encode(args.data ?? {}),
        args.options?.salt ?? defaultSalt,
      )
      if (response.result.success) {
        const decoded = ctor.decode(response.result.value.result)
        const address = response.result.value.addr

        return mapResult(flattenResult(decoded), {
          value: (value) => ({
            address: mapAddr(address),
            response: value,
            events: inkClient.event.filter(mapAddr(address), response.events),
            gasRequired: response.gas_required,
            storageDeposit: getSignedStorage(response.storage_deposit),
            deploy() {
              return provider.txInstantiateWithCode({
                value: args.value ?? 0n,
                gas_limit: response.gas_required,
                storage_deposit_limit: getStorageLimit(
                  response.storage_deposit,
                ),
                code,
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
    deploy: (constructorLabel, args) =>
      wrapAsyncTx(async () => {
        const ctor = inkClient.constructor(constructorLabel)

        const limits = await (async () => {
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
            Enum("Upload", code),
            ctor.encode(args.data ?? {}),
            args.options?.salt ?? defaultSalt,
          )

          return {
            gas: response.gas_required,
            storage: getStorageLimit(response.storage_deposit),
          }
        })()

        return provider.txInstantiateWithCode({
          value: args.value ?? 0n,
          gas_limit: limits.gas,
          storage_deposit_limit: limits.storage,
          code,
          data: ctor.encode(args.data ?? {}),
          salt: args.options?.salt ?? defaultSalt,
        })
      }),
  }
}
