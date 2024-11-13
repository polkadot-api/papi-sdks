import {
  flattenResult,
  mapResult,
  wrapAsyncTx,
} from "@polkadot-api/common-sdk-utils"
import { type InkClient } from "@polkadot-api/ink-contracts"
import { Binary, Enum } from "polkadot-api"
import type { GenericInkDescriptors, InkSdkTypedApi } from "./descriptor-types"
import type { Deployer } from "./sdk-types"

export function getDeployer<
  T extends InkSdkTypedApi,
  D extends GenericInkDescriptors,
>(typedApi: T, inkClient: InkClient<D>, code: Binary): Deployer<T, D> {
  return {
    async dryRun(constructorLabel, args) {
      const ctor = inkClient.constructor(constructorLabel)
      const response = await typedApi.apis.ContractsApi.instantiate(
        args.origin,
        args.value ?? 0n,
        args.options?.gasLimit,
        args.options?.storageDepositLimit,
        Enum("Upload", code),
        ctor.encode(args.data ?? {}),
        args.options?.salt ?? Binary.fromText(""),
      )
      if (response.result.success) {
        const decoded = ctor.decode(response.result.value.result)
        const address = response.result.value.account_id

        return mapResult(flattenResult(decoded), {
          value: (value) => ({
            address,
            response: value,
            events: inkClient.event.filter(address, response.events),
            gasRequired: response.gas_required,
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

        const gasLimit = await (async () => {
          if ("gasLimit" in args) return args.gasLimit

          const response = await typedApi.apis.ContractsApi.instantiate(
            args.origin,
            args.value ?? 0n,
            undefined,
            args.options?.storageDepositLimit,
            Enum("Upload", code),
            ctor.encode(args.data ?? {}),
            args.options?.salt ?? Binary.fromText(""),
          )

          return response.gas_required
        })()

        return typedApi.tx.Contracts.instantiate_with_code({
          value: args.value ?? 0n,
          gas_limit: gasLimit,
          storage_deposit_limit: args.options?.storageDepositLimit,
          code,
          data: ctor.encode(args.data ?? {}),
          salt: args.options?.salt ?? Binary.fromText(""),
        })
      }),
  }
}
