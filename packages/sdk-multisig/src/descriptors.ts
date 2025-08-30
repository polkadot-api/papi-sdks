import { SdkDefinition } from "@polkadot-api/common-sdk-utils"
import {
  ApisTypedef,
  Binary,
  FixedSizeBinary,
  PalletsTypedef,
  RuntimeDescriptor,
  StorageDescriptor,
  TxCallData,
  TxDescriptor,
  TypedApi,
} from "polkadot-api"

type MultisigSdkPallets<Addr> = PalletsTypedef<
  {
    Multisig: {
      /**
       * The set of open multisig operations.
       */
      Multisigs: StorageDescriptor<
        [Addr, FixedSizeBinary<32>],
        {
          when: {
            height: number
            index: number
          }
          approvals: Array<Addr>
        },
        true,
        never
      >
    }
  },
  {
    Multisig: {
      as_multi_threshold_1: TxDescriptor<{
        other_signatories: Addr[]
        call: TxCallData
      }>
      as_multi: TxDescriptor<{
        threshold: number
        other_signatories: Addr[]
        maybe_timepoint?:
          | {
              index: number
              height: number
            }
          | undefined
        call: TxCallData
        max_weight: {
          ref_time: bigint
          proof_size: bigint
        }
      }>
      approve_as_multi: TxDescriptor<{
        threshold: number
        other_signatories: Addr[]
        maybe_timepoint?:
          | {
              index: number
              height: number
            }
          | undefined
        call_hash: FixedSizeBinary<32>
        max_weight: {
          ref_time: bigint
          proof_size: bigint
        }
      }>
    }
  },
  {},
  {},
  {},
  {}
>

type MultisigSdkApis = ApisTypedef<{
  TransactionPaymentApi: {
    query_info: RuntimeDescriptor<
      [uxt: Binary, len: number],
      {
        weight: {
          ref_time: bigint
          proof_size: bigint
        }
      }
    >
  }
}>

type MultisigSdkDefinition<Addr> = SdkDefinition<
  MultisigSdkPallets<Addr>,
  MultisigSdkApis
>
export type MultisigSdkTypedApi<Addr> = TypedApi<MultisigSdkDefinition<Addr>>
