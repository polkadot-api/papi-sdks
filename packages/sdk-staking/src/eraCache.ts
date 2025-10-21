// Usually values from staking won't change for past eras
// PAPI caches per-block, but as we know this can't change anymore, we can just cache it.
export const createEraCache = <T>(
  getFn: (era: number) => Promise<T>,
  getActiveEra: () => Promise<number>,
) => {
  const cache: Record<number, Promise<T>> = {}

  const getEraValue = (era: number) => {
    if (era in cache) return cache[era]

    const result = getFn(era)

    // It's safe for others to use this cache temporarily
    cache[era] = result

    // Remove from cache if it's actually above the active era
    getActiveEra().then((activeEra) => {
      if (activeEra <= era) {
        delete cache[era]
      }
    })

    return result
  }

  return [getEraValue, cache] as const
}

// Same as createEraCache, but also lets extract one value from the cache if it was already loaded collectively.
export const createKeyedEraCache = <T extends Record<string, any>>(
  getAll: (era: number) => Promise<T>,
  getOne: (era: number, key: string) => Promise<T[string]>,
  getActiveEra: () => Promise<number>,
) => {
  const [getEraValues, collectiveCache] = createEraCache(getAll, getActiveEra)

  const getEraValue = async (era: number, key: string) => {
    if (era in collectiveCache) {
      const eraOverview = await collectiveCache[era]
      return eraOverview[key] ?? null
    }

    return getOne(era, key)
  }

  return [getEraValues, getEraValue] as const
}
