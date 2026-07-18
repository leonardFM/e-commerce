import { NextRequest } from 'next/server'
import { failure, success } from '@/lib/response'
import { requireRole } from '@/lib/request'
import { listOrdersQuerySchema } from '@/modules/orders/order.schema'
import { listAdminOrdersService } from '@/modules/orders/order.service'

export async function GET(request: NextRequest) {
  try {
    await requireRole(request, 'ADMIN')
    const query = listOrdersQuerySchema.parse(Object.fromEntries(request.nextUrl.searchParams))
    return success(await listAdminOrdersService(query))
  } catch (error) {
    return failure(error)
  }
}
