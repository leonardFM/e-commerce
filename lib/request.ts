import { decodeJwt } from 'jose'
import type { NextRequest } from 'next/server'
import { AppError } from './errors'
import { signJwt, verifyJwt, type JwtUser } from './auth'
import { getTokenFromRequest } from './cookies'
import { prisma } from './prisma'
import { isBlacklisted } from './token-blacklist'
import { als, setNewToken, setUserId } from './token-context'

type UserRole = JwtUser['role']

export async function requireUser(request: NextRequest) {
  // Inisialisasi AsyncLocalStorage untuk token context sliding session
  // enterWith() aman dipanggil meski sudah ada store sebelumnya
  als.enterWith({})
  const token = getTokenFromRequest(request)
  if (!token) throw new AppError('Unauthorized', 401)

  let jwtUser: JwtUser
  try {
    jwtUser = await verifyJwt(token)
  } catch (error) {
    if (error instanceof AppError) throw error
    throw new AppError('Invalid token', 401)
  }

  if (await isBlacklisted(token)) {
    throw new AppError('Unauthorized', 401)
  }

  const dbUser = await prisma.user.findUnique({
    where: { id: jwtUser.userId },
    select: { id: true, email: true, role: true },
  })

  if (!dbUser) throw new AppError('Unauthorized', 401)

  setUserId(dbUser.id)

  // Sliding session: refresh token jika sisa validitas < 2 menit
  try {
    const payload = decodeJwt(token)
    const exp = payload.exp
    if (exp) {
      const remainingSeconds = exp - Date.now() / 1000
      if (remainingSeconds < 120) {
        const newToken = await signJwt({
          userId: dbUser.id,
          email: dbUser.email,
          role: dbUser.role as 'ADMIN' | 'CUSTOMER',
        })
        setNewToken(newToken)
      }
    }
  } catch {
    // Gagal decode exp — lanjutkan tanpa refresh
  }

  return {
    userId: dbUser.id,
    email: dbUser.email,
    role: dbUser.role as 'ADMIN' | 'CUSTOMER',
  }
}

export async function requireRole(request: NextRequest, role: UserRole) {
  const user = await requireUser(request)
  if (user.role !== role) throw new AppError('Forbidden', 403)

  return user
}

const MAX_BODY_SIZE = 100_000 // 100KB

export async function getJsonBody<T>(request: NextRequest): Promise<T> {
  const text = await request.text()
  if (text.length > MAX_BODY_SIZE) {
    throw new AppError('Request body too large', 413)
  }
  return JSON.parse(text) as T
}

export function getClientIp(request: NextRequest): string {
  return request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    || request.headers.get('x-real-ip')?.trim()
    || 'unknown'
}
