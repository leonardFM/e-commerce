import type { NextRequest } from 'next/server'
import { AppError } from './errors'
import { getBearerToken, verifyJwt } from './auth'

export async function requireUser(request: NextRequest) {
  const token = getBearerToken(request.headers.get('authorization'))
  if (!token) throw new AppError('Unauthorized', 401)

  return verifyJwt(token)
}

export function getJsonBody<T>(request: NextRequest): Promise<T> {
  return request.json()
}
