import { mkdtemp, readFile } from 'fs/promises'
import { tmpdir } from 'os'
import { join } from 'path'
import { afterEach, describe, expect, it, vi } from 'vitest'

const originalEnv = { ...process.env }

afterEach(() => {
  process.env = { ...originalEnv }
  vi.resetModules()
})

describe('logger file destination', () => {
  it('writes JSON Lines to LOG_FILE_PATH and redacts sensitive fields', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'solutech-logs-'))
    const logFilePath = join(dir, 'app.jsonl')

    process.env.LOG_DESTINATION = 'file'
    process.env.LOG_FILE_PATH = logFilePath
    process.env.LOG_LEVEL = 'debug'

    const { logger } = await import('@/lib/logger')
    logger.info(
      {
        password: 'secret-password',
        token: 'secret-token',
        headers: { authorization: 'Bearer secret-token' },
        safe: 'visible',
      },
      'logger_file_test',
    )

    const content = await readFile(logFilePath, 'utf8')
    const lines = content.trim().split('\n')
    const record = JSON.parse(lines.at(-1) ?? '{}')

    expect(record.msg).toBe('logger_file_test')
    expect(record.safe).toBe('visible')
    expect(content).toContain('[REDACTED]')
    expect(content).not.toContain('secret-password')
    expect(content).not.toContain('secret-token')
  })
})
