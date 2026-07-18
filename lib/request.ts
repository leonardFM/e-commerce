import type { NextRequest } from 'next/server'
import { AppError } from './errors'
import { getBearerToken, verifyJwt, type JwtUser } from './auth'

type UserRole = JwtUser['role']

export async function requireUser(request: NextRequest) {
  const token = getBearerToken(request.headers.get('authorization'))
  if (!token) throw new AppError('Unauthorized', 401)

  try {
    return await verifyJwt(token)
  } catch (error) {
    if (error instanceof AppError) throw error
    throw new AppError('Invalid token', 401)
  }
}

export async function requireRole(request: NextRequest, role: UserRole) {
  const user = await requireUser(request)
  if (user.role !== role) throw new AppError('Forbidden', 403)

  return user
}

export function getJsonBody<T>(request: NextRequest): Promise<T> {
  return request.json()
}
