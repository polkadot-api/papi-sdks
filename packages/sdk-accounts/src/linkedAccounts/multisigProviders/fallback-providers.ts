import { MultisigProvider } from "../sdk-types"

export function fallbackMultisigProviders(
  ...providers: MultisigProvider[]
): MultisigProvider {
  return async (address) => {
    for (const provider of providers) {
      const result = await provider(address)
      if (result) return result
    }
    return null
  }
}
