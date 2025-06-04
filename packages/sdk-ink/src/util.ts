import { keccak_256 } from "@noble/hashes/sha3"
import { AccountId, Binary, Enum, SS58String } from "polkadot-api"
import { U256 } from "./descriptor-types"

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
