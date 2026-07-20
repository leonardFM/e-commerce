import { afterAll, beforeEach, describe, expect, it } from 'vitest'
import { GET as getCartRoute } from '@/app/api/cart/route'
import { GET as adminOrdersRoute } from '@/app/api/admin/orders/route'
import { POST as loginRoute } from '@/app/api/auth/login/route'
import { POST as registerRoute } from '@/app/api/auth/register/route'
import { GET as listProductsRoute, POST as createProductRoute } from '@/app/api/products/route'
import { GET as getProductRoute, PATCH as updateProductRoute, DELETE as deleteProductRoute } from '@/app/api/products/[id]/route'
import { GET as getOrderRoute } from '@/app/api/orders/[id]/route'
import { GET as inventoryMovementsRoute } from '@/app/api/inventory/movements/route'
import { POST as inventoryAdjustmentsRoute } from '@/app/api/inventory/adjustments/route'
import { POST as checkoutRoute } from '@/app/api/checkout/route'
import { callRoute, createJsonRequest, loginAsAdmin, loginAsCustomer } from '../helpers/api'
import { disconnectDatabase, resetDatabase } from '../helpers/db'
import { seedBaseData, testUsers } from '../helpers/fixtures'

beforeEach(async () => {
  await resetDatabase()
  await seedBaseData()
})

afterAll(async () => {
  await disconnectDatabase()
})

