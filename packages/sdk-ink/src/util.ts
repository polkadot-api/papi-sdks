import { RLP } from "@ethereumjs/rlp"
import { Keccak256, SizedHex } from "@polkadot-api/substrate-bindings"
import {
  AccountId,
  Binary,
  Enum,
  FixedSizeArray,
  HexString,
  SS58String,
} from "polkadot-api"
import { mergeUint8 } from "polkadot-api/utils"
import { CommonTypedApi } from "./sdk-types"

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

export const ss58ToEthereum = (address: SS58String): SizedHex<20> =>
  Binary.toHex(Keccak256(AccountId().enc(address)).slice(12))

export const reviveAddressIsMapped = (
  typedApi: CommonTypedApi,
  address: SS58String,
) =>
  typedApi.query.Revive.OriginalAccount.getValue(ss58ToEthereum(address)).then(
    (r) => r != null,
  )

// TODO update to new format
export type U256 = FixedSizeArray<4, bigint>
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

const parseReviveAddress = (address: SS58String | SizedHex<20>) =>
  Binary.fromHex(address.startsWith("0x") ? address : ss58ToEthereum(address))

// Ported from https://github.com/paritytech/polkadot-sdk/blob/c5ae50f86b8b727428eb86d9b1027a8f56fee19d/substrate/frame/revive/src/address.rs#L233
export const getDeploymentAddressWithNonce = (
  deployer: SS58String | SizedHex<20>,
  nonce: number,
) => {
  const addr = parseReviveAddress(deployer)
  const data = RLP.encode([addr, nonce])
  const bytes = Keccak256(data).slice(12)
  return Binary.toHex(bytes)
}

// Ported from https://github.com/paritytech/polkadot-sdk/blob/c5ae50f86b8b727428eb86d9b1027a8f56fee19d/substrate/frame/revive/src/address.rs#L242
export const getDeploymentAddressWithSalt = (
  deployer: SS58String | SizedHex<20>,
  deploymentHash: SizedHex<32>,
  salt: SizedHex<32>,
) => {
  const addr = parseReviveAddress(deployer)
  const saltBin = typeof salt === "string" ? Binary.fromHex(salt) : salt
  const bytes = Keccak256(
    mergeUint8([
      new Uint8Array([0xff]),
      addr,
      saltBin,
      Binary.fromHex(deploymentHash),
    ]),
  ).slice(12)

  return Binary.toHex(bytes)
}

export const getDeploymentHash = (
  code: Uint8Array,
  inputData: Uint8Array,
): HexString => Binary.toHex(Keccak256(mergeUint8([code, inputData])))
