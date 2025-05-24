import { Enum } from "polkadot-api"

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
