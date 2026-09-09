import type { Transaction } from "polkadot-api"
import { from, switchMap } from "rxjs"

type ExtensionConstraints = Transaction extends Transaction<infer R> ? R : never
export type AsyncTransaction<
  EC extends ExtensionConstraints = ExtensionConstraints,
> = Omit<Transaction<EC>, "decodedCall" | "getEncodedData" | "getBareTx"> & {
  decodedCall: Promise<Transaction<EC>["decodedCall"]>
  getEncodedData: () => Promise<Uint8Array>
  getBareTx: () => Promise<Uint8Array>
  waited: Promise<Transaction<EC>>
}

export const wrapAsyncTx = <EC extends ExtensionConstraints>(
  fn: () => Promise<Transaction<EC>>,
): AsyncTransaction<EC> => {
  const promise = fn()

  // Prevent some runtimes from terminating for an uncaught exception
  promise.catch((ex) => {
    console.error(ex)
  })

  return {
    create: (...args) => promise.then((tx) => tx.create(...args)),
    createSubmitAndWatch: (...args) =>
      from(promise).pipe(switchMap((tx) => tx.createSubmitAndWatch(...args))),
    createAndSubmit: (...args) =>
      promise.then((tx) => tx.createAndSubmit(...args)),
    getEstimatedFees: (...args) =>
      promise.then((tx) => tx.getEstimatedFees(...args)),
    getPaymentInfo: (...args) =>
      promise.then((tx) => tx.getPaymentInfo(...args)),
    decodedCall: promise.then((tx) => tx.decodedCall),
    getEncodedData: () => promise.then((tx) => tx.getEncodedData()),
    getBareTx: () => promise.then((tx) => tx.getBareTx()),
    waited: promise,
  }
}
