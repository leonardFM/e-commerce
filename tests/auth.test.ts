import { beforeAll, describe, expect, it } from 'vitest'
import { getBearerToken, signJwt, verifyJwt } from '@/lib/auth'

beforeAll(() => {
  process.env.JWT_SECRET = 'test-secret-that-is-at-least-32-characters-long'
})

describe('getBearerToken', () => {
  it('extracts token from Bearer header', () => {
    expect(getBearerToken('Bearer my-token')).toBe('my-token')
  })

  it('returns null for non-Bearer header', () => {
    expect(getBearerToken('Basic my-token')).toBeNull()
  })

  it('returns null for null input', () => {
    expect(getBearerToken(null)).toBeNull()
  })

  it('returns null for empty header', () => {
    expect(getBearerToken('')).toBeNull()
  })

  it('returns null for malformed header with extra parts', () => {
    expect(getBearerToken('Bearer token extra')).toBeNull()
  })
})

describe('JWT sign and verify', () => {
  it('signs and verifies a valid token', async () => {
    const user = { userId: 1, email: 'test@test.com', role: 'ADMIN' as const }
    const token = await signJwt(user)
    expect(typeof token).toBe('string')
    expect(token.split('.')).toHaveLength(3)

    const decoded = await verifyJwt(token)
    expect(decoded.userId).toBe(1)
    expect(decoded.email).toBe('test@test.com')
    expect(decoded.role).toBe('ADMIN')
  })

  it('rejects tampered token', async () => {
    const user = { userId: 1, email: 'test@test.com', role: 'CUSTOMER' as const }
    const token = await signJwt(user)
    const tampered = token.slice(0, -5) + 'XXXXX'

    await expect(verifyJwt(tampered)).rejects.toThrow()
  })
})
