import { NextRequest } from 'next/server'
import { failure, success } from '@/lib/response'
import { getJsonBody, requireUser } from '@/lib/request'
import { addCartItemSchema } from '@/modules/cart/cart.schema'
import { addCartItemService } from '@/modules/cart/cart.service'

/**
 * @openapi
 * /api/cart/items:
 *   post:
 *     tags: [Cart]
 *     summary: Add item to cart (customer only)
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               productId: { type: integer, example: 1 }
 *               quantity: { type: integer, default: 1, example: 2 }
 *     responses:
 *       201:
 *         description: Item added to cart
 *       409:
 *         description: Quantity exceeds product stock
 */
export async function POST(request: NextRequest) {
  let userId: number | undefined
  try {
    const user = await requireUser(request)
    userId = user.userId
    const body = addCartItemSchema.parse(await getJsonBody(request))
    return success(await addCartItemService(user.userId, body), 201)
  } catch (error) {
    return failure(error, { feature: 'cart_items', method: request.method, path: request.nextUrl.pathname, userId })
  }
}
