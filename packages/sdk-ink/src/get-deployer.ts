import {
  flattenResult,
  mapResult,
  wrapAsyncTx,
} from "@polkadot-api/common-sdk-utils"
import { type InkClient } from "@polkadot-api/ink-contracts"
import { Binary, Enum, FixedSizeBinary } from "polkadot-api"
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
  code: Enum<{
    Upload: Binary
    Existing: Promise<FixedSizeBinary<32>>
  }>,
  mapAddr: (v: Addr) => PublicAddr,
): Deployer<T, D, PublicAddr> {
  const deployer: Deployer<T, D, PublicAddr> = {
    async dryRun(constructorLabel, args) {
      const ctor = inkClient.constructor(constructorLabel)
      const value = args.value ?? 0n
      const data = ctor.encode(args.data ?? {})
      const salt = args.options?.salt ?? defaultSalt

      const response = await provider.dryRunInstantiate(
        args.origin,
        value,
        args.options?.gasLimit,
        args.options?.storageDepositLimit,
        code.type === "Existing" ? Enum("Existing", await code.value) : code,
        data,
        salt,
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
              const limitParams = {
                gasLimit: response.gas_required,
                storageDepositLimit: getStorageLimit(response.storage_deposit),
              }
              return deployer.deploy(constructorLabel, {
                ...args,
                ...limitParams,
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
            code.type === "Existing"
              ? Enum("Existing", await code.value)
              : code,
            ctor.encode(args.data ?? {}),
            args.options?.salt ?? defaultSalt,
          )

          return {
            gas: response.gas_required,
            storage: getStorageLimit(response.storage_deposit),
          }
        })()

        const params = {
          value: args.value ?? 0n,
          gas_limit: limits.gas,
          storage_deposit_limit: limits.storage,
          data: ctor.encode(args.data ?? {}),
          salt: args.options?.salt ?? defaultSalt,
        }

        return code.type === "Upload"
          ? provider.txInstantiateWithCode({
              ...params,
              code: code.value,
            })
          : provider.txInstantiate({
              ...params,
              code_hash: await code.value,
            })
      }),
  }

  return deployer
}
