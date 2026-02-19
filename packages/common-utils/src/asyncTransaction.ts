import type { HexString, Transaction } from "polkadot-api"
import { from, switchMap } from "rxjs"

export type AsyncTransaction<
  Arg extends {} | undefined = any,
  Pallet extends string = any,
  Name extends string = any,
  Asset = any,
> = Omit<
  Transaction<Arg, Pallet, Name, Asset>,
  "decodedCall" | "getEncodedData" | "getBareTx"
> & {
  decodedCall: Promise<Transaction<Arg, Pallet, Name, Asset>["decodedCall"]>
  getEncodedData: () => Promise<Uint8Array>
  getBareTx: () => Promise<Uint8Array>
  waited: Promise<Transaction<Arg, Pallet, Name, Asset>>
}

export const wrapAsyncTx = <
  Arg extends {} | undefined,
  Pallet extends string,
  Name extends string,
  Asset,
>(
  fn: () => Promise<Transaction<Arg, Pallet, Name, Asset>>,
): AsyncTransaction<Arg, Pallet, Name, Asset> => {
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
