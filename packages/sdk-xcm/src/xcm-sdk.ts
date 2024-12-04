import { pas } from "@polkadot-api/descriptors"
import { TypedApi } from "polkadot-api"
import { noop } from "polkadot-api/utils"

export const createXcmSdk = <T extends TypedApi<typeof pas>>(api: T) => {
  return {
    createTeleport: noop,
  }
}
