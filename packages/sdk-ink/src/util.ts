import { RLP } from "@ethereumjs/rlp"
import { Keccak256 } from "@polkadot-api/substrate-bindings"
import {
  AccountId,
  Binary,
  Enum,
  FixedSizeBinary,
  HexString,
  SS58String,
} from "polkadot-api"
import { mergeUint8 } from "polkadot-api/utils"
import { ReviveAddress, ReviveSdkTypedApi, U256 } from "./descriptor-types"

export const getSignedStorage = (
  depositResponse: Enum<{
    Refund: bigint
    Charge: bigint
  }>,
) =>
  depositResponse.type === "Charge"
    ? depositResponse.value
    : -depositResponse.value

export const getStorageLimit = (
  depositResponse: Enum<{
    Refund: bigint
    Charge: bigint
  }>,
) => (depositResponse.type === "Charge" ? depositResponse.value : 0n)

export const ss58ToEthereum = (address: SS58String): Binary =>
  Binary.fromBytes(Keccak256(AccountId().enc(address)).slice(12))

/**
 * @deprecated Use `createInkSdk(client).addressIsMapped(address)` instead.
 */
export const reviveAddressIsMapped = (
  typedApi: ReviveSdkTypedApi,
  address: SS58String,
) =>
  typedApi.query.Revive.OriginalAccount.getValue(ss58ToEthereum(address)).then(
    (r) => r != null,
  )

const u64Range = 2n ** 64n
export const valueToU256 = (value: bigint, nativeToEth: number): U256 => {
  const scaled = value * BigInt(nativeToEth)
  return [
    scaled % u64Range,
    (scaled / u64Range) % u64Range,
    (scaled / u64Range ** 2n) % u64Range,
    (scaled / u64Range ** 3n) % u64Range,
  ]
}
export const u256ToValue = (u256: U256, nativeToEth: number): bigint => {
  const scaled = u256.reduce(
    (acc, value, i) => acc + value * u64Range ** BigInt(i),
    0n,
  )
  return scaled / BigInt(nativeToEth)
}

const parseReviveAddress = (address: SS58String | ReviveAddress | HexString) =>
  typeof address === "string"
    ? address.startsWith("0x")
      ? Binary.fromHex(address)
      : ss58ToEthereum(address)
    : address

// Ported from https://github.com/paritytech/polkadot-sdk/blob/c5ae50f86b8b727428eb86d9b1027a8f56fee19d/substrate/frame/revive/src/address.rs#L233
export const getDeploymentAddressWithNonce = (
  deployer: SS58String | ReviveAddress | HexString,
  nonce: number,
) => {
  const addr = parseReviveAddress(deployer)
  const data = RLP.encode([addr.asBytes(), nonce])
  const bytes = Keccak256(data).slice(12)
  return Binary.fromBytes(bytes)
}

// Ported from https://github.com/paritytech/polkadot-sdk/blob/c5ae50f86b8b727428eb86d9b1027a8f56fee19d/substrate/frame/revive/src/address.rs#L242
export const getDeploymentAddressWithSalt = (
  deployer: SS58String | ReviveAddress | HexString,
  deploymentHash: HexString,
  salt: HexString | FixedSizeBinary<32>,
) => {
  const addr = parseReviveAddress(deployer)
  const saltBin = typeof salt === "string" ? Binary.fromHex(salt) : salt
  const bytes = Keccak256(
    mergeUint8([
      new Uint8Array([0xff]),
      addr.asBytes(),
      saltBin.asBytes(),
      Binary.fromHex(deploymentHash).asBytes(),
    ]),
  ).slice(12)

  return Binary.fromBytes(bytes)
}

export const getDeploymentHash = (code: Binary, inputData: Binary): HexString =>
  Binary.fromBytes(
    Keccak256(mergeUint8(code.asBytes(), inputData.asBytes())),
  ).asHex()
