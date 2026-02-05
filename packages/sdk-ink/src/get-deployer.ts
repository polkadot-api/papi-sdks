import {
  flattenResult,
  FlattenValues,
  mapResult,
  wrapAsyncTx,
} from "@polkadot-api/common-sdk-utils"
import { SizedHex } from "@polkadot-api/substrate-bindings"
import { Enum } from "polkadot-api"
import type { GenericInkDescriptors } from "./descriptor-types"
import { EncodingProvider } from "./encoding-provider"
import { ContractsProvider } from "./provider"
import type { DeployerSdk } from "./sdk-types"
import { getSignedStorage, getStorageLimit } from "./util"

export function getDeployer<D extends GenericInkDescriptors>(
  provider: ContractsProvider,
  encodingProvider: EncodingProvider,
  code: Enum<{
    Upload: Uint8Array
    Existing: Promise<SizedHex<32>>
  }>,
): DeployerSdk<D> {
  const loadedCode = async (): Promise<
    Enum<{
      Upload: Uint8Array
      Existing: SizedHex<32>
    }>
  > =>
    code.type === "Upload"
      ? code
      : {
          type: "Existing",
          value: await code.value,
        }

  const deployer: DeployerSdk<D> = {
    async dryRun(constructorLabel, args) {
      const ctor = encodingProvider.constructor(constructorLabel)
      const value = args.value ?? 0n
      const data = ctor.encode(args.data ?? {})

      const response = await provider.dryRunInstantiate(
        args.origin,
        value,
        args.options?.gasLimit,
        args.options?.storageDepositLimit,
        code.type === "Existing" ? Enum("Existing", await code.value) : code,
        data,
        args.options?.salt,
      )
      if (response.result.success) {
        const decoded = ctor.decode(
          response.result.value.result.data,
        ) as FlattenValues<
          D["__types"]["messages"][typeof constructorLabel]["response"]
        >
        const address = response.result.value.addr

        return mapResult(flattenResult(decoded), {
          value: (value) => ({
            address,
            response: value,
            events: encodingProvider.filterEvents(address, response.events),
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
        const ctor = encodingProvider.constructor(constructorLabel)

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
            args.options?.salt,
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
          salt: args.options?.salt,
        }

        return code.type === "Upload"
          ? provider.txInstantiateWithCode({
              ...params,
              code: code.value,
            }).waited
          : provider.txInstantiate({
              ...params,
              code_hash: await code.value,
            }).waited
      }),
    estimateAddress: async (constructorLabel, args) => {
      const ctor = encodingProvider.constructor(constructorLabel)
      const data = ctor.encode(args.data ?? {})

      const addr = await provider.getEstimatedAddress(
        args.origin,
        args.value ?? 0n,
        await loadedCode(),
        data,
        args.salt,
        args.nonce,
      )
      return addr
    },
  }

  return deployer
}
