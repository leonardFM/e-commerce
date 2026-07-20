import { NextRequest } from 'next/server'
import { AppError } from '@/lib/errors'
import { failure, success } from '@/lib/response'
import { getJsonBody, requireRole } from '@/lib/request'
import { updateOrderPaymentSchema } from '@/modules/orders/order.schema'
import { updateOrderPaymentService } from '@/modules/orders/order.service'

function parseId(value: string) {
  const id = Number(value)
  if (!Number.isInteger(id) || id <= 0) throw new AppError('Invalid order id', 400)
  return id
}

/**
 * @openapi
 * /api/admin/orders/{id}/payment:
 *   patch:
 *     tags: [Admin Orders]
 *     summary: Update payment status (admin only)
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
 *               paymentStatus:
 *                 type: string
 *                 enum: [PENDING, PAID]
 *     responses:
 *       200:
 *         description: Payment status updated
 *       409:
 *         description: Cannot change payment from PAID to PENDING
 */
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  let userId: number | undefined
  try {
    const user = await requireRole(request, 'ADMIN')
    userId = user.userId
    const { id } = await params
    const body = updateOrderPaymentSchema.parse(await getJsonBody(request))
    return success(await updateOrderPaymentService(parseId(id), body.paymentStatus))
  } catch (error) {
    return failure(error, { feature: 'admin_orders_payment', method: request.method, path: request.nextUrl.pathname, userId })
  }
}
