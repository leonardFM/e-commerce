import Redis from 'ioredis'

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
  }

  return globalForRedis.redis
}
