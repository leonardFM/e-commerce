import { afterAll, beforeEach, describe, expect, it } from 'vitest'
import { GET as getCartRoute, DELETE as clearCartRoute } from '@/app/api/cart/route'
import { POST as addCartItemRoute } from '@/app/api/cart/items/route'
import { PATCH as updateCartItemRoute, DELETE as deleteCartItemRoute } from '@/app/api/cart/items/[productId]/route'
import { callRoute, createJsonRequest, loginAsCustomer, loginAsOtherCustomer } from '../helpers/api'
import { disconnectDatabase, resetDatabase } from '../helpers/db'
import { seedBaseData } from '../helpers/fixtures'

beforeEach(async () => {
  await resetDatabase()
  await seedBaseData()
})

afterAll(async () => {
  await disconnectDatabase()
})

describe('cart integration', () => {
  it('persists cart items, updates quantity, removes item, and clears cart', async () => {
    const customer = await loginAsCustomer()

    const emptyCart = await callRoute<{ data: { items: unknown[] } }>(getCartRoute, '/api/cart', { token: customer.token })
    expect(emptyCart.response.status).toBe(200)
    expect(emptyCart.payload.data.items).toEqual([])

    const added = await callRoute<{ data: { items: Array<{ productId: number; quantity: number }> } }>(addCartItemRoute, '/api/cart/items', {
      method: 'POST',
      token: customer.token,
      body: { productId: 1, quantity: 2 },
    })
    expect(added.response.status).toBe(201)
    expect(added.payload.data.items[0].quantity).toBe(2)

    await callRoute(addCartItemRoute, '/api/cart/items', {
      method: 'POST',
      token: customer.token,
      body: { productId: 1, quantity: 1 },
    })

    const persisted = await callRoute<{ data: { items: Array<{ productId: number; quantity: number }> } }>(getCartRoute, '/api/cart', { token: customer.token })
    expect(persisted.payload.data.items).toHaveLength(1)
    expect(persisted.payload.data.items[0].quantity).toBe(3)

    const updateResponse = await updateCartItemRoute(createJsonRequest('/api/cart/items/1', {
      method: 'PATCH',
      token: customer.token,
      body: { quantity: 1 },
    }), { params: Promise.resolve({ productId: '1' }) })
    const updated = await updateResponse.json() as { data: { items: Array<{ quantity: number }> } }
    expect(updateResponse.status).toBe(200)
    expect(updated.data.items[0].quantity).toBe(1)

    const zeroResponse = await updateCartItemRoute(createJsonRequest('/api/cart/items/1', {
      method: 'PATCH',
      token: customer.token,
      body: { quantity: 0 },
    }), { params: Promise.resolve({ productId: '1' }) })
    const zero = await zeroResponse.json() as { data: { items: unknown[] } }
    expect(zeroResponse.status).toBe(200)
    expect(zero.data.items).toEqual([])

    await callRoute(addCartItemRoute, '/api/cart/items', {
      method: 'POST',
      token: customer.token,
      body: { productId: 1, quantity: 1 },
    })

    const deleteResponse = await deleteCartItemRoute(createJsonRequest('/api/cart/items/1', {
      method: 'DELETE',
      token: customer.token,
    }), { params: Promise.resolve({ productId: '1' }) })
    const deleted = await deleteResponse.json() as { data: { items: unknown[] } }
    expect(deleteResponse.status).toBe(200)
    expect(deleted.data.items).toEqual([])

    await callRoute(addCartItemRoute, '/api/cart/items', {
      method: 'POST',
      token: customer.token,
      body: { productId: 1, quantity: 1 },
    })
    const cleared = await callRoute<{ data: { items: unknown[] } }>(clearCartRoute, '/api/cart', {
      method: 'DELETE',
      token: customer.token,
    })
    expect(cleared.payload.data.items).toEqual([])
  })

  it('rejects missing products and quantities above stock', async () => {
    const customer = await loginAsCustomer()

    const missing = await callRoute<{ error: string }>(addCartItemRoute, '/api/cart/items', {
      method: 'POST',
      token: customer.token,
      body: { productId: 999999, quantity: 1 },
    })
    expect(missing.response.status).toBe(404)

    const aboveStock = await callRoute<{ error: string }>(addCartItemRoute, '/api/cart/items', {
      method: 'POST',
      token: customer.token,
      body: { productId: 1, quantity: 999 },
    })
    expect(aboveStock.response.status).toBe(409)
  })

  it('keeps carts user-scoped', async () => {
    const customer = await loginAsCustomer()
    const other = await loginAsOtherCustomer()

    await callRoute(addCartItemRoute, '/api/cart/items', {
      method: 'POST',
      token: customer.token,
      body: { productId: 1, quantity: 2 },
    })

    const otherCart = await callRoute<{ data: { items: unknown[] } }>(getCartRoute, '/api/cart', { token: other.token })
    expect(otherCart.response.status).toBe(200)
    expect(otherCart.payload.data.items).toEqual([])
  })
})
