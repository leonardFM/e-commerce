import bcrypt from 'bcryptjs'
import { AppError } from '@/lib/errors'
import { signJwt } from '@/lib/auth'
import { assertFailedLoginRateLimit, incrementFailedLoginRateLimit, resetFailedLoginRateLimit } from '@/lib/rate-limit'
import { findUserByEmail } from './auth.repository'
import type { LoginInput } from './auth.types'

const LOGIN_RATE_LIMIT_ATTEMPTS = 5
const LOGIN_RATE_LIMIT_WINDOW_SECONDS = 10 * 60

function loginRateLimitKey(email: string) {
  return `rate-limit:login:${email.trim().toLowerCase()}`
}

export async function login(input: LoginInput) {
  const email = input.email.trim().toLowerCase()
  const rateLimitKey = loginRateLimitKey(email)
  const rateLimitOptions = {
    key: rateLimitKey,
    limit: LOGIN_RATE_LIMIT_ATTEMPTS,
    windowSeconds: LOGIN_RATE_LIMIT_WINDOW_SECONDS,
  }

  await assertFailedLoginRateLimit(rateLimitOptions)

  const user = await findUserByEmail(email)
  if (!user) {
    await incrementFailedLoginRateLimit(rateLimitOptions)
    throw new AppError('Invalid credentials', 401)
  }

  const isValid = await bcrypt.compare(input.password, user.passwordHash)
  if (!isValid) {
    await incrementFailedLoginRateLimit(rateLimitOptions)
    throw new AppError('Invalid credentials', 401)
  }

  const token = await signJwt({ userId: user.id, email: user.email, role: user.role })
  await resetFailedLoginRateLimit(rateLimitKey)

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
