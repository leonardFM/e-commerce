import { afterAll, beforeEach, describe, expect, it } from 'vitest'
import { GET as getCartRoute } from '@/app/api/cart/route'
import { GET as adminOrdersRoute } from '@/app/api/admin/orders/route'
import { POST as loginRoute } from '@/app/api/auth/login/route'
import { callRoute, loginAsAdmin, loginAsCustomer } from '../helpers/api'
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
})
