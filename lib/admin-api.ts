export type AuthResponse = {
  token: string
  user: {
    id: number
    email: string
    name: string | null
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

export async function loginAdmin(email: string, password: string) {
  const response = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  })

  return readJson<AuthResponse>(response)
}

export async function fetchProducts(token: string, params: { page: number; limit: number; search: string }) {
  const url = new URL('/api/products', window.location.origin)
  url.searchParams.set('page', String(params.page))
  url.searchParams.set('limit', String(params.limit))
  if (params.search) url.searchParams.set('search', params.search)

  const response = await fetch(url.toString(), {
    headers: authHeaders(token),
  })

  return readJson<ProductListResponse>(response)
}

export async function createProduct(token: string, input: {
  name: string
  description?: string | null
  price: number
  stock: number
}) {
  const response = await fetch('/api/products', {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify(input),
  })

  return readJson<ProductItem>(response)
}

export async function updateProduct(token: string, id: number, input: Partial<{
  name: string
  description: string | null
  price: number
  stock: number
}>) {
  const response = await fetch(`/api/products/${id}`, {
    method: 'PATCH',
    headers: authHeaders(token),
    body: JSON.stringify(input),
  })

  return readJson<ProductItem>(response)
}

export async function removeProduct(token: string, id: number) {
  const response = await fetch(`/api/products/${id}`, {
    method: 'DELETE',
    headers: authHeaders(token),
  })

  return readJson<{ deleted: boolean }>(response)
}
