import {
  Binary,
  BlockInfo,
  Enum,
  PolkadotClient,
  type PolkadotSigner,
  SS58String,
  Transaction,
} from "polkadot-api"
import { createGetProof } from "./get-proof-data"
import { ksmAh } from "./descriptors"
import { fromHex } from "polkadot-api/utils"
import { mortal } from "./mortal"
import { createMultisigProxiedSigner } from "./multisig-proxied-signer"

export { type MultisigConfig } from "./multisig-proxied-signer"

export const getRemoteProxySdk = (
  relayChainClient: PolkadotClient,
  parachainClient: PolkadotClient,
) => {
  const getProof = createGetProof(relayChainClient, parachainClient)
  const paraApi = parachainClient.getTypedApi(ksmAh)
  const { remote_proxy } = paraApi.tx.RemoteProxyRelayChain
  const { txFromCallData } = paraApi

  const proxyTx = (
    tx: Transaction<any, any, any, any>,
    {
      proof,
      block,
      at,
      proxied,
    }: {
      proof: Binary[]
      block: number
      at: BlockInfo
      proxied: SS58String
    },
  ) => {
    const result = remote_proxy({
      real: Enum("Id", proxied),
      force_proxy_type: undefined,
      call: tx.decodedCall,
      proof: Enum("RelayChain", { proof, block }),
    })

    const resultWithAt: typeof result & { at: BlockInfo } = result as any
    resultWithAt.at = at
    return resultWithAt
  }

  const getProxiedSigner = (
    proxiedAccount: SS58String,
    signer: PolkadotSigner,
    options: {
      mortality:
        | {
            preserve: true
          }
        | { preserve: false; maxPeriod: number }
    } = { mortality: { preserve: false, maxPeriod: 8 } },
  ): PolkadotSigner => {
    const { mortality } = options
    return {
      ...signer,
      signTx: async (
        callData,
        signedExtensions,
        metadata,
        originalAtBlockNumber,
        ...rest
      ) => {
        const {
          at: { number: startAtBlock, hash },
          getEncodedData,
        } = proxyTx(
          ...(await Promise.all([
            txFromCallData(Binary.fromBytes(callData)),
            getProof(proxiedAccount),
          ])),
        )

        const newCallData = (await getEncodedData()).asBytes()

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
    }
  }

  const getProxiedTx = async (
    proxiedAccount: SS58String,
    tx: Transaction<any, any, any, any>,
  ) => proxyTx(tx, await getProof(proxiedAccount))

  return {
    getProxiedTx,
    getProxiedSigner,
    getMultisigProxiedSigner: createMultisigProxiedSigner(
      parachainClient,
      getProof,
    ),
  }
}
