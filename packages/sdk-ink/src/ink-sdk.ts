import { Binary, Enum, HexString, PolkadotClient } from "polkadot-api"
import { pasAh, passet, wndAh } from "../.papi/descriptors/dist"
import { GenericInkDescriptors, ReviveStorageError } from "./descriptor-types"
import { EncodingProvider, inkEncoding, solEncoding } from "./encoding-provider"
import { getContract } from "./get-contract"
import { getDeployer } from "./get-deployer"
import { reviveProvider } from "./provider"
import { getAccountId } from "./revive-sdk"
import {
  AllTypedApis,
  CommonTypedApi,
  Contract,
  defaultOptions,
  Deployer,
  GetContract,
  InkSdk,
  InkSdkOptions,
} from "./sdk-types"
import { reviveAddressIsMapped } from "./util"

export const createInkSdk = (
  client: PolkadotClient,
  options?: Partial<InkSdkOptions>,
): InkSdk => {
  const typedApi: AllTypedApis = {
    passet: client.getTypedApi(passet),
    pasAh: client.getTypedApi(pasAh),
    wndAh: client.getTypedApi(wndAh),
  }

  const { atBest } = { ...defaultOptions, ...options }
  const provider = reviveProvider(typedApi, atBest)

  const getContractSdk = <D extends GenericInkDescriptors>(
    encodingProvider: EncodingProvider,
    address: HexString,
  ): Contract<CommonTypedApi, D, HexString, ReviveStorageError> => {
    return getContract(
      provider,
      encodingProvider,
      Binary.fromHex(address),
      (v) => v.asHex(),
      getAccountId(address),
    )
  }

  const getDeployerSdk = <D extends GenericInkDescriptors>(
    contractDescriptors: D,
    code: Binary,
  ): Deployer<CommonTypedApi, D, HexString> => {
    const encodingProvider = contractDescriptors.metadata
      ? inkEncoding(contractDescriptors)
      : solEncoding(contractDescriptors)

    return getDeployer(provider, encodingProvider, Enum("Upload", code), (v) =>
      v.asHex(),
    )
  }

  const curriedGetContract: GetContract = ((
    contractDescriptors,
    address?: HexString,
  ) => {
    const encodingProvider = contractDescriptors.metadata
      ? inkEncoding(contractDescriptors)
      : solEncoding(contractDescriptors)

    if (address == null) {
      return (address: HexString) => getContractSdk(encodingProvider, address)
    }
    return getContractSdk(encodingProvider, address)
  }) as GetContract

  return {
    addressIsMapped(address) {
      return reviveAddressIsMapped(typedApi.passet, address)
    },
    getContract: curriedGetContract,
    getDeployer: getDeployerSdk,
    readDeploymentEvents: (contractDescriptors, events) => {
      const encodingProvider = contractDescriptors.metadata
        ? inkEncoding(contractDescriptors)
        : solEncoding(contractDescriptors)

      const instantiatedEvents =
        events
          ?.filter(
            (evt) =>
              evt.type === "Revive" &&
              (evt.value as any).type === "Instantiated",
          )
          .map(
            (v) =>
              (v.value as any).value as {
                deployer: Binary
                contract: Binary
              },
          ) ?? []

      return instantiatedEvents.map((evt) => ({
        address: evt.contract.asHex(),
        contractEvents: encodingProvider.filterEvents(
          evt.contract.asHex(),
          events,
        ),
      }))
    },
  }
}
