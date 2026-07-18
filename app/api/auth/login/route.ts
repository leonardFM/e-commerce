import { NextRequest } from 'next/server'
import { loginSchema } from '@/modules/auth/auth.schema'
import { login } from '@/modules/auth/auth.service'
import { failure, success } from '@/lib/response'

export async function POST(request: NextRequest) {
  try {
    const body = loginSchema.parse(await request.json())
    return success(await login(body))
  } catch (error) {
    return failure(error, { feature: 'auth_login', method: request.method, path: request.nextUrl.pathname })
  }
}
