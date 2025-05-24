import { getInkClient, getInkLookup } from "@polkadot-api/ink-contracts"
import type { GenericInkDescriptors, InkSdkTypedApi } from "./descriptor-types"
import { getContract } from "./get-contract"
import { getDeployer } from "./get-deployer"
import type { InkSdk } from "./sdk-types"
import { contractsProvider } from "./provider"
import { SS58String } from "polkadot-api"

export const createInkSdk = <
  T extends InkSdkTypedApi,
  D extends GenericInkDescriptors,
>(
  typedApi: T,
  contractDescriptors: D,
): InkSdk<T, D, SS58String> => {
  const provider = contractsProvider(typedApi)
  const inkClient = getInkClient(contractDescriptors)
  const lookup = getInkLookup(contractDescriptors.metadata)

  return {
    getContract: (address) =>
      getContract(provider, inkClient, lookup, address, (v) => v),
    getDeployer: (code) => getDeployer(provider, inkClient, code, (v) => v),
    readDeploymentEvents() {
      return null
    },
  }
}
