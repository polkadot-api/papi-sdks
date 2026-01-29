import { SS58String, TypedApi } from "polkadot-api"
import {
  combineLatest,
  distinctUntilChanged,
  map,
  Observable,
  share,
  skip,
  startWith,
  switchMap,
  takeWhile,
} from "rxjs"
import { Dot, WndAh } from "../.papi/descriptors/dist"
import { AccountStatus, StakingSdk } from "./sdk-types"

export const getAccountStatus$ =
  (
    api: TypedApi<Dot>,
    wndApi: TypedApi<WndAh>,
  ): StakingSdk["getAccountStatus$"] =>
  (addr: SS58String) => {
    const balance$ = getBalance$(api, addr).pipe(share())

    return combineLatest({
      balance: balance$,
      nomination: getNomination$(wndApi, addr, balance$),
      nominationPool: getNominationPool$(api, addr),
    })
  }

const maxBigInt = (a: bigint, b: bigint) => (a > b ? a : b)

const getBalance$ = (
  api: TypedApi<Dot>,
  addr: SS58String,
): Observable<AccountStatus["balance"]> =>
  combineLatest([
    api.query.System.Account.watchValue(addr).pipe(map(({ value }) => value)),
    api.constants.Balances.ExistentialDeposit(),
  ]).pipe(
    map(([{ data }, existentialDeposit]) => {
      // https://wiki.polkadot.network/learn/learn-account-balances/
      // Total tokens in the account
      const total = data.reserved + data.free
      const accountEd = total == 0n ? 0n : existentialDeposit
      // Portion of "free" balance that can't be transferred.
      const untouchable = maxBigInt(
        data.frozen - data.reserved,
        existentialDeposit,
      )
      // Portion of "free" balance that can be transferred
      const spendable = data.free - untouchable
      // Portion of "total" balance that is somehow locked
      const locked = data.reserved + untouchable

      return {
        raw: {
          ...data,
          existentialDeposit: accountEd,
        },
        total,
        locked,
        untouchable,
        spendable,
      }
    }),
  )

const getNomination$ = (
  api: TypedApi<WndAh>,
  addr: SS58String,
  balance$: Observable<AccountStatus["balance"]>,
) => {
  const bonded$ = api.query.Staking.Bonded.watchValue(addr).pipe(
    map(({ value }) => value),
    // Keep watching until we have a controller account.
    // We have to find a compromise on active storage subscriptions vs reactivity
    // For "Is nominating" we can just watch ledger, with the pre-condition that
    // Staking.Bonded has a controller.
    takeWhile((controller) => !controller, true),
    switchMap((controller) => {
      if (!controller) return [null]
      return api.query.Staking.Ledger.watchValue(controller).pipe(
        map(({ value }) => value),
        map((ledger) => ({ controller, ledger })),
      )
    }),
    share(),
  )

  // Setting maxBond$ aside, since we don't want every change in account balance to trigger an update on the nomination
  const maxBond$ = combineLatest([bonded$, balance$]).pipe(
    map(
      ([bonded, balance]) =>
        (bonded?.ledger?.total ?? 0n) +
        balance.raw.free -
        balance.raw.existentialDeposit,
    ),
    distinctUntilChanged(),
  )

  return combineLatest([
    bonded$,
    maxBond$,
    api.query.Staking.MinNominatorBond.getValue(),
    api.query.Staking.MinimumActiveStake.getValue(),
    api.query.Staking.Nominators.watchValue(addr).pipe(map(({ value }) => value)),
    api.query.Staking.Payee.watchValue(addr).pipe(map(({ value }) => value)),
  ]).pipe(
    map(
      ([
        bonded,
        maxBond,
        minNominationBond,
        lastMinRewardingBond,
        nominator,
        payee,
      ]) => {
        const totalLocked = bonded?.ledger?.total ?? 0n
        const currentBond = bonded?.ledger?.active ?? 0n
        const unlocks = bonded?.ledger?.unlocking ?? []
        const canNominate = maxBond >= minNominationBond
        const nominating = nominator?.targets
          ? {
              validators: nominator.targets,
            }
          : null

        return {
          canNominate,
          minNominationBond,
          lastMinRewardingBond,
          controller: bonded?.controller ?? null,
          currentBond,
          totalLocked,
          unlocks,
          maxBond,
          nominating,
          payee: payee ?? null,
        }
      },
    ),
  )
}

const getNominationPool$ = (api: TypedApi<Dot>, addr: SS58String) =>
  combineLatest([
    api.query.NominationPools.PoolMembers.watchValue(addr).pipe(map(({ value }) => value)),
    api.query.System.Account.watchValue(addr).pipe(
      map(({ value }) => value),
      skip(1),
      startWith(null),
      switchMap(() => api.apis.NominationPoolsApi.pending_rewards(addr)),
    ),
  ]).pipe(
    switchMap(async ([member, pendingRewards]) => {
      if (!member) {
        return {
          currentBond: 0n,
          points: 0n,
          pendingRewards,
          pool: null,
          unlocks: [],
        }
      }

      const currentBond = await api.apis.NominationPoolsApi.points_to_balance(
        member.pool_id,
        member.points,
      )

      const unlocks = member.unbonding_eras.map(([era, value]) => ({
        era,
        value,
      }))

      return {
        currentBond,
        points: member.points ?? 0n,
        pendingRewards,
        pool: member.pool_id,
        unlocks,
      }
    }),
  )
