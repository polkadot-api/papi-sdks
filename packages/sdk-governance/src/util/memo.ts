export const weakMemo = <Arg extends [object], R>(fn: (...arg: Arg) => R) => {
  const cache = new WeakMap<Arg[0], R>()
  return (...arg: Arg) => {
    if (cache.has(arg[0])) return cache.get(arg[0])!
    const result = fn(...arg)
    cache.set(arg[0], result)
    return result
  }
}

export const memo = <Arg extends Array<unknown>, R>(fn: (...arg: Arg) => R) => {
  let cachedKey: Arg | null = null
  let cachedValue: R = null as any
  return (...arg: Arg) => {
    if (cachedKey && cachedKey.every((k, i) => k === arg[i])) {
      return cachedValue
    }
    cachedKey = arg
    cachedValue = fn(...arg)
    return cachedValue
  }
}
