import { NextRequest } from 'next/server'
import { failure, success } from '@/lib/response'
import { getJsonBody, requireRole } from '@/lib/request'
import { inventoryAdjustmentSchema } from '@/modules/inventory/inventory.schema'
import { createInventoryAdjustmentService } from '@/modules/inventory/inventory.service'

/**
 * @openapi
 * /api/inventory/adjustments:
 *   post:
 *     tags: [Inventory]
 *     summary: Create inventory adjustment (admin only)
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
 *               quantityChange: { type: integer, example: 10 }
 *               note: { type: string }
 *     responses:
 *       201:
 *         description: Adjustment created
 *       409:
 *         description: Adjustment would make stock negative
 */
export async function POST(request: NextRequest) {
  let userId: number | undefined
  try {
    const user = await requireRole(request, 'ADMIN')
    userId = user.userId
    const body = inventoryAdjustmentSchema.parse(await getJsonBody(request))
    return success(await createInventoryAdjustmentService(user.userId, body), 201)
  } catch (error) {
    return failure(error, { feature: 'inventory_adjustments', method: request.method, path: request.nextUrl.pathname, userId })
  }
}
