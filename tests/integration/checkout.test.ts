import { afterAll, beforeEach, describe, expect, it } from 'vitest'
import { POST as addCartItemRoute } from '@/app/api/cart/items/route'
import { GET as getCartRoute } from '@/app/api/cart/route'
import { POST as checkoutRoute } from '@/app/api/checkout/route'
import { callRoute, loginAsCustomer } from '../helpers/api'
import { disconnectDatabase, resetDatabase, testPrisma } from '../helpers/db'
import { seedBaseData } from '../helpers/fixtures'

const shipping = {
  shippingName: 'Integration Customer',
  shippingPhone: '08123456789',
  shippingAddress: 'Jl. Integration No. 1',
  shippingCity: 'Jakarta',
  shippingPostalCode: '12345',
  shippingCost: 10000,
}

beforeEach(async () => {
  await resetDatabase()
  await seedBaseData()
})

afterAll(async () => {
  await disconnectDatabase()
})

describe('checkout integration', () => {
  it('checks out EWALLET successfully and updates order, stock, cart, and inventory movement', async () => {
    const customer = await loginAsCustomer()
    const productBefore = await testPrisma.product.findUniqueOrThrow({ where: { id: 1 } })

    await callRoute(addCartItemRoute, '/api/cart/items', {
      method: 'POST',
      token: customer.token,
      body: { productId: 1, quantity: 2 },
    })

    const { response, payload } = await callRoute<{ data: { order: { id: number; status: string; paymentStatus: string; subtotal: number; shippingCost: number; total: number; items: Array<{ productId: number; quantity: number }> }; payment: { paymentStatus: string } } }>(checkoutRoute, '/api/checkout', {
      method: 'POST',
      token: customer.token,
      body: { paymentMethod: 'EWALLET', ...shipping },
    })

    expect(response.status).toBe(201)
    expect(payload.data.payment.paymentStatus).toBe('PAID')
    expect(payload.data.order.status).toBe('PAID')
    expect(payload.data.order.paymentStatus).toBe('PAID')
    expect(payload.data.order.subtotal + payload.data.order.shippingCost).toBe(payload.data.order.total)
    expect(payload.data.order.items).toEqual([{ id: expect.any(Number), productId: 1, productName: productBefore.name, quantity: 2, unitPrice: productBefore.price }])

    const productAfter = await testPrisma.product.findUniqueOrThrow({ where: { id: 1 } })
    expect(productAfter.stock).toBe(productBefore.stock - 2)

    const cart = await callRoute<{ data: { items: unknown[] } }>(getCartRoute, '/api/cart', { token: customer.token })
    expect(cart.payload.data.items).toEqual([])

    const movement = await testPrisma.inventoryMovement.findFirstOrThrow({ where: { orderId: payload.data.order.id, productId: 1 } })
    expect(movement.type).toBe('ORDER_CHECKOUT')
    expect(movement.quantityChange).toBe(-2)
    expect(movement.stockBefore).toBe(productBefore.stock)
    expect(movement.stockAfter).toBe(productBefore.stock - 2)
  })

  it('checks out COD as pending and still reserves stock', async () => {
    const customer = await loginAsCustomer()
    const productBefore = await testPrisma.product.findUniqueOrThrow({ where: { id: 1 } })

    await callRoute(addCartItemRoute, '/api/cart/items', {
      method: 'POST',
      token: customer.token,
      body: { productId: 1, quantity: 1 },
    })

    const { response, payload } = await callRoute<{ data: { order: { id: number; status: string; paymentStatus: string }; payment: { paymentStatus: string } } }>(checkoutRoute, '/api/checkout', {
      method: 'POST',
      token: customer.token,
      body: { paymentMethod: 'COD', ...shipping, shippingCost: 0 },
    })

    expect(response.status).toBe(201)
    expect(payload.data.payment.paymentStatus).toBe('PENDING')
    expect(payload.data.order.status).toBe('PENDING')

    const productAfter = await testPrisma.product.findUniqueOrThrow({ where: { id: 1 } })
    expect(productAfter.stock).toBe(productBefore.stock - 1)
  })

  it('fails simulated payment without creating order, decrementing stock, clearing cart, or creating movement', async () => {
    const customer = await loginAsCustomer()
    const productBefore = await testPrisma.product.findUniqueOrThrow({ where: { id: 1 } })

    await callRoute(addCartItemRoute, '/api/cart/items', {
      method: 'POST',
      token: customer.token,
      body: { productId: 1, quantity: 1 },
    })

    const { response, payload } = await callRoute<{ error: string }>(checkoutRoute, '/api/checkout', {
      method: 'POST',
      token: customer.token,
      body: { paymentMethod: 'EWALLET', simulatePaymentStatus: 'FAILED', ...shipping },
    })

    expect(response.status).toBe(402)
    expect(payload.error).toBe('Payment failed')
    expect(await testPrisma.order.count()).toBe(0)
    expect(await testPrisma.inventoryMovement.count()).toBe(0)

    const productAfter = await testPrisma.product.findUniqueOrThrow({ where: { id: 1 } })
    expect(productAfter.stock).toBe(productBefore.stock)

    const cart = await callRoute<{ data: { items: Array<{ quantity: number }> } }>(getCartRoute, '/api/cart', { token: customer.token })
    expect(cart.payload.data.items).toHaveLength(1)
    expect(cart.payload.data.items[0].quantity).toBe(1)
  })

  it('returns 409 for insufficient stock without side effects', async () => {
    const customer = await loginAsCustomer()
    await testPrisma.product.update({ where: { id: 1 }, data: { stock: 1 } })

    await callRoute(addCartItemRoute, '/api/cart/items', {
      method: 'POST',
      token: customer.token,
      body: { productId: 1, quantity: 1 },
    })
    await testPrisma.product.update({ where: { id: 1 }, data: { stock: 0 } })

    const { response } = await callRoute<{ error: string }>(checkoutRoute, '/api/checkout', {
      method: 'POST',
      token: customer.token,
      body: { paymentMethod: 'EWALLET', ...shipping },
    })

    expect(response.status).toBe(409)
    expect(await testPrisma.order.count()).toBe(0)
    expect(await testPrisma.inventoryMovement.count()).toBe(0)
    expect((await testPrisma.product.findUniqueOrThrow({ where: { id: 1 } })).stock).toBe(0)
  })

  it('validates empty cart and invalid checkout body', async () => {
    const customer = await loginAsCustomer()

    const emptyCart = await callRoute<{ error: string }>(checkoutRoute, '/api/checkout', {
      method: 'POST',
      token: customer.token,
      body: { paymentMethod: 'EWALLET', ...shipping },
    })
    expect(emptyCart.response.status).toBe(400)

    const invalidBody = await callRoute<{ error: string }>(checkoutRoute, '/api/checkout', {
      method: 'POST',
      token: customer.token,
      body: { paymentMethod: 'EWALLET', shippingCost: -1 },
    })
    expect(invalidBody.response.status).toBe(400)

    const invalidPaymentMethod = await callRoute<{ error: string }>(checkoutRoute, '/api/checkout', {
      method: 'POST',
      token: customer.token,
      body: { paymentMethod: 'CARD', ...shipping },
    })
    expect(invalidPaymentMethod.response.status).toBe(400)
  })
})
