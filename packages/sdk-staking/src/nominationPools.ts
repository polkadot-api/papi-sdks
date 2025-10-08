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
import { Dot, DotQueries, MultiAddress } from "../.papi/descriptors/dist"
import { NominationPool, StakingSdk } from "./sdk-types"

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
      Binary.fromText("modlpy/nopls").asBytes(),
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
  name?: Binary,
): NominationPool => ({
  id,
  name: name?.asText() ?? "",
  addresses: {
    ...pool?.roles,
    commission: pool.commission.current?.[1],
    pool: address,
  },
  commission: {
    ...pool.commission,
    current: pool.commission.current?.[0] ?? 0,
  },
  memberCount: pool.member_counter,
  nominations: nominations?.targets ?? [],
  points: pool.points,
  state: pool.state.type,
})

export const getNominationPool$Fn =
  (api: TypedApi<Dot>): StakingSdk["getNominationPool$"] =>
  (id) =>
    combineLatest({
      pool: api.query.NominationPools.BondedPools.watchValue(id),
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

          const nominations =
            await api.query.Staking.Nominators.getValue(address)

          return mapPool(id, pool, nominations, address, name)
        },
      ),
    )

export const getNominationPoolsFn =
  (api: TypedApi<Dot>): StakingSdk["getNominationPools"] =>
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
    const names$ = defer(api.query.NominationPools.Metadata.getEntries).pipe(
      map((values) =>
        values.reduce((acc: Record<number, Binary>, v) => {
          acc[v.keyArgs[0]] = v.value
          return acc
        }, {}),
      ),
    )

    const result$ = combineLatest({
      pools: pools$,
      nominations: nominations$,
      names: names$,
    }).pipe(
      map(({ pools, nominations, names }): NominationPool[] =>
        pools.map((pool, i) =>
          mapPool(pool.id, pool, nominations[i], pool.address, names[pool.id]),
        ),
      ),
    )

    return firstValueFrom(result$)
  }
