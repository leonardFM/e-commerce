import { NextRequest, NextResponse } from 'next/server'
import { clearCookieOptions, getTokenFromRequest } from '@/lib/cookies'
import { addToBlacklist } from '@/lib/token-blacklist'
import { requireUser } from '@/lib/request'

export async function POST(request: NextRequest) {
  await requireUser(request)

  const token = getTokenFromRequest(request)
  if (token) {
    await addToBlacklist(token)
  }

  const res = NextResponse.json({ data: { message: 'Logged out' } })
  res.cookies.set('token', '', clearCookieOptions())
  return res
}
