import { wrapAsyncTx } from "@polkadot-api/common-sdk-utils"
import {
  Binary,
  Blake2256,
  getMultisigAccountId,
  getSs58AddressInfo,
  HexString,
  sortMultisigSignatories,
  SS58String,
} from "@polkadot-api/substrate-bindings"
import { AccountId, Transaction } from "polkadot-api"
import { fromHex, toHex } from "polkadot-api/utils"
import { dot, moonbeam } from "../.papi/descriptors/dist"
import { CreateMultisigSdk, MultisigSdk, MultisigTxOptions } from "./sdk-types"

const defaultMultisigTxOptions: MultisigTxOptions<unknown> = {
  method: (approvals, threshold) =>
    approvals.length === threshold - 1 ? "as_multi" : "approve_as_multi",
}

export const createMultisigSdk: CreateMultisigSdk = (client, addrType) => {
  type Addr = typeof addrType extends "acc20" ? HexString : SS58String
  const isAddr20 = addrType === "acc20"

  const ss58Api = client.getTypedApi(dot)
  const addr20Api = client.getTypedApi(moonbeam)
  const activeApi = isAddr20 ? addr20Api : ss58Api

  const toSS58 = AccountId().dec

  const getMultisigTx: MultisigSdk<Addr>["getMultisigTx"] = (
    multisig,
    signatory,
    txOrCallData,
    options,
  ) => {
    options = {
      ...defaultMultisigTxOptions,
      ...options,
    }

    const toAddress = (value: Uint8Array): Addr => {
      if (isAddr20) {
        return toHex(value) as Addr
      }
      return toSS58(value) as Addr
    }

    const pubKeys = sortMultisigSignatories(
      multisig.signatories.map(getPublicKey),
    )
    const multisigId = getMultisigAccountId({
      threshold: multisig.threshold,
      signatories: pubKeys,
    })

    const signatoryId = getPublicKey(signatory)
    const otherSignatories = pubKeys.filter(
      (addr) => !u8ArrEq(addr, signatoryId),
    )
    if (otherSignatories.length === multisig.signatories.length) {
      throw new Error("Signer is not one of the signatories of the multisig")
    }

    return wrapAsyncTx(async () => {
      const [tx, callData] =
        "getEncodedData" in txOrCallData
          ? [txOrCallData, await txOrCallData.getEncodedData()]
          : [await activeApi.txFromCallData(txOrCallData), txOrCallData]

      if (multisig.threshold === 1) {
        return activeApi.tx.Multisig.as_multi_threshold_1({
          other_signatories: otherSignatories.map(toAddress),
          call: tx.decodedCall,
        })
      }

      const callHash = Blake2256(callData.asBytes())
      const [multisigInfo, weightInfo] = await Promise.all([
        activeApi.query.Multisig.Multisigs.getValue(
          toAddress(multisigId),
          Binary.fromBytes(callHash),
        ),
        tx.getPaymentInfo(signatoryId),
      ])

      if (
        multisigInfo?.approvals.some((approval) =>
          u8ArrEq(getPublicKey(approval), signatoryId),
        )
      ) {
        throw new Error("Multisig call already approved by signer")
      }

      const method = options.method(
        multisigInfo?.approvals ?? [],
        multisig.threshold,
      )

      const commonPayload = {
        threshold: multisig.threshold,
        other_signatories: otherSignatories.map(toAddress),
        max_weight: weightInfo.weight,
        maybe_timepoint: multisigInfo?.when,
      }

      const wrappedTx: Transaction<any, any, any, any> =
        method === "approve_as_multi"
          ? activeApi.tx.Multisig.approve_as_multi({
              ...commonPayload,
              call_hash: Binary.fromBytes(callHash),
            })
          : activeApi.tx.Multisig.as_multi({
              ...commonPayload,
              call: tx.decodedCall,
            })

      return wrappedTx
    })
  }

  return {
    getMultisigTx,
    getMultisigSigner(multisig, signer, options) {
      const pubKeys = sortMultisigSignatories(
        multisig.signatories.map(getPublicKey),
      )
      const multisigId = getMultisigAccountId({
        threshold: multisig.threshold,
        signatories: pubKeys,
      })

      const toAddress = (value: Uint8Array): Addr => {
        if (multisig.signatories[0].startsWith("0x")) {
          return toHex(value) as Addr
        }
        return toSS58(value) as Addr
      }

      const signerId =
        "accountId" in signer
          ? (signer.accountId as Uint8Array)
          : signer.publicKey

      return {
        publicKey: signer.publicKey,
        accountId: multisigId,
        signBytes() {
          throw new Error("Raw bytes can't be signed with a multisig")
        },
        async signTx(
          callData,
          signedExtensions,
          metadata,
          atBlockNumber,
          hasher,
        ) {
          const tx = await activeApi.txFromCallData(Binary.fromBytes(callData))
          const wrappedTx = getMultisigTx(
            multisig,
            toAddress(signerId),
            tx,
            options,
          )

          return signer.signTx(
            (await wrappedTx.getEncodedData()).asBytes(),
            signedExtensions,
            metadata,
            atBlockNumber,
            hasher,
          )
        },
      }
    },
  }
}

const u8ArrEq = (a: Uint8Array, b: Uint8Array) => {
  if (a.length !== b.length) return false
  return a.every((v, i) => v === b[i])
}

const getPublicKey = (addr: SS58String | HexString) => {
  if (addr.startsWith("0x")) {
    return fromHex(addr)
  }
  const info = getSs58AddressInfo(addr)
  if (!info.isValid) {
    throw new Error(`Invalid SS58 address ${addr}`)
  }
  return info.publicKey
}