describe('auth and RBAC integration', () => {
  it('logs in seeded admin and customer', async () => {
    const admin = await loginAsAdmin()
    const customer = await loginAsCustomer()

    expect(admin.user.role).toBe('ADMIN')
    expect(customer.user.role).toBe('CUSTOMER')
    expect(admin.token).toBeTruthy()
    expect(customer.token).toBeTruthy()
  })

  it('rejects invalid credentials', async () => {
    const { response, payload } = await callRoute<{ error: string }>(loginRoute, '/api/auth/login', {
      method: 'POST',
      body: { email: testUsers.customer.email, password: 'wrong-password' },
    })

    expect(response.status).toBe(401)
    expect(payload.error).toBe('Invalid credentials')
  })

  it('registers a new customer and returns a usable token', async () => {
    const { response, payload } = await callRoute<{ data: { user: { id: number; email: string; name: string | null; role: 'ADMIN' | 'CUSTOMER' } } }>(registerRoute, '/api/auth/register', {
      method: 'POST',
      body: { email: ' New.Customer@Solutech.Test ', password: 'password123', name: ' New Customer ' },
    })

    expect(response.status).toBe(201)
    expect(payload.data.user.email).toBe('new.customer@solutech.test')
    expect(payload.data.user.name).toBe('New Customer')
    expect(payload.data.user.role).toBe('CUSTOMER')

    const setCookieHeader = response.headers.get('set-cookie') ?? ''
    const tokenMatch = setCookieHeader.match(/token=([^;]+)/)
    const token = tokenMatch ? decodeURIComponent(tokenMatch[1]) : ''
    expect(token).toBeTruthy()

    const cart = await callRoute<{ data: { items: unknown[] } }>(getCartRoute, '/api/cart', {
      token,
    })
    expect(cart.response.status).toBe(200)

    const login = await callRoute<{ data: { user: { email: string; role: 'ADMIN' | 'CUSTOMER' } } }>(loginRoute, '/api/auth/login', {
      method: 'POST',
      body: { email: 'new.customer@solutech.test', password: 'password123' },
    })
    expect(login.response.status).toBe(200)
    expect(login.payload.data.user.role).toBe('CUSTOMER')
  })

  it('rejects duplicate customer registration email', async () => {
    const { response, payload } = await callRoute<{ error: string }>(registerRoute, '/api/auth/register', {
      method: 'POST',
      body: { email: ` ${testUsers.customer.email.toUpperCase()} `, password: 'password123', name: 'Duplicate Customer' },
    })

    expect(response.status).toBe(409)
    expect(payload.error).toBe('Registration failed')
  })

  it('handles parallel duplicate customer registration as conflict instead of server error', async () => {
    const body = { email: 'parallel.customer@solutech.test', password: 'password123', name: 'Parallel Customer' }
    const results = await Promise.all([
      callRoute<{ data?: unknown; error?: string }>(registerRoute, '/api/auth/register', { method: 'POST', body }),
      callRoute<{ data?: unknown; error?: string }>(registerRoute, '/api/auth/register', { method: 'POST', body }),
    ])

    expect(results.map((result) => result.response.status).sort()).toEqual([201, 409])
    expect(results.some((result) => result.payload.error === 'Registration failed')).toBe(true)
  })

  it('rejects invalid registration body', async () => {
    const { response, payload } = await callRoute<{ error: string }>(registerRoute, '/api/auth/register', {
      method: 'POST',
      body: { email: 'invalid-email', password: 'shortpw' },
    })

    expect(response.status).toBe(400)
    expect(payload.error).toBe('Validation error')
  })

  it('forces registered users to customer role even when role is sent in body', async () => {
    const { response, payload } = await callRoute<{ data: { user: { role: 'ADMIN' | 'CUSTOMER' } } }>(registerRoute, '/api/auth/register', {
      method: 'POST',
      body: { email: 'role-attempt@solutech.test', password: 'password123', name: 'Role Attempt', role: 'ADMIN' },
    })

    expect(response.status).toBe(201)
    expect(payload.data.user.role).toBe('CUSTOMER')
  })

  it('returns 401 without token for protected endpoint', async () => {
    const { response, payload } = await callRoute<{ error: string }>(getCartRoute, '/api/cart')

    expect(response.status).toBe(401)
    expect(payload.error).toBe('Unauthorized')
  })

  it('returns 403 when customer accesses admin endpoint', async () => {
    const customer = await loginAsCustomer()
    const { response, payload } = await callRoute<{ error: string }>(adminOrdersRoute, '/api/admin/orders', {
      token: customer.token,
    })

    expect(response.status).toBe(403)
    expect(payload.error).toBe('Forbidden')
  })

  it('allows admin to access admin endpoint', async () => {
    const admin = await loginAsAdmin()
    const { response, payload } = await callRoute<{ data: { items: unknown[] } }>(adminOrdersRoute, '/api/admin/orders', {
      token: admin.token,
    })

    expect(response.status).toBe(200)
    expect(payload.data.items).toEqual([])
  })

  it('returns 401 for invalid token', async () => {
    const { response, payload } = await callRoute<{ error: string }>(getCartRoute, '/api/cart', {
      token: 'invalid-token',
    })

    expect(response.status).toBe(401)
    expect(payload.error).toBeTruthy()
  })

  it('returns 401 without token for all protected endpoints', async () => {
    const cartNoAuth = await callRoute(getCartRoute, '/api/cart')
    expect(cartNoAuth.response.status).toBe(401)

    const checkoutNoAuth = await callRoute(checkoutRoute, '/api/checkout', { method: 'POST', body: { paymentMethod: 'EWALLET', shippingName: 'Test', shippingPhone: '123', shippingAddress: 'Addr', shippingCity: 'City', shippingPostalCode: '12345', shippingCost: 0 } })
    expect(checkoutNoAuth.response.status).toBe(401)

    const ordersNoAuth = await getOrderRoute(createJsonRequest('/api/orders/1'), { params: Promise.resolve({ id: '1' }) })
    expect(ordersNoAuth.status).toBe(401)

    const movementsNoAuth = await callRoute(inventoryMovementsRoute, '/api/inventory/movements')
    expect(movementsNoAuth.response.status).toBe(401)
  })

  it('returns 403 for customer accessing admin endpoints', async () => {
    const customer = await loginAsCustomer()

    const createProduct = await callRoute(createProductRoute, '/api/products', { method: 'POST', token: customer.token, body: { name: 'X', price: 100, stock: 1 } })
    expect(createProduct.response.status).toBe(403)

    const updateProduct = await updateProductRoute(createJsonRequest('/api/products/1', { method: 'PATCH', token: customer.token, body: { price: 200 } }), { params: Promise.resolve({ id: '1' }) })
    expect(updateProduct.status).toBe(403)

    const deleteProduct = await deleteProductRoute(createJsonRequest('/api/products/1', { method: 'DELETE', token: customer.token }), { params: Promise.resolve({ id: '1' }) })
    expect(deleteProduct.status).toBe(403)

    const inventoryAdj = await callRoute(inventoryAdjustmentsRoute, '/api/inventory/adjustments', { method: 'POST', token: customer.token, body: { productId: 1, quantityChange: 5 } })
    expect(inventoryAdj.response.status).toBe(403)
  })

  it('returns 400 for invalid path params', async () => {
    const admin = await loginAsAdmin()

    const invalidProductId = await getProductRoute(createJsonRequest('/api/products/abc', { token: admin.token }), { params: Promise.resolve({ id: 'abc' }) })
    expect(invalidProductId.status).toBe(400)

    const zeroProductId = await getProductRoute(createJsonRequest('/api/products/0', { token: admin.token }), { params: Promise.resolve({ id: '0' }) })
    expect(zeroProductId.status).toBe(400)

    const negativeProductId = await getProductRoute(createJsonRequest('/api/products/-1', { token: admin.token }), { params: Promise.resolve({ id: '-1' }) })
    expect(negativeProductId.status).toBe(400)

    const invalidOrderId = await getOrderRoute(createJsonRequest('/api/orders/abc', { token: admin.token }), { params: Promise.resolve({ id: 'abc' }) })
    expect(invalidOrderId.status).toBe(400)
  })
})
