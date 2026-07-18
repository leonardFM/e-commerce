import { NextRequest } from 'next/server'
import { failure, success } from '@/lib/response'
import { requireRole } from '@/lib/request'
import { listOrdersQuerySchema } from '@/modules/orders/order.schema'
import { listAdminOrdersService } from '@/modules/orders/order.service'

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
