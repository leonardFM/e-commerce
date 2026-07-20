import { NextRequest } from 'next/server'
import { AppError } from '@/lib/errors'
import { assertFailedLoginRateLimit, incrementFailedLoginRateLimit } from '@/lib/rate-limit'
import { failure, success } from '@/lib/response'
import { getClientIp, getJsonBody, requireUser } from '@/lib/request'
import { checkoutSchema } from '@/modules/checkout/checkout.schema'
import { checkoutService } from '@/modules/checkout/checkout.service'

const CHECKOUT_LIMIT = 10
const CHECKOUT_WINDOW_SECONDS = 3600

/**
 * @openapi
 * /api/checkout:
 *   post:
 *     tags: [Checkout]
 *     summary: Checkout — create order from cart (customer only)
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               paymentMethod:
 *                 type: string
 *                 enum: [BANK_TRANSFER, EWALLET, COD]
 *               shippingName: { type: string }
 *               shippingPhone: { type: string }
 *               shippingAddress: { type: string }
 *               shippingCity: { type: string }
 *               shippingPostalCode: { type: string }
 *               shippingCost: { type: number, default: 0 }
 *               simulatePaymentStatus:
 *                 type: string
 *                 enum: [PAID, PENDING, FAILED]
 *     responses:
 *       201:
 *         description: Order created
 *       409:
 *         description: Insufficient stock or checkout in progress
 */
export async function POST(request: NextRequest) {
  let userId: number | undefined
  try {
    const user = await requireUser(request)
    userId = user.userId
    const ip = getClientIp(request)
    const checkoutKey = `rate-limit:checkout:${user.userId}:ip:${ip}`
    await assertFailedLoginRateLimit({ key: checkoutKey, limit: CHECKOUT_LIMIT, windowSeconds: CHECKOUT_WINDOW_SECONDS })
    const body = checkoutSchema.parse(await getJsonBody(request))
    await incrementFailedLoginRateLimit({ key: checkoutKey, limit: CHECKOUT_LIMIT, windowSeconds: CHECKOUT_WINDOW_SECONDS })
    return success(await checkoutService(user.userId, body), 201)
  } catch (error) {
    return failure(error, { feature: 'checkout', method: request.method, path: request.nextUrl.pathname, userId })
  }
}
