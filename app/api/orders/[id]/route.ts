import { NextRequest } from 'next/server'
import { AppError } from '@/lib/errors'
import { failure, success } from '@/lib/response'
import { requireUser } from '@/lib/request'
import { getOrderService } from '@/modules/orders/order.service'

function parseId(value: string) {
  const id = Number(value)
  if (!Number.isInteger(id) || id <= 0) throw new AppError('Invalid order id', 400)
  return id
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireUser(request)
    const { id } = await params
    return success(await getOrderService(user.userId, parseId(id)))
  } catch (error) {
    return failure(error)
  }
}
