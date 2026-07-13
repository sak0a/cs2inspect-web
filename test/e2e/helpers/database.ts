import { execSync } from 'node:child_process'
import { e2eRootDir } from './env'

export async function isDatabaseAvailable(): Promise<boolean> {
  let connection: { ping: () => Promise<void>; end: () => Promise<void> } | undefined

  try {
    const mysql = await import('mysql2/promise')
    connection = await mysql.createConnection({
      host: process.env.DATABASE_HOST || '127.0.0.1',
      port: Number(process.env.DATABASE_PORT || 3306),
      user: process.env.DATABASE_USER || 'test',
      password: process.env.DATABASE_PASSWORD || 'test',
      database: process.env.DATABASE_NAME || 'test',
      connectTimeout: 3000,
    })

    await connection.ping()
    return true
  } catch {
    return false
  } finally {
    if (connection) {
      await connection.end().catch(() => undefined)
    }
  }
}

export async function waitForDatabase(maxAttempts = 30): Promise<boolean> {
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    if (await isDatabaseAvailable()) {
      return true
    }

    await new Promise((resolve) => setTimeout(resolve, 1000))
  }

  return false
}

export function prepareTestDatabase(): void {
  execSync('bun run db:push', {
    cwd: e2eRootDir,
    env: process.env,
    stdio: 'inherit',
  })
}
