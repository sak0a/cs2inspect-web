#!/usr/bin/env bun

import * as p from '@clack/prompts'
import { isCancel } from '@clack/core'
import chalk from 'chalk'
import { existsSync, writeFileSync, copyFileSync, chmodSync } from 'fs'
import { resolve } from 'path'
import { randomBytes } from 'crypto'
import { execSync } from 'child_process'

// ─── Constants ───────────────────────────────────────────────────────────────

const PROJECT_ROOT = resolve(import.meta.dirname, '..')
const ENV_PATH = resolve(PROJECT_ROOT, '.env')

// ─── Helpers ─────────────────────────────────────────────────────────────────

function handleCancel<T>(value: T | symbol): T {
  if (isCancel(value)) {
    p.cancel('Setup cancelled.')
    process.exit(0)
  }
  return value
}

function generateSecret(): string {
  return randomBytes(32).toString('hex')
}

function testDbConnection(
  host: string,
  port: string,
  user: string,
  password: string,
  name: string
): boolean {
  try {
    execSync('which mysql', { stdio: 'pipe' })
  } catch {
    p.log.warning('MySQL client not installed — skipping connection test')
    return true // Don't block setup
  }

  const s = p.spinner()
  s.start('Testing database connection...')

  try {
    execSync(`mysql -h"${host}" -P"${port}" -u"${user}" -p"${password}" -e "USE ${name}" 2>&1`, {
      stdio: 'pipe',
      timeout: 10000,
    })
    s.stop(chalk.green('Database connection successful'))
    return true
  } catch {
    s.stop(chalk.red('Database connection failed'))
    return false
  }
}

// ─── Config State ────────────────────────────────────────────────────────────

interface WizardConfig {
  // Server
  PORT: string
  HOST: string
  NODE_ENV: string
  // JWT
  JWT_TOKEN: string
  JWT_EXPIRY: string
  // Database
  DATABASE_HOST: string
  DATABASE_PORT: string
  DATABASE_NAME: string
  DATABASE_USER: string
  DATABASE_PASSWORD: string
  DATABASE_CONNECTION_LIMIT: string
  // Steam
  STEAM_API_KEY: string
  // Steam Bot (optional)
  STEAM_USERNAME?: string
  STEAM_PASSWORD?: string
  // Steam Service (optional)
  STEAM_SERVICE_URL?: string
  STEAM_SERVICE_API_KEY?: string
  STEAM_SERVICE_PORT?: string
  // Logging
  LOG_API_REQUESTS: string
  LOG_LEVEL: string
}

// ─── Wizard Steps ────────────────────────────────────────────────────────────

async function stepServer(): Promise<Pick<WizardConfig, 'PORT' | 'HOST' | 'NODE_ENV'>> {
  p.log.step(chalk.bold('Step 1: Server Configuration'))
  p.log.info('Configure the network settings for the application.')

  const PORT = handleCancel(
    await p.text({
      message: 'Server port',
      defaultValue: '3000',
      placeholder: '3000',
      validate: (val) => {
        if (!val) return 'Port is required'
        const n = Number(val)
        if (isNaN(n) || n < 1 || n > 65535) return 'Port must be between 1 and 65535'
      },
    })
  )

  const HOST = handleCancel(
    await p.text({
      message: 'Server host',
      defaultValue: '0.0.0.0',
      placeholder: '0.0.0.0 (all interfaces)',
    })
  )

  const NODE_ENV = handleCancel(
    await p.select({
      message: 'Environment',
      options: [
        {
          value: 'production' as const,
          label: 'Production',
          hint: 'Optimized for deployment',
        },
        {
          value: 'development' as const,
          label: 'Development',
          hint: 'Debug mode with HMR',
        },
      ],
    })
  )

  p.log.success('Server configuration complete')
  return { PORT, HOST, NODE_ENV }
}

async function stepJwt(): Promise<Pick<WizardConfig, 'JWT_TOKEN' | 'JWT_EXPIRY'>> {
  p.log.step(chalk.bold('Step 2: JWT Configuration'))
  p.log.info('JWT tokens are used for API authentication.')

  const autoGenerate = handleCancel(
    await p.confirm({
      message: 'Generate a secure JWT secret automatically?',
      initialValue: true,
    })
  )

  let JWT_TOKEN: string
  if (autoGenerate) {
    JWT_TOKEN = generateSecret()
    p.log.success(`Generated secure secret (${JWT_TOKEN.length} chars)`)
  } else {
    JWT_TOKEN = handleCancel(
      await p.password({
        message: 'JWT secret (minimum 32 characters)',
        validate: (val) => {
          if (!val || val.length < 32)
            return `Must be at least 32 characters (currently ${val?.length ?? 0})`
        },
      })
    )
  }

  const JWT_EXPIRY = handleCancel(
    await p.text({
      message: 'Token expiry (e.g., 1h, 24h, 7d, 30d)',
      defaultValue: '7d',
      placeholder: '7d',
    })
  )

  p.log.success('JWT configuration complete')
  return { JWT_TOKEN, JWT_EXPIRY }
}

