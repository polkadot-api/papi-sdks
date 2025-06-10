import { getInkClient, getInkLookup } from "@polkadot-api/ink-contracts"
import { AccountId, Binary, Enum, HexString } from "polkadot-api"
import { mergeUint8 } from "polkadot-api/utils"
import type {
  GenericInkDescriptors,
  ReviveSdkTypedApi,
  ReviveStorageError,
} from "./descriptor-types"
import { getContract } from "./get-contract"
import { getDeployer } from "./get-deployer"
import { reviveProvider } from "./provider"
import type { ReviveSdk } from "./sdk-types"
import { ss58ToEthereum } from "./util"

export const createReviveSdk = <
  T extends ReviveSdkTypedApi,
  D extends GenericInkDescriptors,
>(
  typedApi: T,
  contractDescriptors: D,
): ReviveSdk<T, D, HexString, ReviveStorageError> => {
  const provider = reviveProvider(typedApi)
  const inkClient = getInkClient(contractDescriptors)
  const lookup = getInkLookup(contractDescriptors.metadata)

  return {
    getContract: (address) =>
      getContract(
        provider,
        inkClient,
        lookup,
        Binary.fromHex(address),
        (v) => v.asHex(),
        getAccountId(address),
      ),
    getDeployer: (code) =>
      getDeployer(provider, inkClient, Enum("Upload", code), (v) => v.asHex()),
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
        contractEvents: inkClient.event.filter(address, contractEmittedEvents),
      }))
    },
    addressIsMapped: (address) =>
      typedApi.query.Revive.OriginalAccount.getValue(
        ss58ToEthereum(address),
      ).then((r) => r != null),
  }
}

const getAccountId = (address: HexString) => {
  const publicKey = mergeUint8([
    Binary.fromHex(address).asBytes(),
    new Uint8Array(new Array(32 - 20).fill(0xee)),
  ])

  return AccountId().dec(publicKey)
}
