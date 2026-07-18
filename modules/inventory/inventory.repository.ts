import { prisma } from '@/lib/prisma'
import { AppError } from '@/lib/errors'
import type { InventoryAdjustmentInput, InventoryMovementListResult, InventoryMovementRecord, ListInventoryMovementsQuery } from './inventory.types'

function toMovementRecord(value: {
  id: number
  productId: number
  product: { name: string }
  userId: number | null
  orderId: number | null
  type: 'ORDER_CHECKOUT' | 'ADMIN_ADJUSTMENT'
  quantityChange: number
  stockBefore: number
  stockAfter: number
  note: string | null
  createdAt: Date
}): InventoryMovementRecord {
  return {
    id: value.id,
    productId: value.productId,
    productName: value.product.name,
    userId: value.userId,
    orderId: value.orderId,
    type: value.type,
    quantityChange: value.quantityChange,
    stockBefore: value.stockBefore,
    stockAfter: value.stockAfter,
    note: value.note,
    createdAt: value.createdAt,
  }
}

export async function listInventoryMovements(query: ListInventoryMovementsQuery): Promise<InventoryMovementListResult> {
  const where = {
    ...(query.productId ? { productId: query.productId } : {}),
    ...(query.type ? { type: query.type } : {}),
  }

  const [total, items] = await prisma.$transaction([
    prisma.inventoryMovement.count({ where }),
    prisma.inventoryMovement.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (query.page - 1) * query.limit,
      take: query.limit,
      include: { product: true },
    }),
  ])

  return {
    items: items.map(toMovementRecord),
    meta: {
      page: query.page,
      limit: query.limit,
      total,
      totalPages: Math.max(1, Math.ceil(total / query.limit)),
    },
  }
}

export async function createInventoryAdjustment(userId: number, input: InventoryAdjustmentInput) {
  return prisma.$transaction(async (tx) => {
    const product = await tx.product.findFirst({ where: { id: input.productId, deletedAt: null } })
    if (!product) throw new AppError('Product not found', 404)

    const stockAfter = product.stock + input.quantityChange
    if (stockAfter < 0) throw new AppError('Adjustment would make stock negative', 409)

    const updateResult = await tx.product.updateMany({
      where: {
        id: product.id,
        deletedAt: null,
        stock: product.stock,
      },
      data: {
        stock: { increment: input.quantityChange },
      },
    })

    if (updateResult.count !== 1) throw new AppError('Product stock changed, retry adjustment', 409)

    const movement = await tx.inventoryMovement.create({
      data: {
        productId: product.id,
        userId,
        type: 'ADMIN_ADJUSTMENT',
        quantityChange: input.quantityChange,
        stockBefore: product.stock,
        stockAfter,
        note: input.note,
      },
      include: { product: true },
    })

    return toMovementRecord(movement)
  })
}
