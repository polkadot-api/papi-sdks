import { SS58String } from "polkadot-api"
import { VestingSdkTypedApi } from "./descriptors"
import { map, Observable, withLatestFrom } from "rxjs"

/**
 * In order to discover what is the pallet doing behind the scenes you'll need
 * to check its implementation in Rust. Shitty, right? Welcome to my life :)
 * In this file you have everything you need, even including some docs
 * https://github.com/paritytech/polkadot-sdk/blob/master/substrate/frame/vesting/src/lib.rs
 *
 * Build the library with `pnpm build`
 */

export function createVestingSdk(typedApi: VestingSdkTypedApi) {
  return {
    /**
     * Given an address, we want to know when will the whole amount become
     * vested; i.e. available to claim.
     */
    async getFullVestingDate(address: SS58String): Promise<Date> {
      const vestingInfo = await typedApi.query.Vesting.Vesting.getValue(address)
      if (!vestingInfo) return new Date()
      const blockTime = typedApi.constants.Babe.ExpectedBlockTime()
      const currentBlock = await typedApi.query.System.Number.getValue()
      const endBlock = vestingInfo.reduce(
        (acc, { locked, per_block, starting_block }) =>
          Math.max(
            Number(locked / per_block + (locked % per_block ? 1n : 0n)) +
              starting_block,
            acc,
          ),
        currentBlock,
      )
      const msRemaining =
        Math.max(endBlock - currentBlock, 0) * Number(await blockTime)
      return new Date(Date.now() + msRemaining)
    },
    /**
     * Given an address, we want to create an observable that emits the amount
     * that was already vested, but not yet claimed. Emit for every new
     * finalized block.
     */
    watchVested(address: SS58String): Observable<bigint> {
      return typedApi.query.System.Number.watchValue().pipe(
        withLatestFrom(
          typedApi.query.Vesting.Vesting.watchValue(address),
          typedApi.query.Balances.Locks.watchValue(address),
        ),
        map(([currentBlock, vesting, locks]) => {
          if (!vesting) return 0n
          const lock = locks.find(
            ({ id }) => id.asText() === "vesting ",
          )?.amount
          if (!lock) throw new Error("THIS SHOULD NEVER HAPPEN")
          const totalLocked = vesting.reduce(
            (acc, { locked }) => acc + locked,
            0n,
          )
          const totalVested = vesting.reduce(
            (acc, { locked, per_block, starting_block }) => {
              const totalVestingBlocks =
                Number(locked / per_block) + (locked % per_block ? 1 : 0)
              const blockDiff = Math.max(currentBlock - starting_block, 0)
              return (
                acc +
                per_block * BigInt(Math.min(blockDiff, totalVestingBlocks))
              )
            },
            0n,
          )
          if (lock > totalLocked) throw new Error("THIS SHOULD NEVER HAPPEN")
          return totalVested - (totalLocked - lock)
        }),
      )
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
