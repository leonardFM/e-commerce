import Redis from 'ioredis'
import { logger } from './logger'

const globalForRedis = globalThis as unknown as {
  redis?: Redis
}

export function getRedis() {
  const redisUrl = process.env.REDIS_URL
  if (!redisUrl) return null

  if (!globalForRedis.redis) {
    globalForRedis.redis = new Redis(redisUrl, {
      lazyConnect: true,
      maxRetriesPerRequest: 1,
      enableOfflineQueue: false,
    })

    globalForRedis.redis.on('error', (err: Error) => {
      logger.warn({ err: { message: err.message, name: err.name } }, 'redis_connection_error')
    })
  }

  return globalForRedis.redis
}