async function stepDatabase(): Promise<
  Pick<
    WizardConfig,
    | 'DATABASE_HOST'
    | 'DATABASE_PORT'
    | 'DATABASE_NAME'
    | 'DATABASE_USER'
    | 'DATABASE_PASSWORD'
    | 'DATABASE_CONNECTION_LIMIT'
  >
> {
  p.log.step(chalk.bold('Step 3: Database Configuration'))
  p.log.info('Configure your MariaDB/MySQL database connection.')

  const DATABASE_HOST = handleCancel(
    await p.text({
      message: 'Database host',
      defaultValue: 'localhost',
      placeholder: 'localhost',
    })
  )

  const DATABASE_PORT = handleCancel(
    await p.text({
      message: 'Database port',
      defaultValue: '3306',
      placeholder: '3306',
      validate: (val) => {
        if (!val) return 'Port is required'
        const n = Number(val)
        if (isNaN(n) || n < 1 || n > 65535) return 'Port must be between 1 and 65535'
      },
    })
  )

  const DATABASE_NAME = handleCancel(
    await p.text({
      message: 'Database name',
      defaultValue: 'csinspect',
      placeholder: 'csinspect',
    })
  )

  const DATABASE_USER = handleCancel(
    await p.text({
      message: 'Database user',
      defaultValue: 'csinspect',
      placeholder: 'csinspect',
    })
  )

  const DATABASE_PASSWORD = handleCancel(
    await p.password({
      message: 'Database password',
    })
  )

  const DATABASE_CONNECTION_LIMIT = handleCancel(
    await p.text({
      message: 'Connection pool limit',
      defaultValue: '5',
      placeholder: '5',
      validate: (val) => {
        if (!val) return 'Connection limit is required'
        const n = Number(val)
        if (isNaN(n) || n < 1) return 'Must be a positive number'
      },
    })
  )

  // Test connection
  const connected = testDbConnection(
    DATABASE_HOST,
    DATABASE_PORT,
    DATABASE_USER,
    DATABASE_PASSWORD,
    DATABASE_NAME
  )
  if (!connected) {
    const continueAnyway = handleCancel(
      await p.confirm({
        message: 'Connection failed. Continue anyway?',
        initialValue: false,
      })
    )
    if (!continueAnyway) {
      p.cancel('Fix your database settings and try again.')
      process.exit(1)
    }
  }

  p.log.success('Database configuration complete')
  return {
    DATABASE_HOST,
    DATABASE_PORT,
    DATABASE_NAME,
    DATABASE_USER,
    DATABASE_PASSWORD,
    DATABASE_CONNECTION_LIMIT,
  }
}

async function stepSteamApi(): Promise<Pick<WizardConfig, 'STEAM_API_KEY'>> {
  p.log.step(chalk.bold('Step 4: Steam API Configuration'))

  p.note(
    [
      'A Steam Web API key is required for:',
      '  - User authentication via Steam OpenID',
      '  - Fetching user profiles and inventory data',
      '',
      `Get your key: ${chalk.cyan('https://steamcommunity.com/dev/apikey')}`,
    ].join('\n'),
    'Steam API Key'
  )

  const STEAM_API_KEY = handleCancel(
    await p.text({
      message: 'Steam API key (32 characters)',
      validate: (val) => {
        if (!val || val.length !== 32)
          return `Must be exactly 32 characters (currently ${val?.length ?? 0})`
      },
    })
  )

  p.log.success('Steam API configuration complete')
  return { STEAM_API_KEY }
}

