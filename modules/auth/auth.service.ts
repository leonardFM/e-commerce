import bcrypt from 'bcryptjs'
import { Prisma } from '@prisma/client'
import { AppError } from '@/lib/errors'
import { logHash, logger } from '@/lib/logger'
import { signJwt } from '@/lib/auth'
import { assertFailedLoginRateLimit, incrementFailedLoginRateLimit, resetFailedLoginRateLimit } from '@/lib/rate-limit'
import { createCustomerUser, findUserByEmail } from './auth.repository'
import type { LoginInput, RegisterInput } from './auth.types'

const LOGIN_RATE_LIMIT_ATTEMPTS = 5
const LOGIN_RATE_LIMIT_WINDOW_SECONDS = 10 * 60
const REGISTER_RATE_LIMIT_ATTEMPTS = 3
const REGISTER_RATE_LIMIT_WINDOW_SECONDS = 60 * 60
const GLOBAL_THROTTLE_LIMIT = 20
const GLOBAL_THROTTLE_WINDOW_SECONDS = 60

function loginRateLimitKey(email: string, ip: string) {
  return `rate-limit:login:${email.trim().toLowerCase()}:ip:${ip}`
}

function globalRateLimitKey(ip: string) {
  return `rate-limit:global:${ip}`
}

function registerRateLimitKey(ip: string) {
  return `rate-limit:register:${ip}`
}

function authResponse(user: { id: number; email: string; name: string | null; role: 'ADMIN' | 'CUSTOMER' }, token: string) {
  return {
    token,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    },
  }
}

export async function login(input: LoginInput, ip = 'unknown') {
  const email = input.email.trim().toLowerCase()
  const emailIpKey = loginRateLimitKey(email, ip)
  const globalKey = globalRateLimitKey(ip)
  const emailHash = logHash(email)
  const rateLimitOptions = {
    key: emailIpKey,
    limit: LOGIN_RATE_LIMIT_ATTEMPTS,
    windowSeconds: LOGIN_RATE_LIMIT_WINDOW_SECONDS,
  }

  try {
    await assertFailedLoginRateLimit(rateLimitOptions)
    await assertFailedLoginRateLimit({ key: globalKey, limit: GLOBAL_THROTTLE_LIMIT, windowSeconds: GLOBAL_THROTTLE_WINDOW_SECONDS })
  } catch (error) {
    logger.warn({ emailHash }, 'auth_login_rate_limited')
    throw error
  }

  const user = await findUserByEmail(email)
  if (!user) {
    await incrementFailedLoginRateLimit(rateLimitOptions)
    await incrementFailedLoginRateLimit({ key: globalKey, limit: GLOBAL_THROTTLE_LIMIT, windowSeconds: GLOBAL_THROTTLE_WINDOW_SECONDS })
    logger.warn({ emailHash }, 'auth_login_failed')
    throw new AppError('Invalid credentials', 401)
  }

  const isValid = await bcrypt.compare(input.password, user.passwordHash)
  if (!isValid) {
    await incrementFailedLoginRateLimit(rateLimitOptions)
    await incrementFailedLoginRateLimit({ key: globalKey, limit: GLOBAL_THROTTLE_LIMIT, windowSeconds: GLOBAL_THROTTLE_WINDOW_SECONDS })
    logger.warn({ emailHash, userId: user.id }, 'auth_login_failed')
    throw new AppError('Invalid credentials', 401)
  }

  const token = await signJwt({ userId: user.id, email: user.email, role: user.role })
  await resetFailedLoginRateLimit(emailIpKey)
  await resetFailedLoginRateLimit(globalKey)
  logger.info({ emailHash, userId: user.id, role: user.role }, 'auth_login_succeeded')

  return authResponse(user, token)
}

export async function registerCustomer(input: RegisterInput, ip = 'unknown') {
  const email = input.email.trim().toLowerCase()
  const name = input.name?.trim() || null
  const emailHash = logHash(email)

  const registerKey = registerRateLimitKey(ip)
  try {
    await assertFailedLoginRateLimit({ key: registerKey, limit: REGISTER_RATE_LIMIT_ATTEMPTS, windowSeconds: REGISTER_RATE_LIMIT_WINDOW_SECONDS })
  } catch (error) {
    logger.warn({ emailHash }, 'auth_register_rate_limited')
    throw error
  }

  const existingUser = await findUserByEmail(email)
  if (existingUser) {
    await incrementFailedLoginRateLimit({ key: registerKey, limit: REGISTER_RATE_LIMIT_ATTEMPTS, windowSeconds: REGISTER_RATE_LIMIT_WINDOW_SECONDS })
    logger.warn({ emailHash }, 'auth_register_duplicate_email')
    throw new AppError('Registration failed', 409)
  }

  const passwordHash = await bcrypt.hash(input.password, 10)

  try {
    const user = await createCustomerUser({ email, passwordHash, name })
    const token = await signJwt({ userId: user.id, email: user.email, role: user.role })
    await resetFailedLoginRateLimit(registerKey)
    logger.info({ emailHash, userId: user.id, role: user.role }, 'auth_register_succeeded')

    return authResponse(user, token)
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      await incrementFailedLoginRateLimit({ key: registerKey, limit: REGISTER_RATE_LIMIT_ATTEMPTS, windowSeconds: REGISTER_RATE_LIMIT_WINDOW_SECONDS })
      logger.warn({ emailHash }, 'auth_register_duplicate_email')
      throw new AppError('Registration failed', 409)
    }

    throw error
  }
}
