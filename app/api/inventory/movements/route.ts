import { NextRequest } from 'next/server'
import { failure, success } from '@/lib/response'
import { requireRole } from '@/lib/request'
import { listInventoryMovementsQuerySchema } from '@/modules/inventory/inventory.schema'
import { listInventoryMovementsService } from '@/modules/inventory/inventory.service'

/**
 * @openapi
 * /api/inventory/movements:
 *   get:
 *     tags: [Inventory]
 *     summary: List inventory movements (admin only)
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 10, maximum: 100 }
 *       - in: query
 *         name: productId
 *         schema: { type: integer }
 *       - in: query
 *         name: type
 *         schema: { type: string, enum: [ORDER_CHECKOUT, ADMIN_ADJUSTMENT] }
 *     responses:
 *       200:
 *         description: Paginated inventory movements
 *       403:
 *         description: Forbidden (not admin)
 */
export async function GET(request: NextRequest) {
  let userId: number | undefined
  try {
    const user = await requireRole(request, 'ADMIN')
    userId = user.userId
    const query = listInventoryMovementsQuerySchema.parse(Object.fromEntries(request.nextUrl.searchParams))
    return success(await listInventoryMovementsService(query))
  } catch (error) {
    return failure(error, { feature: 'inventory_movements', method: request.method, path: request.nextUrl.pathname, userId })
  }
}
