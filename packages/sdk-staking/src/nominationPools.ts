import { wrapAsyncTx } from "@polkadot-api/common-sdk-utils"
import { SS58String, u32 } from "@polkadot-api/substrate-bindings"
import { AccountId, Binary, TypedApi } from "polkadot-api"
import { mergeUint8 } from "polkadot-api/utils"
import {
  combineLatest,
  defer,
  firstValueFrom,
  map,
  share,
  switchMap,
  withLatestFrom,
} from "rxjs"
import { Dot, DotQueries, MultiAddress, WndAh } from "../.papi/descriptors/dist"
import { NominationPool, StakingSdk } from "./sdk-types"
import { PERBILL } from "./types"

export const unbondNominationPoolFn =
  (api: TypedApi<Dot>): StakingSdk["unbondNominationPool"] =>
  (address, unbond) =>
    wrapAsyncTx(async () => {
      const member =
        await api.query.NominationPools.PoolMembers.getValue(address)
      if (!member) {
        // Unsure what's expected. I could return a transaction that will be invalid, but I guess it's better to fail fast.
        throw new Error("Not a member of a pool")
      }

      const currentBond = await api.apis.NominationPoolsApi.points_to_balance(
        member.pool_id,
        member.points,
      )
      if (unbond > currentBond) {
        throw new Error(
          `Current bond is smaller than unbonding amount ${currentBond} < ${unbond}`,
        )
      }

      const resultingBond = currentBond - unbond
      const resultingPoints =
        await api.apis.NominationPoolsApi.balance_to_points(
          member.pool_id,
          resultingBond,
        )

      return api.tx.NominationPools.unbond({
        member_account: MultiAddress.Id(address),
        unbonding_points: member.points - resultingPoints,
      })
    })

const getNominationPoolAddress = (id: number, format: number) =>
  AccountId(format).dec(
    mergeUint8([
      Binary.fromText("modlpy/nopls"),
      new Uint8Array([0]),
      u32.enc(id),
      new Uint8Array(new Array(32).fill(0)),
    ]),
  )

const mapPool = (
  id: number,
  pool: DotQueries["NominationPools"]["BondedPools"]["Value"],
  nominations: DotQueries["Staking"]["Nominators"]["Value"] | undefined,
  address: SS58String,
  bond: bigint,
  name?: Uint8Array,
): NominationPool => {
  const [currentCommission, commissionAddr] = pool.commission.current ?? [
    0,
    undefined,
  ]

  return {
    id,
    name: name ? Binary.toText(name) : "",
    addresses: {
      ...pool?.roles,
      commission: commissionAddr,
      pool: address,
    },
    commission: {
      ...pool.commission,
      current: currentCommission / Number(PERBILL),
      max: pool.commission.max
        ? pool.commission.max / Number(PERBILL)
        : undefined,
      change_rate: pool.commission.change_rate
        ? {
            max_increase:
              pool.commission.change_rate.max_increase / Number(PERBILL),
            min_delay: pool.commission.change_rate.min_delay,
          }
        : undefined,
    },
    memberCount: pool.member_counter,
    nominations: nominations?.targets ?? [],
    points: pool.points,
    bond,
    state: pool.state.type,
  }
}

export const getNominationPool$Fn =
  (
    api: TypedApi<Dot>,
    wndApi: TypedApi<WndAh>,
  ): StakingSdk["getNominationPool$"] =>
  (id) =>
    combineLatest({
      pool: api.query.NominationPools.BondedPools.watchValue(id).pipe(
        map(({ value }) => value),
      ),
      name: api.query.NominationPools.Metadata.getValue(id),
    }).pipe(
      withLatestFrom(api.constants.System.SS58Prefix()),
      switchMap(
        async ([
          { pool, name },
          ss58Format,
        ]): Promise<NominationPool | null> => {
          if (!pool) {
            return null
          }

          const address = getNominationPoolAddress(id, ss58Format)

          const [nominations, ledger] = await Promise.all([
            api.query.Staking.Nominators.getValue(address),
            wndApi.query.Staking.Ledger.getValue(address),
          ])

          return mapPool(
            id,
            pool,
            nominations,
            address,
            ledger?.active ?? 0n,
            name,
          )
        },
      ),
    )

export const getNominationPoolsFn =
  (
    api: TypedApi<Dot>,
    wndApi: TypedApi<WndAh>,
  ): StakingSdk["getNominationPools"] =>
  () => {
    const pools$ = defer(api.query.NominationPools.BondedPools.getEntries).pipe(
      withLatestFrom(api.constants.System.SS58Prefix()),
      map(([pools, ss58Format]) =>
        pools.map(({ keyArgs: [id], value: pool }) => ({
          ...pool,
          id,
          address: getNominationPoolAddress(id, ss58Format),
        })),
      ),
      share(),
    )
    const nominations$ = pools$.pipe(
      switchMap((pools) =>
        api.query.Staking.Nominators.getValues(pools.map((p) => [p.address])),
      ),
    )
    const bonds$ = pools$.pipe(
      switchMap((pools) =>
        wndApi.query.Staking.Ledger.getValues(pools.map((p) => [p.address])),
      ),
      map((ledgers) => ledgers.map((v) => v?.active)),
    )
    const names$ = defer(api.query.NominationPools.Metadata.getEntries).pipe(
      map((values) =>
        values.reduce((acc: Record<number, Uint8Array>, v) => {
          acc[v.keyArgs[0]] = v.value
          return acc
        }, {}),
      ),
    )

    const result$ = combineLatest({
      pools: pools$,
      nominations: nominations$,
      bonds: bonds$,
      names: names$,
    }).pipe(
      map(({ pools, nominations, bonds, names }): NominationPool[] =>
        pools.map((pool, i) =>
          mapPool(
            pool.id,
            pool,
            nominations[i],
            pool.address,
            bonds[pool.id] ?? 0n,
            names[pool.id],
          ),
        ),
      ),
    )

    return firstValueFrom(result$)
  }
