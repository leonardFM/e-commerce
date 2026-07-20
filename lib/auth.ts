import { decodeJwt, jwtVerify, SignJWT } from 'jose'
import crypto from 'node:crypto'
import { AppError } from './errors'

const encoder = new TextEncoder()

function getJwtSecret() {
  const secret = process.env.JWT_SECRET
  if (!secret) throw new AppError('JWT_SECRET is not configured', 500)
  if (secret.length < 32) throw new AppError('JWT_SECRET must be at least 32 characters long', 500)
  if (secret === 'change-me-in-production') throw new AppError('JWT_SECRET must not be the default placeholder', 500)
  return encoder.encode(secret)
}

export type JwtUser = {
  userId: number
  email: string
  role: 'ADMIN' | 'CUSTOMER'
}

export async function signJwt(user: JwtUser) {
  return new SignJWT({ email: user.email, role: user.role, jti: crypto.randomUUID() })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(String(user.userId))
    .setIssuedAt()
    .setExpirationTime('10m')
    .sign(getJwtSecret())
}

export function getJwtId(token: string): string | null {
  try {
    const { jti } = decodeJwt(token)
    return typeof jti === 'string' && jti.length > 0 ? jti : null
  } catch {
    return null
  }
}

export function getJwtExp(token: string): number | null {
  try {
    const { exp } = decodeJwt(token)
    return typeof exp === 'number' ? exp : null
  } catch {
    return null
  }
}

export async function verifyJwt(token: string): Promise<JwtUser> {
  const { payload } = await jwtVerify(token, getJwtSecret())
  const userId = payload.sub ? Number(payload.sub) : NaN
  const role = payload.role

  if (!userId || Number.isNaN(userId)) throw new AppError('Invalid token', 401)
  if (role !== 'ADMIN' && role !== 'CUSTOMER') throw new AppError('Invalid token', 401)

  return {
    userId,
    email: String(payload.email ?? ''),
    role,
  }
}

export function getBearerToken(headerValue: string | null) {
  if (!headerValue) return null
  const parts = headerValue.split(' ')
  if (parts.length !== 2) return null
  const [type, token] = parts
  if (type !== 'Bearer' || !token) return null
  return token
}
