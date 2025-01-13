import { SS58String } from "polkadot-api"
import {
  combineLatest,
  defaultIfEmpty,
  filter,
  from,
  map,
  merge,
  Observable,
  of,
  shareReplay,
  startWith,
  switchMap,
  take,
} from "rxjs"
import { LinkedAccountsSdkTypedApi } from "./descriptors"
import {
  LinkedAccountsResult,
  LinkedAccountsSdk,
  MultisigProvider,
  NestedLinkedAccountsResult,
} from "./sdk-types"

export function createLinkedAccountsSdk(
  typedApi: LinkedAccountsSdkTypedApi,
  multisigProvider: MultisigProvider,
): LinkedAccountsSdk {
  const proxy$ = (address: string) =>
    from(typedApi.query.Proxy.Proxies.getValue(address)).pipe(
      map((r) => r[0].map((v) => v.delegate)),
    )

  const cache: Record<SS58String, Observable<LinkedAccountsResult>> = {}
  const getLinkedAccounts$ = (address: SS58String) => {
    if (address in cache) return cache[address]
    cache[address] = merge(
      proxy$(address).pipe(
        filter((v) => v.length > 0),
        map(
          (value): LinkedAccountsResult => ({
            type: "proxy",
            value: { addresses: value },
          }),
        ),
      ),
      from(multisigProvider(address)).pipe(
        filter((v) => !!v),
        map((value): LinkedAccountsResult => ({ type: "multisig", value })),
      ),
    ).pipe(
      take(1),
      defaultIfEmpty({
        type: "root",
      } satisfies LinkedAccountsResult),
      shareReplay(1),
    )
    return cache[address]
  }

  const getNestedLinkedAccounts$ = (
    address: SS58String,
  ): Observable<NestedLinkedAccountsResult> =>
    getLinkedAccounts$(address).pipe(
      switchMap((result) => {
        if (result.type === "root") return of(result)

        const accounts$ = combineLatest(
          result.value.addresses.map((inner) =>
            getNestedLinkedAccounts$(inner),
          ),
        ).pipe(
          map((nested) =>
            result.value.addresses.map((inner, i) => ({
              address: inner,
              linkedAccounts: nested[i],
            })),
          ),
          startWith(
            result.value.addresses.map((inner) => ({
              address: inner,
              linkedAccounts: null,
            })),
          ),
        )

        if (result.type === "proxy") {
          return accounts$.pipe(
            map(
              (accounts): NestedLinkedAccountsResult => ({
                type: "proxy",
                value: { accounts },
              }),
            ),
          )
        }
        return accounts$.pipe(
          map(
            (accounts): NestedLinkedAccountsResult => ({
              type: "multisig",
              value: {
                threshold: result.value.threshold,
                accounts,
              },
            }),
          ),
        )
      }),
    )

  return {
    getLinkedAccounts$,
    getNestedLinkedAccounts$,
  }
}
