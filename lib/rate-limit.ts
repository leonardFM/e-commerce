import { AppError } from './errors'
import { logHash, logger } from './logger'
import { getRedis } from './redis'

type FailedLoginRateLimitOptions = {
  key: string
  limit: number
  windowSeconds: number
}

export async function assertFailedLoginRateLimit(options: FailedLoginRateLimitOptions) {
  const redis = getRedis()
  if (!redis) return

  try {
    const attempts = await redis.get(options.key)
    if (attempts && Number(attempts) >= options.limit) {
      throw new AppError('Too many failed login attempts, please try again later', 429)
    }
  } catch (error) {
    if (error instanceof AppError) throw error
    logger.warn({ err: error, keyHash: logHash(options.key) }, 'rate_limit_check_failed')
    return
  }
}

export async function incrementFailedLoginRateLimit(options: FailedLoginRateLimitOptions) {
  const redis = getRedis()
  if (!redis) return

  try {
    const attempts = await redis.incr(options.key)
    if (attempts === 1) await redis.expire(options.key, options.windowSeconds)
  } catch (error) {
    logger.warn({ err: error, keyHash: logHash(options.key) }, 'rate_limit_increment_failed')
    return
  }
}

export async function resetFailedLoginRateLimit(key: string) {
  const redis = getRedis()
  if (!redis) return

  try {
    await redis.del(key)
  } catch (error) {
    logger.warn({ err: error, keyHash: logHash(key) }, 'rate_limit_reset_failed')
    return
  }
}
