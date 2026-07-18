import { NextRequest } from 'next/server'
import { AppError } from '@/lib/errors'
import { failure, success } from '@/lib/response'
import { requireRole } from '@/lib/request'
import { updateOrderStatusSchema } from '@/modules/orders/order.schema'
import { updateOrderStatusService } from '@/modules/orders/order.service'

function parseId(value: string) {
  const id = Number(value)
  if (!Number.isInteger(id) || id <= 0) throw new AppError('Invalid order id', 400)
  return id
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireRole(request, 'ADMIN')
    const { id } = await params
    const body = updateOrderStatusSchema.parse(await request.json())
    return success(await updateOrderStatusService(parseId(id), body.status))
  } catch (error) {
    return failure(error)
  }
}
