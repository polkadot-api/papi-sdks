import { getInkClient, getInkLookup } from "@polkadot-api/ink-contracts"
import type { GenericInkDescriptors, InkSdkTypedApi } from "./descriptor-types"
import { getContract } from "./get-contract"
import { getDeployer } from "./get-deployer"
import type { InkSdk } from "./sdk-types"

export const createInkSdk = <
  T extends InkSdkTypedApi,
  D extends GenericInkDescriptors,
>(
  typedApi: T,
  contractDescriptors: D,
): InkSdk<T, D> => {
  const inkClient = getInkClient(contractDescriptors)
  const lookup = getInkLookup(contractDescriptors.metadata)

  return {
    getContract: (address) => getContract(typedApi, inkClient, lookup, address),
    getDeployer: (code) => getDeployer(typedApi, inkClient, code),
    readDeploymentEvents() {
      return null
    },
  }
}
