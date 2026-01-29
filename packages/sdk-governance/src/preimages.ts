import { Binary } from "polkadot-api"
import { PreimagesBounded } from "./referenda/descriptors"

const preimageCache = new Map<string, Promise<Uint8Array>>()

export const getPreimageResolver = (
  getPreimageValues: (
    keys: [[Uint8Array, number]][],
  ) => Promise<(Uint8Array | undefined)[]>,
) => {
  const batched = batch((preimages: [Uint8Array, number][]) =>
    getPreimageValues(preimages.map((v) => [v])),
  )

  return async (proposal: PreimagesBounded) => {
    if (proposal.type === "Legacy")
      throw new Error("Legacy proposals can't be resolved")
    if (proposal.type === "Inline") return proposal.value

    const hashHex = Binary.toHex(proposal.value.hash)
    const cached = preimageCache.get(hashHex)
    if (cached) return cached
    const promise = (async () => {
      const result = await batched([proposal.value.hash, proposal.value.len])
      if (!result)
        throw new Error(`Preimage ${hashHex} not found`)
      return result
    })()
    preimageCache.set(hashHex, promise)
    return promise
  }
}

const batch = <T, R>(fn: (values: T[]) => Promise<R[]>) => {
  let batched: Array<{
    value: T
    resolve: (res: R) => void
    reject: (err: any) => void
  }> | null = null

  async function execute() {
    if (!batched) return
    try {
      const result = await fn(batched.map((v) => v.value))
      batched.forEach(({ resolve }, i) => resolve(result[i]))
    } catch (ex) {
      console.error(ex)
      batched.forEach(({ reject }) => reject(ex))
    }
    batched = null
  }

  return (value: T): Promise<R> =>
    new Promise((resolve, reject) => {
      if (!batched) {
        batched = [
          {
            value,
            resolve,
            reject,
          },
        ]
        setTimeout(execute)
      } else {
        batched.push({
          value,
          resolve,
          reject,
        })
      }
    })
}
