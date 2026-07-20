import { NextRequest } from 'next/server'
import { failure, success } from '@/lib/response'
import { getJsonBody, requireUser } from '@/lib/request'
import { updateCartItemSchema } from '@/modules/cart/cart.schema'
import { removeCartItemService, updateCartItemService } from '@/modules/cart/cart.service'
import { parsePositiveInt } from '@/lib/param'

/**
 * @openapi
 * /api/cart/items/{productId}:
 *   patch:
 *     tags: [Cart]
 *     summary: Update cart item quantity (customer only)
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema: { type: integer }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               quantity: { type: integer, minimum: 0, example: 3 }
 *     responses:
 *       200:
 *         description: Cart item updated (quantity 0 = remove)
 */
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ productId: string }> }) {
  let userId: number | undefined
  try {
    const user = await requireUser(request)
    userId = user.userId
    const { productId } = await params
    const body = updateCartItemSchema.parse(await getJsonBody(request))
    return success(await updateCartItemService(user.userId, parsePositiveInt(productId, 'product'), body))
  } catch (error) {
    return failure(error, { feature: 'cart_items', method: request.method, path: request.nextUrl.pathname, userId })
  }
}

/**
 * @openapi
 * /api/cart/items/{productId}:
 *   delete:
 *     tags: [Cart]
 *     summary: Remove item from cart (customer only)
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Cart item removed
 */
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ productId: string }> }) {
  let userId: number | undefined
  try {
    const user = await requireUser(request)
    userId = user.userId
    const { productId } = await params
    return success(await removeCartItemService(user.userId, parsePositiveInt(productId, 'product')))
  } catch (error) {
    return failure(error, { feature: 'cart_items', method: request.method, path: request.nextUrl.pathname, userId })
  }
}
