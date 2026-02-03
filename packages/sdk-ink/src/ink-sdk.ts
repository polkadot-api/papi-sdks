import {
  AccountId,
  Binary,
  Enum,
  HexString,
  PolkadotClient,
  SizedHex,
} from "polkadot-api"
import { mergeUint8 } from "polkadot-api/utils"
import { pasAh, passet, wndAh } from "../.papi/descriptors/dist"
import { GenericInkDescriptors } from "./descriptor-types"
import { EncodingProvider, inkEncoding, solEncoding } from "./encoding-provider"
import { getContract } from "./get-contract"
import { getDeployer } from "./get-deployer"
import { reviveProvider } from "./provider"
import {
  AllTypedApis,
  ContractSdk,
  defaultOptions,
  DeployerSdk,
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
  ): ContractSdk<D> => {
    return getContract(
      provider,
      encodingProvider,
      address,
      getAccountId(address),
    )
  }

  const getDeployerSdk = <D extends GenericInkDescriptors>(
    contractDescriptors: D,
    code: Uint8Array,
  ): DeployerSdk<D> => {
    const encodingProvider = contractDescriptors.metadata
      ? inkEncoding(contractDescriptors)
      : solEncoding(contractDescriptors)

    return getDeployer(provider, encodingProvider, Enum("Upload", code))
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
              evt.event.type === "Revive" &&
              (evt.event.value as any).type === "Instantiated",
          )
          .map(
            (v) =>
              (v.event.value as any).value as {
                deployer: SizedHex<20>
                contract: SizedHex<20>
              },
          ) ?? []

      return instantiatedEvents.map((evt) => ({
        address: evt.contract,
        contractEvents: encodingProvider.filterEvents(evt.contract, events),
      }))
    },
  }
}

const getAccountId = (address: HexString) => {
  const publicKey = mergeUint8([
    Binary.fromHex(address),
    new Uint8Array(new Array(32 - 20).fill(0xee)),
  ])

  return AccountId().dec(publicKey)
}
