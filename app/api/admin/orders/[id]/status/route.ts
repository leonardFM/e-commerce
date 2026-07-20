import { NextRequest } from 'next/server'
import { AppError } from '@/lib/errors'
import { failure, success } from '@/lib/response'
import { getJsonBody, requireRole } from '@/lib/request'
import { updateOrderStatusSchema } from '@/modules/orders/order.schema'
import { updateOrderStatusService } from '@/modules/orders/order.service'

function parseId(value: string) {
  const id = Number(value)
  if (!Number.isInteger(id) || id <= 0) throw new AppError('Invalid order id', 400)
  return id
}

/**
 * @openapi
 * /api/admin/orders/{id}/status:
 *   patch:
 *     tags: [Admin Orders]
 *     summary: Update order status (admin only)
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [PENDING, PAID, PROCESSING, SHIPPED, COMPLETED]
 *     responses:
 *       200:
 *         description: Order status updated
 *       409:
 *         description: Invalid status transition
 */
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  let userId: number | undefined
  try {
    const user = await requireRole(request, 'ADMIN')
    userId = user.userId
    const { id } = await params
    const body = updateOrderStatusSchema.parse(await getJsonBody(request))
    return success(await updateOrderStatusService(parseId(id), body.status))
  } catch (error) {
    return failure(error, { feature: 'admin_orders_status', method: request.method, path: request.nextUrl.pathname, userId })
  }
}
