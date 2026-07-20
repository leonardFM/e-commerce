import { NextRequest } from 'next/server'
import { failure, success } from '@/lib/response'
import { requireUser } from '@/lib/request'
import { listOrdersService } from '@/modules/orders/order.service'

/**
 * @openapi
 * /api/orders:
 *   get:
 *     tags: [Orders]
 *     summary: List own orders (customer)
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: List of orders
 */
export async function GET(request: NextRequest) {
  let userId: number | undefined
  try {
    const user = await requireUser(request)
    userId = user.userId
    return success(await listOrdersService(user.userId))
  } catch (error) {
    return failure(error, { feature: 'orders', method: request.method, path: request.nextUrl.pathname, userId })
  }
}
