import { randomUUID } from 'crypto'
import { logHash, logger } from './logger'
import { getRedis } from './redis'

export type RedisLock = {
  key: string
  token: string
}

export async function acquireRedisLock(key: string, ttlSeconds: number) {
  const redis = getRedis()
  if (!redis) return null

  const token = randomUUID()

  try {
    const result = await redis.set(key, token, 'EX', ttlSeconds, 'NX')
    return result === 'OK' ? { key, token } : false
  } catch (error) {
    logger.warn({ err: error, keyHash: logHash(key) }, 'redis_lock_acquire_failed')
    return null
  }
}

export async function releaseRedisLock(lock: RedisLock | null | false) {
  if (!lock) return

  const redis = getRedis()
  if (!redis) return

  try {
    const token = await redis.get(lock.key)
    if (token === lock.token) await redis.del(lock.key)
  } catch (error) {
    logger.warn({ err: error, keyHash: logHash(lock.key) }, 'redis_lock_release_failed')
    return
  }
}
