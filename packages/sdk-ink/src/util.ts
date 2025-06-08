import { keccak_256 } from "@noble/hashes/sha3"
import {
  AccountId,
  Binary,
  Enum,
  FixedSizeBinary,
  HexString,
  SS58String,
} from "polkadot-api"
import { ReviveAddress, U256 } from "./descriptor-types"
import { mergeUint8 } from "polkadot-api/utils"

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

export const ss58ToEthereum = (address: SS58String) =>
  Binary.fromBytes(keccak_256(AccountId().enc(address)).slice(12))

const u64Range = 2n ** 64n
export const valueToU256 = (value: bigint): U256 => [
  value % u64Range,
  (value / u64Range) % u64Range,
  (value / u64Range ** 2n) % u64Range,
  (value / u64Range ** 3n) % u64Range,
]

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
): HexString => {
  const addr = parseReviveAddress(deployer)
  const hexNonce = nonce.toString(16)
  const nonceBinary = Binary.fromHex(
    hexNonce.length % 2 === 0 ? hexNonce : "0" + hexNonce,
  )
  const data = mergeUint8(addr.asBytes(), nonceBinary.asBytes())
  const bytes = keccak_256(data).slice(12)
  return Binary.fromBytes(bytes).asHex()
}

// Ported from https://github.com/paritytech/polkadot-sdk/blob/c5ae50f86b8b727428eb86d9b1027a8f56fee19d/substrate/frame/revive/src/address.rs#L242
export const getDeploymentAddressWithSalt = (
  deployer: SS58String | ReviveAddress | HexString,
  deploymentHash: HexString,
  salt: HexString | FixedSizeBinary<32>,
): HexString => {
  const addr = parseReviveAddress(deployer)
  const saltBin = typeof salt === "string" ? Binary.fromHex(salt) : salt
  const bytes = mergeUint8(
    new Uint8Array([0xff]),
    addr.asBytes(),
    saltBin.asBytes(),
    Binary.fromHex(deploymentHash).asBytes(),
  ).slice(12)

  return Binary.fromBytes(bytes).asHex()
}

export const getDeploymentHash = (code: Binary, inputData: Binary): HexString =>
  Binary.fromBytes(
    keccak_256(mergeUint8(code.asBytes(), inputData.asBytes())),
  ).asHex()
