export type AuthResponse = {
  user: {
    id: number
    email: string
    name: string | null
    role: 'ADMIN' | 'CUSTOMER'
  }
}

export type ProductItem = {
  id: number
  name: string
  description: string | null
  price: number
  stock: number
  deletedAt: string | null
  createdAt: string
  updatedAt: string
}

export type ProductListResponse = {
  items: ProductItem[]
  meta: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

export type AdminOrder = {
  id: number
  userId: number
  status: 'PENDING' | 'PAID' | 'PROCESSING' | 'SHIPPED' | 'COMPLETED'
  paymentStatus: 'PENDING' | 'PAID'
  paymentMethod: 'BANK_TRANSFER' | 'EWALLET' | 'COD'
  paymentReference: string
  shippingName: string
  shippingCity: string
  shippingCost: number
  subtotal: number
  total: number
  items: Array<{ id: number; productName: string; quantity: number; unitPrice: number }>
  createdAt: string
  updatedAt: string
}

export type AdminOrderListResponse = {
  items: AdminOrder[]
  meta: { page: number; limit: number; total: number; totalPages: number }
}

export type InventoryMovement = {
  id: number
  productId: number
  productName: string
  userId: number | null
  orderId: number | null
  type: 'ORDER_CHECKOUT' | 'ADMIN_ADJUSTMENT'
  quantityChange: number
  stockBefore: number
  stockAfter: number
  note: string | null
  createdAt: string
}

export type InventoryMovementListResponse = {
  items: InventoryMovement[]
  meta: { page: number; limit: number; total: number; totalPages: number }
}

async function readJson<T>(response: Response): Promise<T> {
  const payload = await response.json()
  if (!response.ok) {
    const error = new Error(payload?.error ?? 'Request failed')
    ;(error as any).status = response.status
    throw error
  }
  return payload.data as T
}

export async function loginAdmin(email: string, password: string) {
  const response = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  })

  return readJson<AuthResponse>(response)
}

export async function fetchProducts(params: { page: number; limit: number; search: string }) {
  const url = new URL('/api/products', window.location.origin)
  url.searchParams.set('page', String(params.page))
  url.searchParams.set('limit', String(params.limit))
  if (params.search) url.searchParams.set('search', params.search)

  const response = await fetch(url.toString())

  return readJson<ProductListResponse>(response)
}

export async function createProduct(input: {
  name: string
  description?: string | null
  price: number
  stock: number
}) {
  const response = await fetch('/api/products', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  })

  return readJson<ProductItem>(response)
}

export async function updateProduct(id: number, input: Partial<{
  name: string
  description: string | null
  price: number
  stock: number
}>) {
  const response = await fetch(`/api/products/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  })

  return readJson<ProductItem>(response)
}

export async function removeProduct(id: number) {
  const response = await fetch(`/api/products/${id}`, {
    method: 'DELETE',
  })

  return readJson<{ deleted: boolean }>(response)
}

export async function fetchAdminOrders(params: { page: number; limit: number }) {
  const url = new URL('/api/admin/orders', window.location.origin)
  url.searchParams.set('page', String(params.page))
  url.searchParams.set('limit', String(params.limit))

  const response = await fetch(url.toString())

  return readJson<AdminOrderListResponse>(response)
}

export async function updateAdminOrderStatus(id: number, status: AdminOrder['status']) {
  const response = await fetch(`/api/admin/orders/${id}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status }),
  })

  return readJson<AdminOrder>(response)
}

export async function updateAdminOrderPayment(id: number, paymentStatus: AdminOrder['paymentStatus']) {
  const response = await fetch(`/api/admin/orders/${id}/payment`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ paymentStatus }),
  })

  return readJson<AdminOrder>(response)
}

export async function fetchInventoryMovements(params: { page: number; limit: number }) {
  const url = new URL('/api/inventory/movements', window.location.origin)
  url.searchParams.set('page', String(params.page))
  url.searchParams.set('limit', String(params.limit))

  const response = await fetch(url.toString())

  return readJson<InventoryMovementListResponse>(response)
}

export async function createInventoryAdjustment(input: { productId: number; quantityChange: number; note?: string }) {
  const response = await fetch('/api/inventory/adjustments', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  })

  return readJson<InventoryMovement>(response)
}