async function stepSteamBot(): Promise<Pick<WizardConfig, 'STEAM_USERNAME' | 'STEAM_PASSWORD'>> {
  p.log.step(chalk.bold('Step 5: Steam Bot Account (Optional)'))
  p.log.info('A Steam bot account enables inspect features for market items.')
  p.log.warning('Use a dedicated account WITHOUT Steam Guard (2FA)')
  p.log.warning('Deprecated: Consider using Steam Service instead (Step 6)')

  const useSteamBot = handleCancel(
    await p.confirm({
      message: 'Configure a Steam bot account?',
      initialValue: false,
    })
  )

  if (!useSteamBot) {
    p.log.info('Skipped — some inspect features will be limited')
    return {}
  }

  const STEAM_USERNAME = handleCancel(
    await p.text({
      message: 'Steam username (not email)',
    })
  )

  const STEAM_PASSWORD = handleCancel(
    await p.password({
      message: 'Steam password',
    })
  )

  p.log.success('Steam bot account configured')
  return { STEAM_USERNAME, STEAM_PASSWORD }
}

async function stepSteamService(): Promise<
  Pick<WizardConfig, 'STEAM_SERVICE_URL' | 'STEAM_SERVICE_API_KEY' | 'STEAM_SERVICE_PORT'>
> {
  p.log.step(chalk.bold('Step 6: Steam Service (Optional, Recommended)'))
  p.log.info('A separate Steam service provides better scalability and separation of concerns.')

  const useSteamService = handleCancel(
    await p.confirm({
      message: 'Configure Steam Service?',
      initialValue: false,
    })
  )

  if (!useSteamService) {
    p.log.info('Skipped')
    return {}
  }

  const STEAM_SERVICE_URL = handleCancel(
    await p.text({
      message: 'Steam Service URL',
      defaultValue: 'http://127.0.0.1:3655',
      placeholder: 'http://127.0.0.1:3655',
    })
  )

  const STEAM_SERVICE_API_KEY = generateSecret()
  p.log.success(`Generated Steam Service API key (${STEAM_SERVICE_API_KEY.length} chars)`)

  const STEAM_SERVICE_PORT = handleCancel(
    await p.text({
      message: 'Steam Service port',
      defaultValue: '3655',
      placeholder: '3655',
    })
  )

  p.log.success('Steam Service configured')
  return { STEAM_SERVICE_URL, STEAM_SERVICE_API_KEY, STEAM_SERVICE_PORT }
}

async function stepLogging(): Promise<Pick<WizardConfig, 'LOG_API_REQUESTS' | 'LOG_LEVEL'>> {
  p.log.step(chalk.bold('Step 7: Logging'))

  const logRequests = handleCancel(
    await p.confirm({
      message: 'Enable API request logging?',
      initialValue: true,
    })
  )

  const LOG_LEVEL = handleCancel(
    await p.select({
      message: 'Log level',
      options: [
        { value: 'info' as const, label: 'Info', hint: 'Standard operational messages' },
        {
          value: 'debug' as const,
          label: 'Debug',
          hint: 'Verbose output for troubleshooting',
        },
        { value: 'warn' as const, label: 'Warn', hint: 'Only warnings and errors' },
        { value: 'error' as const, label: 'Error', hint: 'Only critical errors' },
      ],
    })
  )

  p.log.success('Logging configuration complete')
  return { LOG_API_REQUESTS: logRequests ? 'true' : 'false', LOG_LEVEL }
}

// ─── .env File Generation ────────────────────────────────────────────────────

function generateEnvContent(config: WizardConfig): string {
  const lines: string[] = [
    `# Generated by CS2Inspect Setup Wizard on ${new Date().toISOString()}`,
    '',
    '########## Server Configuration ########## [REQUIRED]',
    `PORT=${config.PORT}`,
    `HOST=${config.HOST}`,
    `NODE_ENV=${config.NODE_ENV}`,
    '',
    '########## JWT Configuration ########## [REQUIRED]',
    `JWT_TOKEN=${config.JWT_TOKEN}`,
    `JWT_EXPIRY=${config.JWT_EXPIRY}`,
    '',
    '########## Database Configuration ########## [REQUIRED]',
    `DATABASE_HOST=${config.DATABASE_HOST}`,
    `DATABASE_PORT=${config.DATABASE_PORT}`,
    `DATABASE_USER=${config.DATABASE_USER}`,
    `DATABASE_PASSWORD=${config.DATABASE_PASSWORD}`,
    `DATABASE_NAME=${config.DATABASE_NAME}`,
    `DATABASE_CONNECTION_LIMIT=${config.DATABASE_CONNECTION_LIMIT}`,
    '',
    '########## Steam API Configuration ########## [REQUIRED]',
    `STEAM_API_KEY=${config.STEAM_API_KEY}`,
  ]

  if (config.STEAM_USERNAME) {
    lines.push(
      '',
      '########## Steam Bot Account ########## [OPTIONAL, DEPRECATED]',
      `STEAM_USERNAME=${config.STEAM_USERNAME}`,
      `STEAM_PASSWORD=${config.STEAM_PASSWORD}`
    )
  }

  if (config.STEAM_SERVICE_URL) {
    lines.push(
      '',
      '########## Steam Service Configuration ########## [RECOMMENDED]',
      `STEAM_SERVICE_URL=${config.STEAM_SERVICE_URL}`,
      `STEAM_SERVICE_API_KEY=${config.STEAM_SERVICE_API_KEY}`
    )
  }

  lines.push(
    '',
    '########## Logging Configuration ########## [OPTIONAL]',
    `LOG_API_REQUESTS=${config.LOG_API_REQUESTS}`,
    `LOG_LEVEL=${config.LOG_LEVEL}`,
    '',
    '########## Rate Limiting ########## [DEFAULTS]',
    'STEAM_RATE_LIMIT_DELAY=1500',
    'STEAM_MAX_QUEUE_SIZE=100',
    'STEAM_REQUEST_TIMEOUT=10000',
    'STEAM_QUEUE_TIMEOUT=30000',
    ''
  )

  return lines.join('\n')
}

