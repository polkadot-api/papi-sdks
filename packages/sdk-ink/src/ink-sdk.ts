import { getInkClient, getInkLookup } from "@polkadot-api/ink-contracts"
import { Enum, SS58String } from "polkadot-api"
import type {
  GenericInkDescriptors,
  InkSdkTypedApi,
  StorageError,
} from "./descriptor-types"
import { getContract } from "./get-contract"
import { getDeployer } from "./get-deployer"
import { contractsProvider } from "./provider"
import type { InkSdk } from "./sdk-types"

export const createInkSdk = <
  T extends InkSdkTypedApi,
  D extends GenericInkDescriptors,
>(
  typedApi: T,
  contractDescriptors: D,
): InkSdk<T, D, SS58String, StorageError> => {
  const provider = contractsProvider(typedApi)
  const inkClient = getInkClient(contractDescriptors)
  const lookup = getInkLookup(contractDescriptors.metadata)

  return {
    getContract: (address) =>
      getContract(provider, inkClient, lookup, address, (v) => v, address),
    getDeployer: (code) =>
      getDeployer(provider, inkClient, Enum("Upload", code), (v) => v),
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
        contractEvents: inkClient.event.filter(evt.contract, events),
      }))
    },
  }
}
