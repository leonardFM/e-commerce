import { createHash } from 'crypto'
import { mkdirSync } from 'fs'
import { dirname } from 'path'
import pino from 'pino'

const defaultLevel = process.env.NODE_ENV === 'development' ? 'debug' : 'info'
const logDestination = process.env.LOG_DESTINATION ?? 'stdout'
const logFilePath = process.env.LOG_FILE_PATH ?? 'logs/app.jsonl'

const loggerOptions = {
  level: process.env.LOG_LEVEL ?? defaultLevel,
  redact: {
    paths: [
      'password',
      'passwordHash',
      'token',
      'authorization',
      'Authorization',
      'headers.authorization',
      'headers.Authorization',
      'input.password',
      'body.password',
      'req.headers.authorization',
      'request.headers.authorization',
      '*.password',
      '*.passwordHash',
      '*.token',
      '*.authorization',
      '*.Authorization',
      '*.accessToken',
      '*.refreshToken',
      '*.jwt',
      '*.paymentReference',
    ],
    censor: '[REDACTED]',
  },
}

function createLogger() {
  if (logDestination !== 'file') return pino(loggerOptions)

  mkdirSync(dirname(logFilePath), { recursive: true })
  return pino(loggerOptions, pino.destination({ dest: logFilePath, sync: true }))
}

export const logger = createLogger()

export function logHash(value: string) {
  return createHash('sha256').update(value).digest('hex').slice(0, 16)
}
