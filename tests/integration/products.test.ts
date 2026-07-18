import { afterAll, beforeEach, describe, expect, it } from 'vitest'
import { GET as listProductsRoute, POST as createProductRoute } from '@/app/api/products/route'
import { GET as getProductRoute, PATCH as updateProductRoute, DELETE as deleteProductRoute } from '@/app/api/products/[id]/route'
import { callRoute, createJsonRequest, loginAsAdmin, loginAsCustomer } from '../helpers/api'
import { disconnectDatabase, resetDatabase } from '../helpers/db'
import { seedBaseData } from '../helpers/fixtures'

beforeEach(async () => {
  await resetDatabase()
  await seedBaseData()
})

afterAll(async () => {
  await disconnectDatabase()
})

describe('products integration', () => {
  it('lists, searches, paginates, and gets active products', async () => {
    const customer = await loginAsCustomer()

    const list = await callRoute<{ data: { items: Array<{ id: number; name: string }>; meta: { page: number; limit: number; total: number } } }>(listProductsRoute, '/api/products', {
      token: customer.token,
      searchParams: { page: '1', limit: '1' },
    })
    expect(list.response.status).toBe(200)
    expect(list.payload.data.items).toHaveLength(1)
    expect(list.payload.data.meta.page).toBe(1)
    expect(list.payload.data.meta.limit).toBe(1)
    expect(list.payload.data.meta.total).toBe(2)

    const search = await callRoute<{ data: { items: Array<{ name: string }> } }>(listProductsRoute, '/api/products', {
      token: customer.token,
      searchParams: { search: 'Mouse' },
    })
    expect(search.response.status).toBe(200)
    expect(search.payload.data.items).toHaveLength(1)
    expect(search.payload.data.items[0].name).toContain('Mouse')

    const detailResponse = await getProductRoute(createJsonRequest('/api/products/1', { token: customer.token }), { params: Promise.resolve({ id: '1' }) })
    expect(detailResponse.status).toBe(200)
  })

  it('allows admin to create, update, and soft delete products', async () => {
    const admin = await loginAsAdmin()

    const created = await callRoute<{ data: { id: number; name: string; stock: number } }>(createProductRoute, '/api/products', {
      method: 'POST',
      token: admin.token,
      body: { name: 'Admin Created Product', description: 'Created in test', price: 250000, stock: 7 },
    })
    expect(created.response.status).toBe(201)
    expect(created.payload.data.name).toBe('Admin Created Product')

    const updateResponse = await updateProductRoute(createJsonRequest(`/api/products/${created.payload.data.id}`, {
      method: 'PATCH',
      token: admin.token,
      body: { stock: 9 },
    }), { params: Promise.resolve({ id: String(created.payload.data.id) }) })
    const updated = await updateResponse.json() as { data: { stock: number } }
    expect(updateResponse.status).toBe(200)
    expect(updated.data.stock).toBe(9)

    const deleteResponse = await deleteProductRoute(createJsonRequest(`/api/products/${created.payload.data.id}`, {
      method: 'DELETE',
      token: admin.token,
    }), { params: Promise.resolve({ id: String(created.payload.data.id) }) })
    expect(deleteResponse.status).toBe(200)

    const customer = await loginAsCustomer()
    const list = await callRoute<{ data: { items: Array<{ id: number }> } }>(listProductsRoute, '/api/products', { token: customer.token })
    expect(list.payload.data.items.map((product) => product.id)).not.toContain(created.payload.data.id)

    const deletedDetail = await getProductRoute(createJsonRequest(`/api/products/${created.payload.data.id}`, { token: customer.token }), { params: Promise.resolve({ id: String(created.payload.data.id) }) })
    expect(deletedDetail.status).toBe(404)
  })

  it('rejects customer product mutations and invalid admin product bodies', async () => {
    const customer = await loginAsCustomer()
    const admin = await loginAsAdmin()

    const customerCreate = await callRoute<{ error: string }>(createProductRoute, '/api/products', {
      method: 'POST',
      token: customer.token,
      body: { name: 'Forbidden Product', price: 1000, stock: 1 },
    })
    expect(customerCreate.response.status).toBe(403)

    const customerUpdate = await updateProductRoute(createJsonRequest('/api/products/1', {
      method: 'PATCH',
      token: customer.token,
      body: { stock: 1 },
    }), { params: Promise.resolve({ id: '1' }) })
    expect(customerUpdate.status).toBe(403)

    const customerDelete = await deleteProductRoute(createJsonRequest('/api/products/1', {
      method: 'DELETE',
      token: customer.token,
    }), { params: Promise.resolve({ id: '1' }) })
    expect(customerDelete.status).toBe(403)

    const negativePrice = await callRoute(createProductRoute, '/api/products', {
      method: 'POST',
      token: admin.token,
      body: { name: 'Invalid Product', price: -1, stock: 1 },
    })
    expect(negativePrice.response.status).toBe(400)

    const negativeStock = await callRoute(createProductRoute, '/api/products', {
      method: 'POST',
      token: admin.token,
      body: { name: 'Invalid Product', price: 1, stock: -1 },
    })
    expect(negativeStock.response.status).toBe(400)
  })
})
