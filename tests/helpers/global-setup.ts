import { execSync } from 'child_process'
import { resolve } from 'path'

export function setup() {
  const databaseUrl = process.env.TEST_DATABASE_URL
  if (!databaseUrl) return

  const prismaCli = resolve(process.cwd(), 'node_modules', '.bin', 'prisma')

  execSync(`${prismaCli} db push --accept-data-loss --skip-generate`, {
    stdio: 'inherit',
    env: { ...process.env, DATABASE_URL: databaseUrl },
    cwd: process.cwd(),
  })
}
