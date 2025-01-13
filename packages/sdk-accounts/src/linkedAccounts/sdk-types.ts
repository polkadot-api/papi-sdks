import { SS58String } from "polkadot-api"
import { Observable } from "rxjs"

export type LinkedAccountsResult =
  | {
      type: "root"
    }
  | {
      type: "proxy"
      value: {
        addresses: SS58String[]
      }
    }
  | {
      type: "multisig"
      value: {
        threshold: number
        addresses: SS58String[]
      }
    }

export type NestedLinkedAccountsResult =
  | {
      type: "root"
    }
  | {
      type: "proxy"
      value: {
        accounts: Array<{
          address: SS58String
          linkedAccounts: NestedLinkedAccountsResult | null
        }>
      }
    }
  | {
      type: "multisig"
      value: {
        threshold: number
        accounts: Array<{
          address: SS58String
          linkedAccounts: NestedLinkedAccountsResult | null
        }>
      }
    }

export interface LinkedAccountsSdk {
  getLinkedAccounts$: (address: SS58String) => Observable<LinkedAccountsResult>
  getNestedLinkedAccounts$: (
    address: SS58String,
  ) => Observable<NestedLinkedAccountsResult>
}

export type MultisigProvider = (address: SS58String) => Promise<{
  addresses: SS58String[]
  threshold: number
} | null>
