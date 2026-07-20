import { logHash, logger } from './logger'
import { getRedis } from './redis'
import { getJwtExp, getJwtId } from './auth'

const BLACKLIST_PREFIX = 'token-blacklist:'

export async function addToBlacklist(token: string): Promise<void> {
  const redis = getRedis()
  if (!redis) return

  const jti = getJwtId(token)
  if (!jti) return

  const exp = getJwtExp(token)
  if (!exp) return

  const remainingSeconds = Math.max(1, Math.floor(exp - Date.now() / 1000))
  if (remainingSeconds <= 0) return

  try {
    await redis.set(`${BLACKLIST_PREFIX}${jti}`, '1', 'EX', remainingSeconds)
  } catch (error) {
    logger.warn({ err: error, keyHash: logHash(BLACKLIST_PREFIX + jti) }, 'token_blacklist_add_failed')
  }
}

export async function isBlacklisted(token: string): Promise<boolean> {
  const redis = getRedis()
  if (!redis) return false

  const jti = getJwtId(token)
  if (!jti) return false

  try {
    const result = await redis.get(`${BLACKLIST_PREFIX}${jti}`)
    return result === '1'
  } catch (error) {
    logger.warn({ err: error, keyHash: logHash(BLACKLIST_PREFIX + jti) }, 'token_blacklist_check_failed')
    return false
  }
}
