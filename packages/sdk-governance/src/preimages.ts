import { Binary } from "polkadot-api"
import { PreimagesBounded } from "./referenda-descriptors"

const preimageCache = new Map<string, Promise<Binary>>()

export const getPreimageResolver = (
  getPreimageValues: (
    keys: [[Binary, number]][],
  ) => Promise<(Binary | undefined)[]>,
) => {
  const batched = batch((preimages: [Binary, number][]) =>
    getPreimageValues(preimages.map((v) => [v])),
  )

  return async (proposal: PreimagesBounded) => {
    if (proposal.type === "Legacy")
      throw new Error("Legacy proposals can't be resolved")
    if (proposal.type === "Inline") return proposal.value

    const cached = preimageCache.get(proposal.value.hash.asHex())
    if (cached) return cached
    const promise = (async () => {
      const result = await batched([proposal.value.hash, proposal.value.len])
      if (!result)
        throw new Error(`Preimage ${proposal.value.hash.asHex()} not found`)
      return result
    })()
    preimageCache.set(proposal.value.hash.asHex(), promise)
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
