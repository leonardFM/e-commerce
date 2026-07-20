import { NextRequest } from 'next/server'
import { failure, success } from '@/lib/response'
import { requireUser } from '@/lib/request'
import { getOrderService } from '@/modules/orders/order.service'
import { parsePositiveInt } from '@/lib/param'

/**
 * @openapi
 * /api/orders/{id}:
 *   get:
 *     tags: [Orders]
 *     summary: Get own order detail (customer)
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Order detail
 *       404:
 *         description: Order not found
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  let userId: number | undefined
  try {
    const user = await requireUser(request)
    userId = user.userId
    const { id } = await params
    return success(await getOrderService(user.userId, parsePositiveInt(id, 'order')))
  } catch (error) {
    return failure(error, { feature: 'orders', method: request.method, path: request.nextUrl.pathname, userId })
  }
}
