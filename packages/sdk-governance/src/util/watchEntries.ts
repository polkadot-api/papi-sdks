import { partitionByKey } from "@react-rxjs/utils"
import { map, mergeMap, Observable, takeWhile } from "rxjs"

export type Deltas<T> = {
  deleted: {
    args: Array<number>
    value: T
  }[]
  upserted: {
    args: Array<number>
    value: T
  }[]
}
export function partitionEntries<T>(
  entries$: Observable<{
    deltas: Deltas<T> | null
  }>,
) {
  return partitionByKey(
    entries$.pipe(
      mergeMap((v) =>
        v.deltas
          ? [
              ...v.deltas.deleted.map((d) => ({
                id: d.args.at(-1)!,
                value: undefined,
              })),
              ...v.deltas.upserted.map((d) => ({
                id: d.args.at(-1)!,
                value: d.value,
              })),
            ].sort((a, b) => a.id - b.id)
          : [],
      ),
    ),
    (res) => res.id,
    (group$) =>
      group$.pipe(
        takeWhile(({ value }) => Boolean(value), false),
        map(({ value }) => value!),
      ),
  )
}
