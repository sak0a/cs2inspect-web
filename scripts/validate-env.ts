#!/usr/bin/env bun

import * as p from '@clack/prompts'
import chalk from 'chalk'
import { readFileSync, existsSync, accessSync, constants } from 'fs'
import { resolve } from 'path'
import { execSync } from 'child_process'

// ─── Constants ───────────────────────────────────────────────────────────────

const PROJECT_ROOT = resolve(import.meta.dirname, '..')
const ENV_PATH = resolve(PROJECT_ROOT, '.env')

// ─── State ───────────────────────────────────────────────────────────────────

let errors = 0
let warnings = 0

// ─── Helpers ─────────────────────────────────────────────────────────────────

function logSuccess(msg: string): void {
  p.log.success(msg)
}

function logError(msg: string): void {
  p.log.error(msg)
  errors++
}

function logWarning(msg: string): void {
  p.log.warning(msg)
  warnings++
}

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

    // Strip surrounding quotes
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

function maskValue(value: string): string {
  if (value.length <= 4) return '****'
  return value.slice(0, 4) + '*'.repeat(Math.min(value.length - 4, 20))
}

// ─── Validation Sections ─────────────────────────────────────────────────────

function checkEnvFile(): boolean {
  if (!existsSync(ENV_PATH)) {
    logError('.env file not found')
    p.note(
      [
        'Create from template:',
        chalk.cyan('  cp .env.example .env'),
        '',
        'Or use the setup wizard:',
        chalk.cyan('  bun run cli setup'),
      ].join('\n'),
      'How to fix'
    )
    return false
  }

  logSuccess('.env file found')
  return true
}

function validateServer(env: Record<string, string>): void {
  p.log.step(chalk.bold('Server Configuration'))

  // PORT
  if (!env.PORT) {
    logWarning('PORT is not set (defaults to 3000)')
  } else {
    const port = Number(env.PORT)
    if (isNaN(port) || port < 1 || port > 65535) {
      logError(`PORT must be between 1 and 65535 (got: ${env.PORT})`)
    } else {
      logSuccess(`PORT = ${port}`)
    }
  }

  // HOST
  if (!env.HOST) {
    logWarning('HOST is not set (defaults to 127.0.0.1)')
  } else {
    logSuccess(`HOST = ${env.HOST}`)
  }

  // NODE_ENV
  if (!env.NODE_ENV) {
    logWarning('NODE_ENV is not set (defaults to development)')
  } else {
    logSuccess(`NODE_ENV = ${env.NODE_ENV}`)
  }
}

function validateJwt(env: Record<string, string>): void {
  p.log.step(chalk.bold('JWT Configuration'))

  // JWT_TOKEN
  if (!env.JWT_TOKEN) {
    logError('JWT_TOKEN is not set')
  } else if (env.JWT_TOKEN.length < 32) {
    logError(`JWT_TOKEN should be at least 32 characters (current: ${env.JWT_TOKEN.length})`)
  } else {
    logSuccess(`JWT_TOKEN is set (${env.JWT_TOKEN.length} chars)`)
  }

  // JWT_EXPIRY
  if (!env.JWT_EXPIRY) {
    logWarning('JWT_EXPIRY is not set (defaults to 7d)')
  } else {
    logSuccess(`JWT_EXPIRY = ${env.JWT_EXPIRY}`)
  }
}

function validateDatabase(env: Record<string, string>): void {
  p.log.step(chalk.bold('Database Configuration'))

  const requiredDbVars = [
    { key: 'DATABASE_HOST', display: true },
    { key: 'DATABASE_PORT', display: true },
    { key: 'DATABASE_USER', display: true },
    { key: 'DATABASE_PASSWORD', display: false },
    { key: 'DATABASE_NAME', display: true },
  ] as const

  let allPresent = true

  for (const { key, display } of requiredDbVars) {
    if (!env[key]) {
      logError(`${key} is not set`)
      allPresent = false
    } else if (display) {
      logSuccess(`${key} = ${env[key]}`)
    } else {
      logSuccess(`${key} is set (${env[key].length} chars)`)
    }
  }

  // CONNECTION_LIMIT (optional)
  if (env.DATABASE_CONNECTION_LIMIT) {
    const limit = Number(env.DATABASE_CONNECTION_LIMIT)
    if (isNaN(limit) || limit < 1) {
      logWarning(
        `DATABASE_CONNECTION_LIMIT should be a positive number (got: ${env.DATABASE_CONNECTION_LIMIT})`
      )
    } else {
      logSuccess(`DATABASE_CONNECTION_LIMIT = ${limit}`)
    }
  }

  // Connection test
  if (allPresent) {
    try {
      execSync('which mysql', { stdio: 'pipe' })

      p.log.info('Testing database connection...')
      try {
        execSync(
          `mysql -h"${env.DATABASE_HOST}" -P"${env.DATABASE_PORT}" -u"${env.DATABASE_USER}" -p"${env.DATABASE_PASSWORD}" -e "USE ${env.DATABASE_NAME}" 2>&1`,
          { stdio: 'pipe', timeout: 10000 }
        )
        logSuccess('Database connection successful')
      } catch {
        logError(
          'Database connection failed — check credentials and ensure the database server is running'
        )
      }
    } catch {
      logWarning('MySQL client not installed — skipping connection test')
    }
  }
}

