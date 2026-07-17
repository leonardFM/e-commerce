import { jwtVerify, SignJWT } from 'jose'
import { AppError } from './errors'

const encoder = new TextEncoder()

function getJwtSecret() {
  const secret = process.env.JWT_SECRET
  if (!secret) throw new AppError('JWT_SECRET is not configured', 500)
  return encoder.encode(secret)
}

export type JwtUser = {
  userId: number
  email: string
}

export async function signJwt(user: JwtUser) {
  return new SignJWT({ email: user.email })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(String(user.userId))
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(getJwtSecret())
}

export async function verifyJwt(token: string) {
  const { payload } = await jwtVerify(token, getJwtSecret())
  const userId = payload.sub ? Number(payload.sub) : NaN

  if (!userId || Number.isNaN(userId)) throw new AppError('Invalid token', 401)

  return {
    userId,
    email: String(payload.email ?? ''),
  }
}

export function getBearerToken(headerValue: string | null) {
  if (!headerValue) return null
  const [type, token] = headerValue.split(' ')
  if (type !== 'Bearer' || !token) return null
  return token
}
