import { NextRequest } from 'next/server'
import { failure, success } from '@/lib/response'
import { requireRole } from '@/lib/request'
import { listInventoryMovementsQuerySchema } from '@/modules/inventory/inventory.schema'
import { listInventoryMovementsService } from '@/modules/inventory/inventory.service'

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
