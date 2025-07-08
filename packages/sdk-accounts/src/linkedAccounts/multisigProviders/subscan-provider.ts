import { SS58String } from "polkadot-api"
import { MultisigProvider } from "../sdk-types"

/**
 * Multisig provider for subscan API.
 *
 * See `throttleMultisigProvider` to throttle down requests to your API key limits.
 *
 * @param chain See supported chains in https://support.subscan.io/doc-361776
 * @param subscanApiKey API key from subscan
 */
export function subscanProvider(
  chain: string,
  subscanApiKey: string,
): MultisigProvider {
  return async (address) => {
    try {
      const result = await fetch(
        `https://${chain}.api.subscan.io/api/v2/scan/search`,
        {
          method: "POST",
          body: JSON.stringify({
            key: address,
          }),
          headers: {
            "x-api-key": subscanApiKey,
          },
        },
      ).then((r) => r.json())

      const multisig = result.data?.account?.multisig
      if (!multisig) return null

      return {
        addresses: multisig.multi_account_member.map(
          (v: { address: SS58String }) => v.address,
        ),
        threshold: multisig.threshold,
      }
    } catch (ex) {
      console.log(ex)
      return null
    }
  }
}
