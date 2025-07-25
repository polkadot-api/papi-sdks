import {
  flattenResult,
  mapResult,
  wrapAsyncTx,
} from "@polkadot-api/common-sdk-utils"
import type { InkClient, InkMetadataLookup } from "@polkadot-api/ink-contracts"
import { Binary, compactNumber } from "@polkadot-api/substrate-bindings"
import { Enum, SS58String } from "polkadot-api"
import type {
  GenericInkDescriptors,
  InkSdkTypedApi,
  ReviveSdkTypedApi,
} from "./descriptor-types"
import { getDeployer } from "./get-deployer"
import { getStorage } from "./get-storage"
import { ContractsProvider } from "./provider"
import type { Contract } from "./sdk-types"
import { getSignedStorage, getStorageLimit } from "./util"

export function getContract<
  T extends InkSdkTypedApi | ReviveSdkTypedApi,
  Addr,
  StorageErr,
  D extends GenericInkDescriptors,
  PublicAddr extends string,
>(
  provider: ContractsProvider<Addr, StorageErr>,
  inkClient: InkClient<D>,
  lookup: InkMetadataLookup,
  address: Addr,
  mapAddr: (v: Addr) => PublicAddr,
  accountId: SS58String,
): Contract<T, D, PublicAddr, StorageErr> {
  const codeHash = provider.getCodeHash(address).then((r) => {
    if (!r) {
      throw new Error(`Contract ${mapAddr(address)} not found`)
    }
    return r
  })

  const deployer = getDeployer(
    provider,
    inkClient,
    Enum("Existing", codeHash),
    mapAddr,
  )

  const contractApi: Contract<T, D, PublicAddr, StorageErr> = {
    accountId,
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
        const availableData = {
          events: inkClient.event.filter(mapAddr(address), response.events),
          gasRequired: response.gas_required,
          storageDeposit: getSignedStorage(response.storage_deposit),
          send: () => {
            const limitParams = {
              gasLimit: response.gas_required,
              storageDepositLimit: getStorageLimit(response.storage_deposit),
            }
            return contractApi.send(message, {
              ...args,
              ...limitParams,
            })
          },
        }

        // In case REVERT flag is set, it might return a string with the error message or debug info.
        if (response.result.value.flags & 0x01) {
          const data = response.result.value.data
          // In case of panic! or return_value(REVERT, &"some message"), the value comes back as an opaque string
          // Meaning what we get over the wire is [payload_len,data]
          // And `data` is a Vec<u8>, hence [msg_len,...chars]. In this case, the msg_len is redundant.
          const decodeMessage = () => {
            try {
              const bytes = data.asBytes()
              const length = compactNumber.dec(bytes)
              const compactLength = compactNumber.enc(length).length
              if (compactLength + length === bytes.length) {
                return Binary.fromBytes(bytes.slice(compactLength)).asText()
              }
            } catch {}
            return data.asHex()
          }
          return {
            success: false,
            value: {
              type: "FlagReverted",
              value: {
                ...availableData,
                message: decodeMessage(),
                raw: response.result.value.data,
              },
            },
          }
        }

        const decoded = msg.decode(response.result.value)
        return mapResult(flattenResult(decoded), {
          value: (innerResponse) => ({
            response: innerResponse,
            ...availableData,
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
    dryRunRedeploy: deployer.dryRun,
    redeploy: deployer.deploy,
    filterEvents(events) {
      return inkClient.event.filter(mapAddr(address), events)
    },
  }

  return contractApi
}
