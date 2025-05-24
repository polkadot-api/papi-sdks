import type { TxFinalized, TxEvent } from "polkadot-api"
import type { Observable } from "rxjs"

export const trackTx = (obs: Observable<TxEvent>) =>
  new Promise<TxFinalized>((resolve, reject) =>
    obs.subscribe({
      next: (evt) => {
        console.log(evt.type)
        if (evt.type === "finalized") {
          resolve(evt)
        }
      },
      error: (err) => reject(err),
    }),
  )
