import { NextRequest } from 'next/server'
import { registerSchema } from '@/modules/auth/auth.schema'
import { registerCustomer } from '@/modules/auth/auth.service'
import { cookieOptions } from '@/lib/cookies'
import { failure, success } from '@/lib/response'
import { getClientIp, getJsonBody } from '@/lib/request'

/**
 * @openapi
 * /api/auth/register:
 *   post:
 *     tags: [Auth]
 *     summary: Register new customer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email: { type: string, example: user@example.com }
 *               password: { type: string, minLength: 10, example: password123 }
 *               name: { type: string, nullable: true, example: John }
 *     responses:
 *       201:
 *         description: Registration successful — returns user data
 *       409:
 *         description: Registration failed (duplicate email)
 */
export async function POST(request: NextRequest) {
  try {
    const body = registerSchema.parse(await getJsonBody(request))
    const result = await registerCustomer(body, getClientIp(request))
    const { user, token } = result
    const res = success({ token, user }, 201)
    res.cookies.set('token', result.token, cookieOptions())
    return res
  } catch (error) {
    return failure(error, { feature: 'auth_register', method: request.method, path: request.nextUrl.pathname })
  }
}
