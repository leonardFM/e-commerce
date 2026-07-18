import { NextRequest } from 'next/server'
import { testUsers } from './fixtures'
import { POST as loginRoute } from '@/app/api/auth/login/route'

type RouteHandler = (request: NextRequest, context?: never) => Promise<Response>

export function authHeader(token: string) {
  return { Authorization: `Bearer ${token}` }
}

export function createJsonRequest(path: string, init: { method?: string; token?: string; body?: unknown; searchParams?: Record<string, string> } = {}) {
  const url = new URL(path, 'http://localhost')
  for (const [key, value] of Object.entries(init.searchParams ?? {})) url.searchParams.set(key, value)

  return new NextRequest(url, {
    method: init.method ?? 'GET',
    headers: {
      ...(init.body === undefined ? {} : { 'Content-Type': 'application/json' }),
      ...(init.token ? authHeader(init.token) : {}),
    },
    body: init.body === undefined ? undefined : JSON.stringify(init.body),
  })
}

export async function parseJsonResponse<T>(response: Response) {
  return response.json() as Promise<T>
}

export async function callRoute<T>(handler: RouteHandler, path: string, init: { method?: string; token?: string; body?: unknown; searchParams?: Record<string, string> } = {}) {
  const response = await handler(createJsonRequest(path, init))
  const payload = await parseJsonResponse<T>(response)

  return { response, payload }
}

export async function loginAsAdmin() {
  return login(testUsers.admin.email, testUsers.admin.password)
}

export async function loginAsCustomer() {
  return login(testUsers.customer.email, testUsers.customer.password)
}

export async function loginAsOtherCustomer() {
  return login(testUsers.otherCustomer.email, testUsers.otherCustomer.password)
}

async function login(email: string, password: string) {
  const { response, payload } = await callRoute<{ data: { token: string; user: { id: number; email: string; role: 'ADMIN' | 'CUSTOMER' } } }>(loginRoute, '/api/auth/login', {
    method: 'POST',
    body: { email, password },
  })

  if (!response.ok) throw new Error(`Login failed for ${email}`)
  return payload.data
}
