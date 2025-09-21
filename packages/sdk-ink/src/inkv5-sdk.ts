import { Enum, SS58String } from "polkadot-api"
import type {
  GenericInkDescriptors,
  InkSdkTypedApi,
  StorageError,
} from "./descriptor-types"
import { inkEncoding } from "./encoding-provider"
import { getContract } from "./get-contract"
import { getDeployer } from "./get-deployer"
import { contractsProvider } from "./provider"
import { defaultOptions, type InkSdk, type InkSdkOptions } from "./sdk-types"

export const createInkV5Sdk = <
  T extends InkSdkTypedApi,
  D extends GenericInkDescriptors,
>(
  typedApi: T,
  contractDescriptors: D,
  options?: Partial<InkSdkOptions>,
): InkSdk<T, D, SS58String, StorageError> => {
  const { atBest } = { ...defaultOptions, ...options }

  const provider = contractsProvider(typedApi, atBest)
  const encodingProvider = inkEncoding(contractDescriptors)

  return {
    getContract: (address) =>
      getContract(provider, encodingProvider, address, (v) => v, address),
    getDeployer: (code) =>
      getDeployer(provider, encodingProvider, Enum("Upload", code), (v) => v),
    readDeploymentEvents(events) {
      const instantiatedEvents =
        events
          ?.filter(
            (evt) =>
              evt.type === "Contracts" &&
              (evt.value as any).type === "Instantiated",
          )
          .map(
            (v) =>
              (v.value as any).value as {
                deployer: string
                contract: string
              },
          ) ?? []

      return instantiatedEvents.map((evt) => ({
        address: evt.contract,
        contractEvents: encodingProvider.filterEvents(evt.contract, events),
      }))
    },
  }
}
