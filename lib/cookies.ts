import type { NextRequest } from 'next/server'
import type { ResponseCookie } from 'next/dist/compiled/@edge-runtime/cookies'
import { getBearerToken } from './auth'

export const COOKIE_NAME = 'token'

export function cookieOptions(): Partial<ResponseCookie> {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 600,
  }
}

export function clearCookieOptions(): Partial<ResponseCookie> {
  return { ...cookieOptions(), value: '', maxAge: 0 }
}

export function getTokenFromRequest(request: NextRequest): string | null {
  const fromHeader = getBearerToken(request.headers.get('authorization'))
  if (fromHeader) return fromHeader
  return request.cookies.get(COOKIE_NAME)?.value ?? null
}
