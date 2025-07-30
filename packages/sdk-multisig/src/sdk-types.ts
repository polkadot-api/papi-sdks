import { AsyncTransaction } from "@polkadot-api/common-sdk-utils"
import { PolkadotSigner, Transaction } from "polkadot-api"

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

export interface MultisigSdk<Addr> {
  getMultisigTx(
    multisig: MultisigAccount<Addr>,
    signatory: Addr,
    tx: Transaction<any, any, any, any>,
    options?: MultisigTxOptions<Addr>,
  ): AsyncTransaction<any, any, any, any>
  getMultisigSigner(
    multisig: MultisigAccount<Addr>,
    signer: PolkadotSigner,
    options?: MultisigTxOptions<Addr>,
  ): PolkadotSigner
}
