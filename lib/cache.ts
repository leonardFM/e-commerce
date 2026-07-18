import { getRedis } from './redis'

export async function getJsonCache<T>(key: string) {
  const redis = getRedis()
  if (!redis) return null

  try {
    const value = await redis.get(key)
    return value ? (JSON.parse(value) as T) : null
  } catch {
    return null
  }
}

export async function setJsonCache(key: string, value: unknown, ttlSeconds: number) {
  const redis = getRedis()
  if (!redis) return

  try {
    await redis.set(key, JSON.stringify(value), 'EX', ttlSeconds)
  } catch {
    return
  }
}

export async function deleteCacheKey(key: string) {
  const redis = getRedis()
  if (!redis) return

  try {
    await redis.del(key)
  } catch {
    return
  }
}

export async function deleteCacheByPrefix(prefix: string) {
  const redis = getRedis()
  if (!redis) return

  let cursor = '0'

  try {
    do {
      const [nextCursor, keys] = await redis.scan(cursor, 'MATCH', `${prefix}*`, 'COUNT', 100)
      cursor = nextCursor
      if (keys.length > 0) await redis.del(...keys)
    } while (cursor !== '0')
  } catch {
    return
  }
}

export async function rememberJsonCache<T>(key: string, ttlSeconds: number, loader: () => Promise<T>) {
  const cached = await getJsonCache<T>(key)
  if (cached !== null) return cached

  const value = await loader()
  await setJsonCache(key, value, ttlSeconds)
  return value
}
