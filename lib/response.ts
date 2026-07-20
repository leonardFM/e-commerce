import { NextResponse } from 'next/server'
import { AppError } from './errors'
import { ZodError } from 'zod'
import { cookieOptions } from './cookies'
import { logger } from './logger'
import { getNewToken } from './token-context'

export type FailureContext = {
  feature?: string
  method?: string
  path?: string
  userId?: number
}

export function success<T>(data: T, status = 200) {
  const newToken = getNewToken()
  const res = NextResponse.json({ data }, { status })
  if (newToken) {
    res.cookies.set('token', newToken, cookieOptions())
  }
  return res
}

export function failure(error: unknown, context: FailureContext = {}) {
  if (error instanceof ZodError) {
    logger.warn({ ...context, statusCode: 400, issueCount: error.issues.length }, 'api_validation_error')
    const sanitizedIssues = error.issues.map((issue) => ({
      path: issue.path,
      code: issue.code,
      message: issue.message,
    }))
    return NextResponse.json({ error: 'Validation error', issues: sanitizedIssues }, { status: 400 })
  }

  if (error instanceof AppError) {
    const logPayload = { ...context, statusCode: error.statusCode, error: error.message }
    if (error.statusCode === 404) logger.debug(logPayload, 'api_app_error')
    else logger.warn(logPayload, 'api_app_error')
    return NextResponse.json({ error: error.message }, { status: error.statusCode })
  }

  if (error instanceof Error) {
    logger.error({ err: error, ...context }, 'unhandled_api_error')
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }

  logger.error({ error, ...context }, 'unknown_api_error')
  return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
}
