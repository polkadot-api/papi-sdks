import { getMultisigSigner } from "@polkadot-api/meta-signers"
import {
  Binary,
  Enum,
  HexString,
  PolkadotClient,
  PolkadotSigner,
  SS58String,
} from "polkadot-api"
import { ksmAh } from "./descriptors"
import { createGetProof } from "./get-proof-data"
import { mortal } from "./mortal"
import { fromHex } from "polkadot-api/utils"

const TERMINAL_MULTSIGS = new Set(["as_multi", "as_multi_threshold_1"])
export type MultisigConfig = {
  threshold: number
  signatories: Array<SS58String | HexString>
}
export const createMultisigProxiedSigner = (
  parachainClient: PolkadotClient,
  getProof: ReturnType<typeof createGetProof>,
) => {
  const paraApi = parachainClient.getTypedApi(ksmAh)
  const { txFromCallData } = paraApi
  const { remote_proxy_with_registered_proof, register_remote_proxy_proof } =
    paraApi.tx.RemoteProxyRelayChain
  const unsafeParaApi = parachainClient.getUnsafeApi()

  return (
    proxiedAccount: SS58String,
    multisig: {
      threshold: number
      signatories: Array<SS58String | HexString>
    },
    signer: PolkadotSigner,
    options: {
      mortality:
        | {
            preserve: true
          }
        | { preserve: false; maxPeriod: number }
    } = { mortality: { preserve: false, maxPeriod: 8 } },
  ): PolkadotSigner & {
    accountId: Uint8Array
  } => {
    const { mortality } = options
    const withBatchSigner = getMultisigSigner(
      multisig,
      paraApi.query.Multisig.Multisigs.getValue,
      paraApi.apis.TransactionPaymentApi.query_info,
      {
        ...signer,
        signTx: async (
          callData,
          signedExtensions,
          metadata,
          originalAtBlockNumber,
          ...rest
        ) => {
          const tx = (await txFromCallData(Binary.fromBytes(callData)))
            .decodedCall
          if (!TERMINAL_MULTSIGS.has(tx.value.type))
            return signer.signTx(
              callData,
              signedExtensions,
              metadata,
              originalAtBlockNumber,
              ...rest,
            )

          const {
            proof,
            block,
            at: { number: startAtBlock, hash },
          } = await getProof(proxiedAccount)

          const newCallData = (
            await unsafeParaApi.tx.Utility.batch_all({
              calls: [
                register_remote_proxy_proof({
                  proof: Enum("RelayChain", { proof, block }),
                }).decodedCall,
                tx,
              ],
            }).getEncodedData()
          ).asBytes()

          const newSignedExtensions = { ...signedExtensions }
          if (!mortality.preserve) {
            newSignedExtensions["CheckMortality"] = {
              identifier: "CheckMortality",
              value: mortal({
                period: mortality.maxPeriod,
                startAtBlock,
              }),
              additionalSigned: fromHex(hash),
            }
            originalAtBlockNumber = startAtBlock
          }

          return signer.signTx(
            newCallData,
            newSignedExtensions,
            metadata,
            originalAtBlockNumber,
            ...rest,
          )
        },
      },
    )

    return {
      ...withBatchSigner,
      signTx: async (callData, ...rest) =>
        withBatchSigner.signTx(
          (
            await remote_proxy_with_registered_proof({
              real: Enum("Id", proxiedAccount),
              force_proxy_type: undefined,
              call: (await txFromCallData(Binary.fromBytes(callData)))
                .decodedCall,
            }).getEncodedData()
          ).asBytes(),
          ...rest,
        ),
    }
  }
}