// ─── Main ────────────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  p.intro(chalk.bgCyan.black(' CS2Inspect Setup Wizard '))

  // Check for existing .env
  if (existsSync(ENV_PATH)) {
    p.log.warning('.env file already exists')

    const overwrite = handleCancel(
      await p.confirm({
        message: 'Do you want to overwrite it? (a backup will be created)',
        initialValue: false,
      })
    )

    if (!overwrite) {
      p.outro('Existing .env file preserved.')
      return
    }

    // Create backup
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)
    const backupPath = `${ENV_PATH}.backup.${timestamp}`
    copyFileSync(ENV_PATH, backupPath)
    p.log.success(`Backup created: .env.backup.${timestamp}`)
  }

  // Run all steps
  const server = await stepServer()
  const jwt = await stepJwt()
  const database = await stepDatabase()
  const steamApi = await stepSteamApi()
  const steamBot = await stepSteamBot()
  const steamService = await stepSteamService()
  const logging = await stepLogging()

  // Combine config
  const config: WizardConfig = {
    ...server,
    ...jwt,
    ...database,
    ...steamApi,
    ...steamBot,
    ...steamService,
    ...logging,
  }

  // Generate and write .env
  const content = generateEnvContent(config)
  writeFileSync(ENV_PATH, content, 'utf-8')
  chmodSync(ENV_PATH, 0o600)

  p.log.success('.env file created with restricted permissions (600)')

  // Summary
  const summaryLines = [
    `${chalk.dim('Server:')}         ${config.HOST}:${config.PORT} (${config.NODE_ENV})`,
    `${chalk.dim('Database:')}       ${config.DATABASE_USER}@${config.DATABASE_HOST}:${config.DATABASE_PORT}/${config.DATABASE_NAME}`,
    `${chalk.dim('Steam API:')}      ${chalk.green('Configured')}`,
    `${chalk.dim('Steam Bot:')}      ${config.STEAM_USERNAME ? chalk.green('Configured') : chalk.dim('Not configured')}`,
    `${chalk.dim('Steam Service:')}  ${config.STEAM_SERVICE_URL ? chalk.green('Configured') : chalk.dim('Not configured')}`,
    `${chalk.dim('Logging:')}        ${config.LOG_API_REQUESTS === 'true' ? 'Enabled' : 'Disabled'} (${config.LOG_LEVEL})`,
  ]

  p.note(summaryLines.join('\n'), 'Configuration Summary')

  p.note(
    [
      `${chalk.cyan('1.')} Review configuration:  ${chalk.cyan('cat .env')}`,
      `${chalk.cyan('2.')} Initialize database:   ${chalk.cyan('bun run db:push')}`,
      `${chalk.cyan('3.')} Validate setup:        ${chalk.cyan('bun run cli validate')}`,
      `${chalk.cyan('4.')} Start application:     ${chalk.cyan('bun run dev')}`,
    ].join('\n'),
    'Next Steps'
  )

  p.outro(chalk.green('Setup complete!'))
}

// ─── Signal Handling ─────────────────────────────────────────────────────────

process.on('SIGINT', () => {
  console.log()
  p.cancel('Setup cancelled.')
  process.exit(0)
})

// ─── Run ─────────────────────────────────────────────────────────────────────

main().catch((err) => {
  p.log.error(`Fatal error: ${err.message}`)
  process.exit(1)
})
