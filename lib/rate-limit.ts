import { AppError } from './errors'
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
    return
  }
}

export async function incrementFailedLoginRateLimit(options: FailedLoginRateLimitOptions) {
  const redis = getRedis()
  if (!redis) return

  try {
    const attempts = await redis.incr(options.key)
    if (attempts === 1) await redis.expire(options.key, options.windowSeconds)
  } catch {
    return
  }
}

export async function resetFailedLoginRateLimit(key: string) {
  const redis = getRedis()
  if (!redis) return

  try {
    await redis.del(key)
  } catch {
    return
  }
}
