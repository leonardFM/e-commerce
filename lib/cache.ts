import { logHash, logger } from './logger'
import { elapsedMs, getThresholdMs, startTimer } from './performance'
import { getRedis } from './redis'

const SLOW_CACHE_THRESHOLD_MS = getThresholdMs(process.env.SLOW_CACHE_THRESHOLD_MS, 50)

function logCachePerformance(payload: { operation: string; durationMs: number; keyHash?: string; prefixHash?: string; hit?: boolean; ttlSeconds?: number; deletedCount?: number }) {
  logger.debug(payload, `cache_${payload.operation}`)
  if (payload.durationMs >= SLOW_CACHE_THRESHOLD_MS) {
    logger.warn({ ...payload, thresholdMs: SLOW_CACHE_THRESHOLD_MS }, 'cache_slow_operation')
  }
}

export async function getJsonCache<T>(key: string) {
  const redis = getRedis()
  if (!redis) return null
  const start = startTimer()
  const keyHash = logHash(key)

  try {
    const value = await redis.get(key)
    logCachePerformance({ operation: 'get', keyHash, hit: Boolean(value), durationMs: elapsedMs(start) })
    return value ? (JSON.parse(value) as T) : null
  } catch (error) {
    logger.warn({ err: error, keyHash, durationMs: elapsedMs(start) }, 'cache_get_failed')
    return null
  }
}

export async function setJsonCache(key: string, value: unknown, ttlSeconds: number) {
  const redis = getRedis()
  if (!redis) return
  const start = startTimer()
  const keyHash = logHash(key)

  try {
    await redis.set(key, JSON.stringify(value), 'EX', ttlSeconds)
    logCachePerformance({ operation: 'set', keyHash, ttlSeconds, durationMs: elapsedMs(start) })
  } catch (error) {
    logger.warn({ err: error, keyHash, ttlSeconds, durationMs: elapsedMs(start) }, 'cache_set_failed')
    return
  }
}

export async function deleteCacheKey(key: string) {
  const redis = getRedis()
  if (!redis) return
  const start = startTimer()
  const keyHash = logHash(key)

  try {
    const deletedCount = await redis.del(key)
    logCachePerformance({ operation: 'delete', keyHash, deletedCount, durationMs: elapsedMs(start) })
  } catch (error) {
    logger.warn({ err: error, keyHash, durationMs: elapsedMs(start) }, 'cache_delete_failed')
    return
  }
}

export async function deleteCacheByPrefix(prefix: string) {
  const redis = getRedis()
  if (!redis) return
  const start = startTimer()
  const prefixHash = logHash(prefix)

  let cursor = '0'
  let deletedCount = 0

  try {
    do {
      const [nextCursor, keys] = await redis.scan(cursor, 'MATCH', `${prefix}*`, 'COUNT', 100)
      cursor = nextCursor
      if (keys.length > 0) deletedCount += await redis.del(...keys)
    } while (cursor !== '0')
    logCachePerformance({ operation: 'delete_by_prefix', prefixHash, deletedCount, durationMs: elapsedMs(start) })
  } catch (error) {
    logger.warn({ err: error, prefixHash, durationMs: elapsedMs(start) }, 'cache_delete_by_prefix_failed')
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
