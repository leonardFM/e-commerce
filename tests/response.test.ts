import { describe, expect, it } from 'vitest'
import { AppError } from '@/lib/errors'
import { failure } from '@/lib/response'

describe('failure response', () => {
  it('preserves AppError status and message', async () => {
    const response = failure(new AppError('Conflict happened', 409), {
      feature: 'test',
      method: 'POST',
      path: '/api/test',
      userId: 1,
    })

    await expect(response.json()).resolves.toEqual({ error: 'Conflict happened' })
    expect(response.status).toBe(409)
  })
})
