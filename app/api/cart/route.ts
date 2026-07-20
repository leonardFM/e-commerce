import { NextRequest } from 'next/server'
import { failure, success } from '@/lib/response'
import { requireUser } from '@/lib/request'
import { clearCartService, getCartService } from '@/modules/cart/cart.service'

/**
 * @openapi
 * /api/cart:
 *   get:
 *     tags: [Cart]
 *     summary: Get current cart (customer only)
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Current cart with items
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   $ref: '#/components/schemas/CartRecord'
 */
export async function GET(request: NextRequest) {
  let userId: number | undefined
  try {
    const user = await requireUser(request)
    userId = user.userId
    return success(await getCartService(user.userId))
  } catch (error) {
    return failure(error, { feature: 'cart', method: request.method, path: request.nextUrl.pathname, userId })
  }
}

/**
 * @openapi
 * /api/cart:
 *   delete:
 *     tags: [Cart]
 *     summary: Clear cart (customer only)
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Cart cleared
 */
export async function DELETE(request: NextRequest) {
  let userId: number | undefined
  try {
    const user = await requireUser(request)
    userId = user.userId
    return success(await clearCartService(user.userId))
  } catch (error) {
    return failure(error, { feature: 'cart', method: request.method, path: request.nextUrl.pathname, userId })
  }
}
