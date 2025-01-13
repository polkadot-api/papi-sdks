import type { Result } from "@polkadot-api/common-sdk-utils"

export const unwrap: {
  <T>(res: Result<T>): T
  <T>(res: Promise<Result<T>>): Promise<T>
} = (res) => {
  if ("then" in res) return res.then(unwrap)
  if (res.success) return res.value
  throw new Error("Success `false` found")
}

export const log = (l: any) => console.dir(l, { depth: null })
