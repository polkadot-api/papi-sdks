import { SdkDefinition } from "@polkadot-api/common-sdk-utils"
import {
  ApisTypedef,
  PalletsTypedef,
  SS58String,
  StorageDescriptor,
  TypedApi,
} from "polkadot-api"

type LinkedAccountsSdkPallets = PalletsTypedef<
  {
    Proxy: {
      /**
       * The set of account proxies. Maps the account which has delegated to the accounts
       * which are being delegated to, together with the amount held on deposit.
       */
      Proxies: StorageDescriptor<
        [Key: SS58String],
        [
          Array<{
            delegate: SS58String
            proxy_type: { type: string; value: unknown }
            delay: number
          }>,
          unknown,
        ],
        false,
        never
      >
    }
  },
  {},
  {},
  {},
  {},
  {}
>
type LinkedAccountsSdkDefinition = SdkDefinition<
  LinkedAccountsSdkPallets,
  ApisTypedef<{}>
>
export type LinkedAccountsSdkTypedApi = TypedApi<LinkedAccountsSdkDefinition>
