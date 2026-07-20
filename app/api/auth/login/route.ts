import { NextRequest } from 'next/server'
import { loginSchema } from '@/modules/auth/auth.schema'
import { login } from '@/modules/auth/auth.service'
import { cookieOptions } from '@/lib/cookies'
import { failure, success } from '@/lib/response'
import { getClientIp, getJsonBody } from '@/lib/request'

/**
 * @openapi
 * /api/auth/login:
 *   post:
 *     tags: [Auth]
 *     summary: Login user
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email: { type: string, example: admin@solutech.test }
 *               password: { type: string, example: password123 }
 *     responses:
 *       200:
 *         description: Login successful — returns user data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   $ref: '#/components/schemas/AuthResponse'
 *       401:
 *         description: Invalid credentials
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
export async function POST(request: NextRequest) {
  try {
    const body = loginSchema.parse(await getJsonBody(request))
    const result = await login(body, getClientIp(request))
    const { user, token } = result
    const res = success({ token, user })
    res.cookies.set('token', result.token, cookieOptions())
    return res
  } catch (error) {
    return failure(error, { feature: 'auth_login', method: request.method, path: request.nextUrl.pathname })
  }
}
