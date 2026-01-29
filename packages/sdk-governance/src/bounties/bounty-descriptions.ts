import { KeyChanges } from "@react-rxjs/utils"
import { Binary } from "polkadot-api"
import {
  defer,
  merge,
  mergeMap,
  Observable,
  scan,
  shareReplay,
  skip,
  startWith,
} from "rxjs"

export const getBountyDescriptions$ = (
  getEntries: () => Promise<
    {
      keyArgs: [Key: number]
      value: Uint8Array
    }[]
  >,
  getValues: (keys: [number][]) => Promise<(Uint8Array | undefined)[]>,
  keyChanges$: Observable<KeyChanges<number>>,
) =>
  merge(
    defer(getEntries),
    keyChanges$.pipe(
      skip(1),
      mergeMap((changes) => {
        if (changes.type === "remove") return []
        const keys = Array.from(changes.keys)
        return getValues(keys.map((key) => [key])).then((result) =>
          result
            .map((value, i) => ({
              keyArgs: [keys[i]] as [Key: number],
              value: value!,
            }))
            .filter(({ value }) => value != null),
        )
      }),
    ),
  ).pipe(
    scan(
      (acc, v) => ({
        ...acc,
        ...Object.fromEntries(
          v.map(({ keyArgs, value }) => [keyArgs[0], Binary.toText(value)]),
        ),
      }),
      {} as Record<number, string>,
    ),
    startWith({} as Record<number, string>),
    shareReplay({ bufferSize: 1, refCount: true }),
  )
