import { afterAll, beforeEach, describe, expect, it } from 'vitest'
import { POST as addCartItemRoute } from '@/app/api/cart/items/route'
import { POST as checkoutRoute } from '@/app/api/checkout/route'
import { GET as listOrdersRoute, POST as createOrderRoute } from '@/app/api/orders/route'
import { GET as orderDetailRoute } from '@/app/api/orders/[id]/route'
import { GET as adminOrdersRoute } from '@/app/api/admin/orders/route'
import { PATCH as updateOrderStatusRoute } from '@/app/api/admin/orders/[id]/status/route'
import { PATCH as updateOrderPaymentRoute } from '@/app/api/admin/orders/[id]/payment/route'
import { callRoute, createJsonRequest, loginAsAdmin, loginAsCustomer, loginAsOtherCustomer } from '../helpers/api'
import { disconnectDatabase, resetDatabase, testPrisma } from '../helpers/db'
import { seedBaseData } from '../helpers/fixtures'

const checkoutBody = {
  paymentMethod: 'COD',
  shippingName: 'Integration Customer',
  shippingPhone: '08123456789',
  shippingAddress: 'Jl. Integration No. 1',
  shippingCity: 'Jakarta',
  shippingPostalCode: '12345',
  shippingCost: 0,
}

beforeEach(async () => {
  await resetDatabase()
  await seedBaseData()
})

afterAll(async () => {
  await disconnectDatabase()
})

async function createPendingOrder(token: string) {
  await callRoute(addCartItemRoute, '/api/cart/items', {
    method: 'POST',
    token,
    body: { productId: 1, quantity: 1 },
  })
  const checkout = await callRoute<{ data: { order: { id: number } } }>(checkoutRoute, '/api/checkout', {
    method: 'POST',
    token,
    body: checkoutBody,
  })
  return checkout.payload.data.order.id
}

describe('orders integration', () => {
  it('lists and returns customer-owned order detail only', async () => {
    const customer = await loginAsCustomer()
    const other = await loginAsOtherCustomer()
    const orderId = await createPendingOrder(customer.token)

    const list = await callRoute<{ data: Array<{ id: number; status: string; paymentStatus: string; shippingName: string }> }>(listOrdersRoute, '/api/orders', { token: customer.token })
    expect(list.response.status).toBe(200)
    expect(list.payload.data[0].id).toBe(orderId)
    expect(list.payload.data[0].shippingName).toBe('Integration Customer')

    const detailResponse = await orderDetailRoute(createJsonRequest(`/api/orders/${orderId}`, { token: customer.token }), { params: Promise.resolve({ id: String(orderId) }) })
    expect(detailResponse.status).toBe(200)

    const otherDetailResponse = await orderDetailRoute(createJsonRequest(`/api/orders/${orderId}`, { token: other.token }), { params: Promise.resolve({ id: String(orderId) }) })
    expect(otherDetailResponse.status).toBe(404)
  })

  it('allows admin to list orders and update payment/status while denying customer admin access', async () => {
    const customer = await loginAsCustomer()
    const admin = await loginAsAdmin()
    const orderId = await createPendingOrder(customer.token)

    const forbidden = await callRoute<{ error: string }>(adminOrdersRoute, '/api/admin/orders', { token: customer.token })
    expect(forbidden.response.status).toBe(403)

    const adminList = await callRoute<{ data: { items: Array<{ id: number }> } }>(adminOrdersRoute, '/api/admin/orders', { token: admin.token })
    expect(adminList.response.status).toBe(200)
    expect(adminList.payload.data.items.map((order) => order.id)).toContain(orderId)

    const paymentResponse = await updateOrderPaymentRoute(createJsonRequest(`/api/admin/orders/${orderId}/payment`, {
      method: 'PATCH',
      token: admin.token,
      body: { paymentStatus: 'PAID' },
    }), { params: Promise.resolve({ id: String(orderId) }) })
    const paymentPayload = await paymentResponse.json() as { data: { status: string; paymentStatus: string } }
    expect(paymentResponse.status).toBe(200)
    expect(paymentPayload.data.paymentStatus).toBe('PAID')
    expect(paymentPayload.data.status).toBe('PAID')

    const statusResponse = await updateOrderStatusRoute(createJsonRequest(`/api/admin/orders/${orderId}/status`, {
      method: 'PATCH',
      token: admin.token,
      body: { status: 'COMPLETED' },
    }), { params: Promise.resolve({ id: String(orderId) }) })
    expect(statusResponse.status).toBe(200)

    const regressResponse = await updateOrderStatusRoute(createJsonRequest(`/api/admin/orders/${orderId}/status`, {
      method: 'PATCH',
      token: admin.token,
      body: { status: 'PENDING' },
    }), { params: Promise.resolve({ id: String(orderId) }) })
    expect(regressResponse.status).toBe(409)
  })

  it('returns generic insufficient stock error for legacy order creation', async () => {
    const customer = await loginAsCustomer()
    await testPrisma.product.update({ where: { id: 1 }, data: { name: '<img src=x onerror=alert(1)>', stock: 1 } })

    const { response, payload } = await callRoute<{ error: string }>(createOrderRoute, '/api/orders', {
      method: 'POST',
      token: customer.token,
      body: { items: [{ productId: 1, quantity: 2 }] },
    })

    expect(response.status).toBe(409)
    expect(payload.error).toBe('Insufficient stock for one or more products')
    expect(payload.error).not.toContain('<img')
    expect(await testPrisma.order.count()).toBe(0)
    expect(await testPrisma.inventoryMovement.count()).toBe(0)
    expect((await testPrisma.product.findUniqueOrThrow({ where: { id: 1 } })).stock).toBe(1)
  })
})
