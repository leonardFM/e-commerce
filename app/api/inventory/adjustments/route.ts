import { NextRequest } from 'next/server'
import { failure, success } from '@/lib/response'
import { requireRole } from '@/lib/request'
import { inventoryAdjustmentSchema } from '@/modules/inventory/inventory.schema'
import { createInventoryAdjustmentService } from '@/modules/inventory/inventory.service'

export async function POST(request: NextRequest) {
  let userId: number | undefined
  try {
    const user = await requireRole(request, 'ADMIN')
    userId = user.userId
    const body = inventoryAdjustmentSchema.parse(await request.json())
    return success(await createInventoryAdjustmentService(user.userId, body), 201)
  } catch (error) {
    return failure(error, { feature: 'inventory_adjustments', method: request.method, path: request.nextUrl.pathname, userId })
  }
}
