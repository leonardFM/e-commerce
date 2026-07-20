import { describe, expect, it } from 'vitest'
import { AppError } from '@/lib/errors'

describe('AppError', () => {
  it('stores message and statusCode', () => {
    const error = new AppError('Not found', 404)
    expect(error.message).toBe('Not found')
    expect(error.statusCode).toBe(404)
  })

  it('is instance of Error', () => {
    const error = new AppError('Unauthorized', 401)
    expect(error).toBeInstanceOf(Error)
  })

  it('handles different status codes', () => {
    expect(new AppError('Bad request', 400).statusCode).toBe(400)
    expect(new AppError('Forbidden', 403).statusCode).toBe(403)
    expect(new AppError('Server error', 500).statusCode).toBe(500)
  })
})
