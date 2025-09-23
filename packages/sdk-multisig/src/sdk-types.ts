import { AsyncTransaction } from "@polkadot-api/common-sdk-utils"
import {
  Binary,
  HexString,
  PolkadotClient,
  PolkadotSigner,
  SS58String,
  Transaction,
} from "polkadot-api"

export interface MultisigAccount<Addr> {
  signatories: Addr[]
  threshold: number
}

export interface MultisigTxOptions<Addr> {
  method: (
    approvals: Array<Addr>,
    threshold: number,
  ) => "as_multi" | "approve_as_multi"
}

export interface CreateMultisigSdk {
  <AType extends "ss58" | "acc20" = "ss58">(
    client: PolkadotClient,
    addrType?: AType,
  ): MultisigSdk<AType extends "acc20" ? HexString : SS58String>
}

export interface MultisigSdk<Addr> {
  getMultisigTx(
    multisig: MultisigAccount<Addr>,
    signatory: Addr,
    txOrCallData: Transaction<any, any, any, any> | Binary,
    options?: MultisigTxOptions<Addr>,
  ): AsyncTransaction<any, any, any, any>
  getMultisigSigner(
    multisig: MultisigAccount<Addr>,
    signer: PolkadotSigner,
    options?: MultisigTxOptions<Addr>,
  ): PolkadotSigner
}
