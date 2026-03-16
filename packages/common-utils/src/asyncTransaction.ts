import type { Transaction } from "polkadot-api"
import { from, switchMap } from "rxjs"

export type AsyncTransaction<Asset = any, Ext = any> = Omit<
  Transaction<Asset, Ext>,
  "decodedCall" | "getEncodedData" | "getBareTx"
> & {
  decodedCall: Promise<Transaction<Asset, Ext>["decodedCall"]>
  getEncodedData: () => Promise<Uint8Array>
  getBareTx: () => Promise<Uint8Array>
  waited: Promise<Transaction<Asset, Ext>>
}

export const wrapAsyncTx = <Asset, Ext>(
  fn: () => Promise<Transaction<Asset, Ext>>,
): AsyncTransaction<Asset, Ext> => {
  const promise = fn()

  // Prevent some runtimes from terminating for an uncaught exception
  promise.catch((ex) => {
    console.error(ex)
  })

  return {
    sign: (...args) => promise.then((tx) => tx.sign(...args)),
    signSubmitAndWatch: (...args) =>
      from(promise).pipe(switchMap((tx) => tx.signSubmitAndWatch(...args))),
    signAndSubmit: (...args) => promise.then((tx) => tx.signAndSubmit(...args)),
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
