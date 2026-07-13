#!/usr/bin/env bun

import chalk from 'chalk'
import { readFileSync, existsSync } from 'fs'
import { resolve } from 'path'

const PROJECT_ROOT = resolve(import.meta.dirname, '..')
const ENV_PATH = resolve(PROJECT_ROOT, '.env')

function parseEnvFile(path: string): Record<string, string> {
  const content = readFileSync(path, 'utf-8')
  const env: Record<string, string> = {}

  for (const line of content.split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue

    const eqIndex = trimmed.indexOf('=')
    if (eqIndex === -1) continue

    const key = trimmed.slice(0, eqIndex).trim()
    let value = trimmed.slice(eqIndex + 1).trim()

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1)
    }

    env[key] = value
  }

  return env
}

function loadEnv(): void {
  if (!existsSync(ENV_PATH)) {
    console.error(chalk.red('.env file not found. Run: bun run cli setup'))
    process.exit(1)
  }

  const env = parseEnvFile(ENV_PATH)
  for (const [key, value] of Object.entries(env)) {
    if (process.env[key] === undefined) {
      process.env[key] = value
    }
  }
}

async function runSeed(): Promise<void> {
  loadEnv()

  if (process.env.DEV_AUTH_ENABLED !== 'true') {
    console.error(chalk.red('DEV_AUTH_ENABLED must be true in .env before seeding dev users.'))
    process.exit(1)
  }

  if (process.env.NODE_ENV === 'production') {
    console.error(chalk.red('Dev auth must not be used in production.'))
    process.exit(1)
  }

  const { seedDevUsers } = await import('../server/utils/devAuth')
  await seedDevUsers()

  const { getDevAuthConfig } = await import('../server/utils/devAuth')
  const user = getDevAuthConfig('user')
  const admin = getDevAuthConfig('admin')

  console.log(chalk.green('Dev mock users seeded successfully.'))
  console.log(chalk.dim(`  User:  ${user.steamid} (${user.personaname})`))
  console.log(chalk.dim(`  Admin: ${admin.steamid} (${admin.personaname}, ${admin.adminRole})`))
}

function runLogin(isAdmin: boolean): void {
  loadEnv()

  if (process.env.DEV_AUTH_ENABLED !== 'true') {
    console.error(chalk.red('DEV_AUTH_ENABLED must be true in .env to use dev login.'))
    process.exit(1)
  }

  if (process.env.NODE_ENV === 'production') {
    console.error(chalk.red('Dev auth must not be used in production.'))
    process.exit(1)
  }

  const port = process.env.PORT || '3210'
  const host = process.env.HOST || '127.0.0.1'
  const baseUrl = `http://${host === '0.0.0.0' ? '127.0.0.1' : host}:${port}`

  const role = isAdmin ? 'admin' : 'user'
  const username = isAdmin
    ? process.env.DEV_MOCK_ADMIN_USERNAME || process.env.DEV_AUTH_USERNAME || 'admin'
    : process.env.DEV_AUTH_USERNAME || 'dev'
  const password = isAdmin
    ? process.env.DEV_MOCK_ADMIN_PASSWORD || process.env.DEV_AUTH_PASSWORD || 'adminpassword'
    : process.env.DEV_AUTH_PASSWORD || 'devpassword'

  const body = JSON.stringify({ username, password, as: role }).replace(/'/g, "'\\''")

  console.log(chalk.bold(`Dev ${role} login curl command:`))
  console.log()
  console.log(
    `curl -c /tmp/cs2-cookies.txt -X POST ${baseUrl}/api/auth/dev/login \\\n` +
      `  -H 'Content-Type: application/json' \\\n` +
      `  -d '${body}'`
  )
  console.log()
  console.log(chalk.dim('Use the cookie file for authenticated requests:'))
  console.log(chalk.dim(`curl -b /tmp/cs2-cookies.txt ${baseUrl}/api/loadouts`))
}

async function main(): Promise<void> {
  const command = process.argv[2]
  const isAdmin = process.argv.includes('--admin')

  switch (command) {
    case 'seed':
      await runSeed()
      break
    case 'login':
      runLogin(isAdmin)
      break
    default:
      console.error(chalk.red(`Unknown command: ${command ?? '(none)'}`))
      console.log(chalk.dim('Usage: ./scripts/dev-auth.ts <seed|login> [--admin]'))
      process.exit(1)
  }
}

main().catch((error: unknown) => {
  console.error(chalk.red(error instanceof Error ? error.message : String(error)))
  process.exit(1)
})
