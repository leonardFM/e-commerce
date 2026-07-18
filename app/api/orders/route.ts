import { NextRequest } from 'next/server'
import { failure, success } from '@/lib/response'
import { requireUser } from '@/lib/request'
import { createOrderSchema } from '@/modules/orders/order.schema'
import { createOrderService, listOrdersService } from '@/modules/orders/order.service'

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

export async function POST(request: NextRequest) {
  let userId: number | undefined
  try {
    const user = await requireUser(request)
    userId = user.userId
    const body = createOrderSchema.parse(await request.json())
    return success(await createOrderService(user.userId, body), 201)
  } catch (error) {
    return failure(error, { feature: 'orders', method: request.method, path: request.nextUrl.pathname, userId })
  }
}
