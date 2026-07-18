import { PrismaClient } from '@prisma/client'
import { logger } from './logger'
import { elapsedMs, getThresholdMs, startTimer } from './performance'

const SLOW_QUERY_THRESHOLD_MS = getThresholdMs(process.env.SLOW_QUERY_THRESHOLD_MS, 100)

function createPrismaClient() {
  return new PrismaClient().$extends({
    query: {
      $allModels: {
        async $allOperations({ model, operation, args, query }) {
          const start = startTimer()
          const queryModel = model ?? 'raw'

          try {
            const result = await query(args)
            const durationMs = elapsedMs(start)
            const payload = { model: queryModel, action: operation, durationMs }

            if (durationMs >= SLOW_QUERY_THRESHOLD_MS) {
              logger.warn({ ...payload, thresholdMs: SLOW_QUERY_THRESHOLD_MS }, 'prisma_slow_query')
            } else {
              logger.debug(payload, 'prisma_query_performance')
            }

            return result
          } catch (error) {
            logger.error({ err: error, model: queryModel, action: operation, durationMs: elapsedMs(start) }, 'prisma_query_failed')
            throw error
          }
        },
      },
    },
  })
}

const globalForPrisma = globalThis as unknown as {
  prisma: ReturnType<typeof createPrismaClient> | undefined
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
