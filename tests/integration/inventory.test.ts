import { afterAll, beforeEach, describe, expect, it } from 'vitest'
import { POST as addCartItemRoute } from '@/app/api/cart/items/route'
import { POST as checkoutRoute } from '@/app/api/checkout/route'
import { GET as movementsRoute } from '@/app/api/inventory/movements/route'
import { POST as adjustmentRoute } from '@/app/api/inventory/adjustments/route'
import { callRoute, loginAsAdmin, loginAsCustomer } from '../helpers/api'
import { disconnectDatabase, resetDatabase, testPrisma } from '../helpers/db'
import { seedBaseData } from '../helpers/fixtures'

beforeEach(async () => {
  await resetDatabase()
  await seedBaseData()
})

afterAll(async () => {
  await disconnectDatabase()
})

describe('inventory integration', () => {
  it('creates ORDER_CHECKOUT movement and supports movement filters', async () => {
    const customer = await loginAsCustomer()
    const admin = await loginAsAdmin()

    await callRoute(addCartItemRoute, '/api/cart/items', {
      method: 'POST',
      token: customer.token,
      body: { productId: 1, quantity: 1 },
    })
    await callRoute(checkoutRoute, '/api/checkout', {
      method: 'POST',
      token: customer.token,
      body: {
        paymentMethod: 'EWALLET',
        shippingName: 'Integration Customer',
        shippingPhone: '08123456789',
        shippingAddress: 'Jl. Integration No. 1',
        shippingCity: 'Jakarta',
        shippingPostalCode: '12345',
        shippingCost: 0,
      },
    })

    const all = await callRoute<{ data: { items: Array<{ productId: number; type: string }> } }>(movementsRoute, '/api/inventory/movements', { token: admin.token })
    expect(all.response.status).toBe(200)
    expect(all.payload.data.items[0].type).toBe('ORDER_CHECKOUT')

    const byProduct = await callRoute<{ data: { items: Array<{ productId: number }> } }>(movementsRoute, '/api/inventory/movements', {
      token: admin.token,
      searchParams: { productId: '1' },
    })
    expect(byProduct.payload.data.items.every((movement) => movement.productId === 1)).toBe(true)

    const byType = await callRoute<{ data: { items: Array<{ type: string }> } }>(movementsRoute, '/api/inventory/movements', {
      token: admin.token,
      searchParams: { type: 'ORDER_CHECKOUT' },
    })
    expect(byType.payload.data.items.every((movement) => movement.type === 'ORDER_CHECKOUT')).toBe(true)
  })

  it('allows admin adjustment and rejects invalid adjustment without creating movement', async () => {
    const admin = await loginAsAdmin()
    const customer = await loginAsCustomer()
    const before = await testPrisma.product.findUniqueOrThrow({ where: { id: 1 } })

    const forbidden = await callRoute<{ error: string }>(adjustmentRoute, '/api/inventory/adjustments', {
      method: 'POST',
      token: customer.token,
      body: { productId: 1, quantityChange: 1 },
    })
    expect(forbidden.response.status).toBe(403)

    const positive = await callRoute<{ data: { type: string; quantityChange: number; stockBefore: number; stockAfter: number } }>(adjustmentRoute, '/api/inventory/adjustments', {
      method: 'POST',
      token: admin.token,
      body: { productId: 1, quantityChange: 5, note: 'Restock integration' },
    })
    expect(positive.response.status).toBe(201)
    expect(positive.payload.data.type).toBe('ADMIN_ADJUSTMENT')
    expect(positive.payload.data.quantityChange).toBe(5)
    expect(positive.payload.data.stockBefore).toBe(before.stock)
    expect(positive.payload.data.stockAfter).toBe(before.stock + 5)

    const negative = await callRoute(adjustmentRoute, '/api/inventory/adjustments', {
      method: 'POST',
      token: admin.token,
      body: { productId: 1, quantityChange: -2, note: 'Damaged integration' },
    })
    expect(negative.response.status).toBe(201)

    const movementCountBeforeFailure = await testPrisma.inventoryMovement.count()
    const excessive = await callRoute<{ error: string }>(adjustmentRoute, '/api/inventory/adjustments', {
      method: 'POST',
      token: admin.token,
      body: { productId: 1, quantityChange: -999999 },
    })
    expect(excessive.response.status).toBe(409)
    expect(await testPrisma.inventoryMovement.count()).toBe(movementCountBeforeFailure)

    const zero = await callRoute<{ error: string }>(adjustmentRoute, '/api/inventory/adjustments', {
      method: 'POST',
      token: admin.token,
      body: { productId: 1, quantityChange: 0 },
    })
    expect(zero.response.status).toBe(400)

    const longNote = await callRoute<{ error: string }>(adjustmentRoute, '/api/inventory/adjustments', {
      method: 'POST',
      token: admin.token,
      body: { productId: 1, quantityChange: 1, note: 'a'.repeat(501) },
    })
    expect(longNote.response.status).toBe(400)
  })
})
