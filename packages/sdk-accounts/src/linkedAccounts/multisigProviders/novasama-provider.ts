import { AccountId, Binary, getSs58AddressInfo } from "polkadot-api"
import { MultisigProvider } from "../sdk-types"

export type NovasamaChain = "polkadot" | "kusama"
export const novasamaProvider =
  (chain: NovasamaChain = "polkadot"): MultisigProvider =>
  async (account) => {
    try {
      const info = getSs58AddressInfo(account)
      if (!info.isValid) {
        throw new Error("Invalid SS58")
      }
      const accountIdCodec = AccountId(info.ss58Format)

      const response = await fetch(
        `https://subquery-proxy-${chain}-prod.novasama-tech.org`,
        {
          method: "POST",
          headers: {
            accept: "application/json",
            "content-type": "application/json",
          },
          body: JSON.stringify({
            query: `
      query Multisig($address: String) {
        accounts(filter: {id: {equalTo: $address}, isMultisig: {equalTo: true}}, first: 1) {
          nodes {
            signatories {
              nodes {
                signatoryId
              }
            }
            threshold
          }
        }
      }
              `,
            variables: {
              address: Binary.toHex(info.publicKey),
            },
            operationName: "Multisig",
          }),
        },
      )
      const result = await (response.json() as Promise<{
        data: {
          accounts: {
            nodes: Array<{
              signatories: { nodes: Array<{ signatoryId: string }> }
              threshold: number
            }>
          }
        }
      }>)
      const multisig = result.data.accounts.nodes[0]
      if (!multisig) return null
      return {
        threshold: multisig.threshold,
        addresses: multisig.signatories.nodes.map((v) =>
          accountIdCodec.dec(v.signatoryId),
        ),
      }
    } catch (ex) {
      console.error(ex)
      return null
    }
  }
