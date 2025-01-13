export const keyBy = <T, K extends string | number>(
  arr: Iterable<T>,
  mapFn: (v: T) => K,
): Record<K, T> =>
  Object.fromEntries(Array.from(arr).map((v) => [mapFn(v), v])) as any
