export type CustomerAuthResponse = {
  token: string
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
    throw new Error(payload?.error ?? 'Request failed')
  }
  return payload.data as T
}

function authHeaders(token: string) {
  return {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  }
}

export async function loginCustomer(email: string, password: string) {
  const response = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  })

  return readJson<CustomerAuthResponse>(response)
}

export async function fetchCustomerProducts(token: string, params: { page: number; limit: number; search: string }) {
  const url = new URL('/api/products', window.location.origin)
  url.searchParams.set('page', String(params.page))
  url.searchParams.set('limit', String(params.limit))
  if (params.search) url.searchParams.set('search', params.search)

  const response = await fetch(url.toString(), {
    headers: authHeaders(token),
  })

  return readJson<CustomerProductList>(response)
}

export async function fetchCustomerCart(token: string) {
  const response = await fetch('/api/cart', {
    headers: authHeaders(token),
  })

  return readJson<CustomerCart>(response)
}

export async function addCustomerCartItem(token: string, productId: number, quantity = 1) {
  const response = await fetch('/api/cart/items', {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify({ productId, quantity }),
  })

  return readJson<CustomerCart>(response)
}

export async function updateCustomerCartItem(token: string, productId: number, quantity: number) {
  const response = await fetch(`/api/cart/items/${productId}`, {
    method: 'PATCH',
    headers: authHeaders(token),
    body: JSON.stringify({ quantity }),
  })

  return readJson<CustomerCart>(response)
}

export async function removeCustomerCartItem(token: string, productId: number) {
  const response = await fetch(`/api/cart/items/${productId}`, {
    method: 'DELETE',
    headers: authHeaders(token),
  })

  return readJson<CustomerCart>(response)
}

export async function checkoutCustomerCart(token: string, input: CheckoutInput) {
  const response = await fetch('/api/checkout', {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify(input),
  })

  return readJson<{ order: CustomerOrder; payment: { paymentStatus: 'PAID' | 'PENDING'; paymentReference: string } }>(response)
}

export async function fetchCustomerOrders(token: string) {
  const response = await fetch('/api/orders', {
    headers: authHeaders(token),
  })

  return readJson<CustomerOrder[]>(response)
}
