import { AccountId, Binary, Enum, HexString } from "polkadot-api"
import { mergeUint8 } from "polkadot-api/utils"
import type {
  GenericInkDescriptors,
  ReviveSdkTypedApi,
  ReviveStorageError,
} from "./descriptor-types"
import { inkEncoding, solEncoding } from "./encoding-provider"
import { getContract } from "./get-contract"
import { getDeployer } from "./get-deployer"
import { reviveProvider } from "./provider"
import {
  AllTypedApis,
  defaultOptions,
  type InkSdkOptions,
  type ReviveSdk,
} from "./sdk-types"
import { ss58ToEthereum } from "./util"

/**
 * @deprecated Use `createInkSdk(client)` instead.
 */
export const createReviveSdk = <
  T extends ReviveSdkTypedApi,
  D extends GenericInkDescriptors,
>(
  typedApi: T,
  contractDescriptors: D,
  options?: Partial<InkSdkOptions>,
): ReviveSdk<T, D, HexString, ReviveStorageError> => {
  const { atBest } = { ...defaultOptions, ...options }
  const provider = reviveProvider(
    {
      passet: typedApi,
      pasAh: typedApi,
      wndAh: typedApi,
    } as any as AllTypedApis,
    atBest,
  )
  const encodingProvider = contractDescriptors.metadata
    ? inkEncoding(contractDescriptors)
    : solEncoding(contractDescriptors)

  return {
    getContract: (address) =>
      getContract(
        provider,
        encodingProvider,
        Binary.fromHex(address),
        (v) => v.asHex(),
        getAccountId(address),
      ),
    getDeployer: (code) =>
      getDeployer(provider, encodingProvider, Enum("Upload", code), (v) =>
        v.asHex(),
      ),
    readDeploymentEvents(events) {
      // Contract.Instantiated event not available yet in pallet-revive
      // but we can find events if the contract emits something on deploy

      const contractEmittedEvents =
        events?.filter(
          (evt) =>
            evt.type === "Revive" &&
            (evt.value as any).type === "ContractEmitted",
        ) ?? []
      const contractAddresses = Array.from(
        new Set<string>(
          contractEmittedEvents
            .map((evt) => (evt as any).value.value?.contract?.asHex?.())
            .filter((v) => !!v),
        ),
      )

      return contractAddresses.map((address) => ({
        address,
        contractEvents: encodingProvider.filterEvents(
          address,
          contractEmittedEvents,
        ),
      }))
    },
    addressIsMapped: (address) =>
      typedApi.query.Revive.OriginalAccount.getValue(
        ss58ToEthereum(address),
        atBest ? { at: "best" } : {},
      ).then((r) => r != null),
  }
}

export const getAccountId = (address: HexString) => {
  const publicKey = mergeUint8([
    Binary.fromHex(address).asBytes(),
    new Uint8Array(new Array(32 - 20).fill(0xee)),
  ])

  return AccountId().dec(publicKey)
}
