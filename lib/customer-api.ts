export type CustomerAuthResponse = {
  user: {
    id: number
    email: string
    name: string | null
    role: 'ADMIN' | 'CUSTOMER'
  }
}

export type CustomerProduct = {
  id: number
  name: string
  description: string | null
  price: number
  stock: number
  deletedAt: string | null
  createdAt: string
  updatedAt: string
}

export type CustomerProductList = {
  items: CustomerProduct[]
  meta: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

export type CustomerOrder = {
  id: number
  userId: number
  status: 'PENDING' | 'PAID' | 'PROCESSING' | 'SHIPPED' | 'COMPLETED'
  paymentStatus: 'PENDING' | 'PAID'
  paymentMethod: 'BANK_TRANSFER' | 'EWALLET' | 'COD'
  paymentReference: string
  shippingName: string
  shippingPhone: string
  shippingAddress: string
  shippingCity: string
  shippingPostalCode: string
  shippingCost: number
  subtotal: number
  total: number
  items: Array<{
    id: number
    productId: number
    productName: string
    quantity: number
    unitPrice: number
  }>
  createdAt: string
  updatedAt: string
}

export type CustomerCart = {
  id: number
  userId: number
  items: Array<{
    id: number
    productId: number
    productName: string
    productDescription: string | null
    unitPrice: number
    stock: number
    quantity: number
    lineTotal: number
  }>
  total: number
  createdAt: string
  updatedAt: string
}

export type CheckoutInput = {
  paymentMethod: 'BANK_TRANSFER' | 'EWALLET' | 'COD'
  shippingName: string
  shippingPhone: string
  shippingAddress: string
  shippingCity: string
  shippingPostalCode: string
  shippingCost: number
  simulatePaymentStatus?: 'PAID' | 'PENDING' | 'FAILED'
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

export async function loginCustomer(email: string, password: string) {
  const response = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  })

  return readJson<CustomerAuthResponse>(response)
}

export async function registerCustomer(email: string, password: string, name: string) {
  const response = await fetch('/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, name }),
  })

  return readJson<CustomerAuthResponse>(response)
}

export async function fetchCustomerProducts(params: { page: number; limit: number; search: string }) {
  const url = new URL('/api/products', window.location.origin)
  url.searchParams.set('page', String(params.page))
  url.searchParams.set('limit', String(params.limit))
  if (params.search) url.searchParams.set('search', params.search)

  const response = await fetch(url.toString())

  return readJson<CustomerProductList>(response)
}

export async function fetchCustomerCart() {
  const response = await fetch('/api/cart')

  return readJson<CustomerCart>(response)
}

export async function addCustomerCartItem(productId: number, quantity = 1) {
  const response = await fetch('/api/cart/items', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ productId, quantity }),
  })

  return readJson<CustomerCart>(response)
}

export async function updateCustomerCartItem(productId: number, quantity: number) {
  const response = await fetch(`/api/cart/items/${productId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ quantity }),
  })

  return readJson<CustomerCart>(response)
}

export async function removeCustomerCartItem(productId: number) {
  const response = await fetch(`/api/cart/items/${productId}`, {
    method: 'DELETE',
  })

  return readJson<CustomerCart>(response)
}

export async function checkoutCustomerCart(input: CheckoutInput) {
  const response = await fetch('/api/checkout', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  })

  return readJson<{ order: CustomerOrder; payment: { paymentStatus: 'PAID' | 'PENDING'; paymentReference: string } }>(response)
}

export async function fetchCustomerOrders() {
  const response = await fetch('/api/orders')

  return readJson<CustomerOrder[]>(response)
}
