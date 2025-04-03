import { SS58String } from "polkadot-api"
import { VestingSdkTypedApi } from "./descriptors"
import { Observable, of } from "rxjs"

/**
 * In order to discover what is the pallet doing behind the scenes you'll need
 * to check its implementation in Rust. Shitty, right? Welcome to my life :)
 * In this file you have everything you need, even including some docs
 * https://github.com/paritytech/polkadot-sdk/blob/master/substrate/frame/vesting/src/lib.rs
 *
 * Build the library with `pnpm build`
 */

export function createVestingSdk(_typedApi: VestingSdkTypedApi) {
  return {
    /**
     * Given an address, we want to know when will the whole amount become
     * vested; i.e. available to claim.
     */
    getFullVestingDate(_address: SS58String): Date {
      // TODO implement!
      // tip 1: does info come in time (i.e. seconds, minutes...) or blocks?
      //        you might need the block time, inspect the typedApi...
      // tip 2: `Date.now() + millisecondsLeft` 😉
      return new Date()
    },
    /**
     * Given an address, we want to create an observable that emits the amount
     * that was already vested, but not yet claimed. Emit for every new
     * finalized block.
     */
    watchVested(_address: SS58String): Observable<bigint> {
      // TODO: implement!
      // tip: keep in mind that there might be multiple vested transfers...
      //      start with one, and then continue!
      return of(0n)
    },
    /**
     * Given an address, we want to return the amount that was already vested,
     * but not yet claimed. Use the latest finalized block.
     */
    getVested(_address: SS58String): Promise<bigint> {
      // TODO: recommendation, start by the previous one! 😉
      return Promise.resolve(0n)
    },
  }
}
