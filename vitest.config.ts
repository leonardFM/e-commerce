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
    env: {
      DATABASE_URL: databaseUrl,
      JWT_SECRET: process.env.JWT_SECRET ?? 'test-jwt-secret',
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
