import { NextRequest } from 'next/server'
import { failure, success } from '@/lib/response'
import { requireRole } from '@/lib/request'
import { listOrdersQuerySchema } from '@/modules/orders/order.schema'
import { listAdminOrdersService } from '@/modules/orders/order.service'

/**
 * @openapi
 * /api/admin/orders:
 *   get:
 *     tags: [Admin Orders]
 *     summary: List all orders (admin only)
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 10, maximum: 100 }
 *     responses:
 *       200:
 *         description: Paginated list of all orders
 *       403:
 *         description: Forbidden (not admin)
 */
export async function GET(request: NextRequest) {
  let userId: number | undefined
  try {
    const user = await requireRole(request, 'ADMIN')
    userId = user.userId
    const query = listOrdersQuerySchema.parse(Object.fromEntries(request.nextUrl.searchParams))
    return success(await listAdminOrdersService(query))
  } catch (error) {
    return failure(error, { feature: 'admin_orders', method: request.method, path: request.nextUrl.pathname, userId })
  }
}