function validateSteam(env: Record<string, string>): void {
  p.log.step(chalk.bold('Steam API Configuration'))

  // STEAM_API_KEY
  if (!env.STEAM_API_KEY) {
    logError('STEAM_API_KEY is not set')
  } else if (env.STEAM_API_KEY.length !== 32) {
    logWarning(`STEAM_API_KEY should be 32 characters (current: ${env.STEAM_API_KEY.length})`)
  } else {
    logSuccess(`STEAM_API_KEY is set (${maskValue(env.STEAM_API_KEY)})`)
  }

  // Steam bot account (optional, deprecated)
  if (env.STEAM_USERNAME && env.STEAM_PASSWORD) {
    logSuccess('Steam bot account is configured')
    logWarning('Steam bot credentials are deprecated — consider using Steam Service instead')
  } else if (env.STEAM_USERNAME || env.STEAM_PASSWORD) {
    logWarning(
      'Steam bot account partially configured (need both STEAM_USERNAME and STEAM_PASSWORD)'
    )
  }

  // Steam service (recommended)
  if (env.STEAM_SERVICE_URL) {
    logSuccess(`STEAM_SERVICE_URL = ${env.STEAM_SERVICE_URL}`)
    if (env.STEAM_SERVICE_API_KEY) {
      logSuccess('STEAM_SERVICE_API_KEY is set')
    } else {
      logWarning('STEAM_SERVICE_API_KEY is not set (required when using Steam Service)')
    }
  } else if (!env.STEAM_USERNAME) {
    logWarning('Neither Steam Service nor Steam bot configured — inspect features will be limited')
  }
}

function validateDevAuth(env: Record<string, string>): void {
  p.log.step(chalk.bold('Dev Auth Configuration'))

  if (env.DEV_AUTH_ENABLED !== 'true') {
    logSuccess('DEV_AUTH_ENABLED is off')
    return
  }

  if (env.NODE_ENV === 'production') {
    logError('DEV_AUTH_ENABLED must not be set in production')
    return
  }

  logWarning('DEV_AUTH_ENABLED is on — mock login is active (development only)')
  logSuccess(`DEV_MOCK_STEAMID = ${env.DEV_MOCK_STEAMID || '76561198000000001 (default)'}`)
  logSuccess(`DEV_MOCK_ADMIN_STEAMID = ${env.DEV_MOCK_ADMIN_STEAMID || '76561198000000002 (default)'}`)

  if (env.DEV_AUTH_USERNAME && !env.DEV_AUTH_PASSWORD) {
    logWarning('DEV_AUTH_USERNAME is set but DEV_AUTH_PASSWORD is missing')
  } else if (env.DEV_AUTH_USERNAME) {
    logSuccess('Dev login credential gate is configured')
  }
}

function validatePermissions(): void {
  p.log.step(chalk.bold('File Permissions'))

  // .env readable
  try {
    accessSync(ENV_PATH, constants.R_OK)
    logSuccess('.env file is readable')
  } catch {
    logError('.env file is not readable')
  }

  // Check script executability
  const scripts = [
    'scripts/deploy-app.sh',
    'scripts/deploy-app-dev.sh',
    'scripts/install.sh',
    'scripts/remote-install.sh',
  ]

  for (const script of scripts) {
    const scriptPath = resolve(PROJECT_ROOT, script)
    if (!existsSync(scriptPath)) continue

    try {
      accessSync(scriptPath, constants.X_OK)
      logSuccess(`${script} is executable`)
    } catch {
      logWarning(`${script} is not executable (run: ${chalk.cyan(`chmod +x ${script}`)})`)
    }
  }
}

// ─── Main ────────────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  p.intro(chalk.bgCyan.black(' Environment Validator '))

  // Step 1: Check .env exists
  if (!checkEnvFile()) {
    p.outro(chalk.red(`Validation failed with ${errors} error(s)`))
    process.exit(1)
  }

  // Parse the env file
  const env = parseEnvFile(ENV_PATH)

  // Step 2-6: Validate sections
  validateServer(env)
  validateJwt(env)
  validateDatabase(env)
  validateSteam(env)
  validateDevAuth(env)
  validatePermissions()

  // Summary
  const summaryLines: string[] = []

  if (errors === 0 && warnings === 0) {
    summaryLines.push(chalk.green.bold('All checks passed!'))
    summaryLines.push('')
    summaryLines.push('Next steps:')
    summaryLines.push(`  ${chalk.cyan('bun run db:push')}     Push schema to database`)
    summaryLines.push(`  ${chalk.cyan('bun run dev')}         Start development server`)
    summaryLines.push(`  ${chalk.cyan('bun run build')}       Build for production`)
  } else {
    if (errors > 0) {
      summaryLines.push(chalk.red.bold(`${errors} error(s) found`))
    }
    if (warnings > 0) {
      summaryLines.push(chalk.yellow.bold(`${warnings} warning(s) found`))
    }
    summaryLines.push('')
    if (errors > 0) {
      summaryLines.push('Fix the errors above before proceeding.')
      summaryLines.push(`Run ${chalk.cyan('bun run cli setup')} to reconfigure.`)
    }
  }

  p.note(summaryLines.join('\n'), 'Validation Summary')

  if (errors > 0) {
    p.outro(chalk.red('Validation failed'))
    process.exit(1)
  } else if (warnings > 0) {
    p.outro(chalk.yellow('Validation passed with warnings'))
  } else {
    p.outro(chalk.green('Validation passed'))
  }
}

// ─── Signal Handling ─────────────────────────────────────────────────────────

process.on('SIGINT', () => {
  console.log()
  p.cancel('Goodbye!')
  process.exit(0)
})

// ─── Run ─────────────────────────────────────────────────────────────────────

main().catch((err) => {
  p.log.error(`Fatal error: ${err.message}`)
  process.exit(1)
})
