import 'dotenv/config'
import { defineConfig } from 'vitest/config'

const databaseUrl = process.env.TEST_DATABASE_URL

if (!databaseUrl) {
  throw new Error('TEST_DATABASE_URL is required for automated tests')
}

if (!new URL(databaseUrl).pathname.toLowerCase().includes('test')) {
  throw new Error('TEST_DATABASE_URL must point to a dedicated test database')
}

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    include: ['tests/**/*.test.ts'],
    globalSetup: ['./tests/helpers/global-setup.ts'],
    env: {
      DATABASE_URL: databaseUrl,
      JWT_SECRET: process.env.JWT_SECRET ?? 'test-secret-that-is-at-least-32-char-long',
    },
    pool: 'forks',
    poolOptions: {
      forks: {
        singleFork: true,
      },
    },
  },
  resolve: {
    alias: {
      '@': new URL('.', import.meta.url).pathname,
    },
  },
})
