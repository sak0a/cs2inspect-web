#!/usr/bin/env bun

import * as p from '@clack/prompts'
import { isCancel } from '@clack/core'
import chalk from 'chalk'
import { spawn, execSync } from 'child_process'
import { existsSync } from 'fs'
import { resolve } from 'path'

// ─── Types ───────────────────────────────────────────────────────────────────

interface Command {
  id: string
  label: string
  hint: string
  run: string | string[]
  dangerous?: boolean
  dangerMessage?: string
}

interface Category {
  id: string
  emoji: string
  label: string
  description: string
  commands: Command[]
}

interface HealthCheck { name: string; status: string; latency_ms?: number }
interface HealthResponse { status?: string; uptime?: number; checks?: HealthCheck[] }

// ─── Constants ───────────────────────────────────────────────────────────────

const PROJECT_ROOT = resolve(import.meta.dirname, '..')
const VERSION = '1.0.0'

// ─── Command Registry ────────────────────────────────────────────────────────

const categories: Category[] = [
  {
    id: 'dev',
    emoji: '\u{1F680}',
    label: 'Development',
    description: 'Dev server, build, preview',
    commands: [
      {
        id: 'dev',
        label: 'Start dev server',
        hint: 'Starts Nuxt on localhost:3210 with hot module replacement',
        run: 'bun run dev',
      },
      {
        id: 'build',
        label: 'Production build',
        hint: 'Creates an optimized .output/ bundle for deployment',
        run: 'bun run build',
      },
      {
        id: 'preview',
        label: 'Preview production build',
        hint: 'Serves the .output/ build locally to test before deploying',
        run: 'bun run preview',
      },
      {
        id: 'generate',
        label: 'Static site generation',
        hint: 'Pre-renders all routes to static HTML files',
        run: 'bun run generate',
      },
      {
        id: 'dev:seed',
        label: 'Seed dev mock users',
        hint: 'Creates dev user and admin records in the database from env vars',
        run: './scripts/dev-auth.ts seed',
      },
      {
        id: 'dev:login',
        label: 'Print dev login curl',
        hint: 'Prints a curl command for AI agents to authenticate as the dev user',
        run: './scripts/dev-auth.ts login',
      },
      {
        id: 'dev:login:admin',
        label: 'Print dev admin login curl',
        hint: 'Prints a curl command to authenticate as the dev admin user',
        run: './scripts/dev-auth.ts login --admin',
      },
    ],
  },
  {
    id: 'test',
    emoji: '\u{1F9EA}',
    label: 'Testing & Quality',
    description: 'Tests, lint, typecheck',
    commands: [
      {
        id: 'test',
        label: 'Run tests',
        hint: 'Runs all Vitest test suites once',
        run: 'bun test',
      },
      {
        id: 'test:watch',
        label: 'Run tests (watch mode)',
        hint: 'Re-runs tests automatically when files change',
        run: 'bun test --watch',
      },
      {
        id: 'test:e2e',
        label: 'Run E2E tests',
        hint: 'Builds Nuxt and tests dev mock auth against a real server (set E2E_WITH_DB=true for admin DB tests)',
        run: 'bun run test:e2e',
      },
      {
        id: 'test:coverage',
        label: 'Run tests with coverage',
        hint: 'Generates a code coverage report after running tests',
        run: 'bun test --coverage',
      },
      {
        id: 'lint',
        label: 'Run ESLint',
        hint: 'Checks code for style violations and potential errors',
        run: 'bun run lint',
      },
      {
        id: 'lint:fix',
        label: 'Run ESLint (auto-fix)',
        hint: 'Automatically fixes fixable lint issues in-place',
        run: 'bun run lint -- --fix',
      },
      {
        id: 'typecheck',
        label: 'TypeScript type check',
        hint: 'Runs vue-tsc to verify all types are correct',
        run: 'bun run typecheck',
      },
      {
        id: 'check:all',
        label: 'Run ALL checks',
        hint: 'Runs lint, typecheck, and tests sequentially (stops on first failure)',
        run: ['bun run lint', 'bun run typecheck', 'bun test'],
      },
    ],
  },
  {
    id: 'db',
    emoji: '\u{1F5C4}\u{FE0F}',
    label: 'Database',
    description: 'Schema, migrations, studio',
    commands: [
      {
        id: 'db:push',
        label: 'Push schema to database',
        hint: 'Pushes Drizzle schema changes directly to the database (no migration files)',
        run: 'bun run db:push',
        dangerous: true,
        dangerMessage: 'push schema changes directly to the database',
      },
      {
        id: 'db:generate',
        label: 'Generate migrations',
        hint: 'Creates SQL migration files from schema diff (safe, only creates files)',
        run: 'bun run db:generate',
      },
      {
        id: 'db:migrate',
        label: 'Run migrations',
        hint: 'Applies all pending migration files to the database',
        run: 'bun run db:migrate',
        dangerous: true,
        dangerMessage: 'apply pending migrations to the database',
      },
      {
        id: 'db:studio',
        label: 'Open Drizzle Studio',
        hint: 'Launches a web GUI for browsing and editing database records',
        run: 'bun run db:studio',
      },
      {
        id: 'db:introspect',
        label: 'Introspect database',
        hint: 'Reverse-engineers an existing database into a Drizzle schema file',
        run: 'bun run db:introspect',
      },
    ],
  },
  {
    id: 'deploy',
    emoji: '\u{1F4E6}',
    label: 'Deploy',
    description: 'Docker image builds via GitHub Actions',
    commands: [
      {
        id: 'deploy:info',
        label: 'Deployment info',
        hint: 'Docker images are built by GitHub Actions on push to master and version tags (v*)',
        run: 'echo "Push to master → :latest image. Create release tag (v1.2.3) → :v1.2.3 image. Configure WEB_IMAGE_TAG in Coolify."',
      },
    ],
  },
  {
    id: 'services',
    emoji: '\u{1F9E9}',
    label: 'Services',
    description: 'Deploy individual services to standalone branches',
    commands: [
      {
        id: 'deploy:weapon-scraper',
        label: 'Deploy weapon-scraper',
        hint: 'Extracts weapon-scraper to weapon-scraper-only branch',
        run: './scripts/deploy-service.sh weapon-scraper',
        dangerous: true,
        dangerMessage: 'force-push weapon-scraper to weapon-scraper-only branch',
      },
      {
        id: 'deploy:charm-scraper',
        label: 'Deploy charm-scraper',
        hint: 'Extracts charm-scraper to charm-scraper-only branch',
        run: './scripts/deploy-service.sh charm-scraper',
        dangerous: true,
        dangerMessage: 'force-push charm-scraper to charm-scraper-only branch',
      },
      {
        id: 'deploy:sticker-scraper',
        label: 'Deploy sticker-scraper',
        hint: 'Extracts sticker-scraper to sticker-scraper-only branch',
        run: './scripts/deploy-service.sh sticker-scraper',
        dangerous: true,
        dangerMessage: 'force-push sticker-scraper to sticker-scraper-only branch',
      },
      {
        id: 'deploy:steam-service',
        label: 'Deploy steam-service',
        hint: 'Extracts steam-service to steam-service-only branch',
        run: './scripts/deploy-service.sh steam-service',
        dangerous: true,
        dangerMessage: 'force-push steam-service to steam-service-only branch',
      },
      {
        id: 'deploy:docs-site',
        label: 'Deploy docs-site',
        hint: 'Extracts docs-site to docs-site-only branch',
        run: './scripts/deploy-service.sh docs-site',
        dangerous: true,
        dangerMessage: 'force-push docs-site to docs-site-only branch',
      },
    ],
  },
  {
    id: 'setup',
    emoji: '\u{2699}\u{FE0F}',
    label: 'Setup & Config',
    description: 'Wizard, env validation, server install',
    commands: [
      {
        id: 'setup',
        label: 'Setup wizard',
        hint: 'Interactive 7-step .env configuration (server, JWT, DB, Steam API, etc.)',
        run: 'bun ./scripts/setup-wizard.ts',
      },
      {
        id: 'validate',
        label: 'Validate environment',
        hint: 'Checks all env vars are set correctly and tests DB connection',
        run: 'bun ./scripts/validate-env.ts',
      },
      {
        id: 'install:server',
        label: 'Server install (Ubuntu/Debian)',
        hint: 'Full automated server setup: Node.js, Bun, MariaDB, PM2, firewall',
        run: './scripts/install.sh',
      },
      {
        id: 'install:remote',
        label: 'Remote install (multi-OS)',
        hint: 'One-command remote deployment with systemd service setup',
        run: './scripts/remote-install.sh',
      },
    ],
  },
  {
    id: 'docs',
    emoji: '\u{1F4DA}',
    label: 'Documentation',
    description: 'Docs site dev, build, preview',
    commands: [
      {
        id: 'docs:dev',
        label: 'Docs dev server',
        hint: 'Starts the documentation site locally with HMR',
        run: 'bun run docs:dev',
      },
      {
        id: 'docs:build',
        label: 'Build docs',
        hint: 'Creates a production build of the documentation site',
        run: 'bun run docs:build',
      },
      {
        id: 'docs:preview',
        label: 'Preview docs',
        hint: 'Previews the production build of the docs site',
        run: 'bun run docs:preview',
      },
      {
        id: 'docs:install',
        label: 'Install docs dependencies',
        hint: 'Installs dependencies for the docs-site sub-project',
        run: 'bun run docs:install',
      },
    ],
  },
  {
    id: 'maintain',
    emoji: '\u{1F9F9}',
    label: 'Maintenance',
    description: 'Clean, update, health check, info',
    commands: [
      {
        id: 'clean',
        label: 'Clean build caches',
        hint: 'Removes .nuxt, .output, dist, and node_modules/.cache',
        run: '__special:clean',
      },
      {
        id: 'clean:all',
        label: 'Clean everything (incl. node_modules)',
        hint: 'Full reset \u2014 removes all build artifacts AND node_modules',
        run: '__special:clean:all',
        dangerous: true,
        dangerMessage: 'delete node_modules and all build artifacts (you\'ll need to run bun install again)',
      },
      {
        id: 'update',
        label: 'Update dependencies',
        hint: 'Runs bun update to upgrade all packages to latest compatible versions',
        run: 'bun update',
      },
      {
        id: 'health',
        label: 'Health check',
        hint: 'Checks if the application is running and responds to health endpoint',
        run: '__special:health',
      },
      {
        id: 'info',
        label: 'Project info',
        hint: 'Displays runtime versions, git branch, and environment status',
        run: '__special:info',
      },
    ],
  },
]

// ─── Helpers ─────────────────────────────────────────────────────────────────

function exec(cmd: string): string {
  try {
    return execSync(cmd, { cwd: PROJECT_ROOT, encoding: 'utf-8' }).trim()
  } catch {
    return 'unknown'
  }
}

function handleCancel<T>(value: T | symbol): T {
  if (isCancel(value)) {
    p.cancel('Goodbye!')
    process.exit(0)
  }
  return value
}

async function runCommand(cmd: string | string[]): Promise<number> {
  const commands = Array.isArray(cmd) ? cmd : [cmd]

  for (const command of commands) {
    if (commands.length > 1) {
      p.log.step(chalk.dim(`\u25B6 ${command}`))
    }

    const exitCode = await new Promise<number>((resolve) => {
      const child = spawn(command, {
        cwd: PROJECT_ROOT,
        stdio: 'inherit',
        shell: true,
        env: { ...process.env, FORCE_COLOR: '1' },
      })
      child.on('close', (code) => resolve(code ?? 1))
      child.on('error', () => resolve(1))
    })

    if (exitCode !== 0) {
      p.log.error(`Command failed with exit code ${exitCode}`)
      return exitCode
    }
  }

  return 0
}

async function confirmDangerous(dangerMessage: string): Promise<boolean> {
  p.log.warning(chalk.yellow(`This will ${dangerMessage}.`))
  const shouldContinue = await p.confirm({
    message: 'Are you sure you want to continue?',
  })
  return handleCancel(shouldContinue)
}

function findCommand(id: string): { category: Category; command: Command } | undefined {
  for (const category of categories) {
    const command = category.commands.find((cmd) => cmd.id === id)
    if (command) return { category, command }
  }
  return undefined
}

// ─── Special Command Handlers ────────────────────────────────────────────────

async function runHealthCheck(): Promise<void> {
  const s = p.spinner()
  s.start('Checking application health...')

  try {
    const response = await fetch('http://localhost:3210/api/health/ready')
    if (!response.ok) {
      s.stop(chalk.red('Application returned an error'))
      p.log.info(`Status: ${response.status} ${response.statusText}`)
      return
    }

    const data = await response.json() as Record<string, unknown>
    s.stop(chalk.green('Application is healthy'))

    if (data && typeof data === 'object') {
      const lines: string[] = []
      if ('status' in data) lines.push(`${chalk.dim('Status:')}   ${data.status}`)
      if ('uptime' in data) lines.push(`${chalk.dim('Uptime:')}   ${data.uptime}s`)
      const healthData = data as HealthResponse
      if (Array.isArray(healthData.checks)) {
        for (const check of healthData.checks) {
          const icon = check.status === 'ok' ? chalk.green('\u2713') : chalk.red('\u2717')
          lines.push(`${icon} ${check.name}${check.latency_ms ? chalk.dim(` (${check.latency_ms}ms)`) : ''}`)
        }
      }
      if (lines.length > 0) {
        p.note(lines.join('\n'), 'Health Details')
      }
    }
  } catch {
    s.stop(chalk.red('Application is not running'))
    p.log.info('Start it with: ' + chalk.cyan('bun run dev'))
  }
}

async function showProjectInfo(): Promise<void> {
  const s = p.spinner()
  s.start('Gathering project info...')

  const bunVersion = exec('bun --version')
  const nodeVersion = exec('node --version')
  const gitBranch = exec('git rev-parse --abbrev-ref HEAD')
  const gitHash = exec('git rev-parse --short HEAD')
  const gitDirty = exec('git status --porcelain') !== '' ? chalk.yellow(' (dirty)') : chalk.green(' (clean)')
  const hasEnv = existsSync(resolve(PROJECT_ROOT, '.env'))
  const hasOutput = existsSync(resolve(PROJECT_ROOT, '.output'))
  const hasNodeModules = existsSync(resolve(PROJECT_ROOT, 'node_modules'))

  s.stop('Project info gathered')

  p.note(
    [
      `${chalk.dim('Bun:')}            ${bunVersion}`,
      `${chalk.dim('Node:')}           ${nodeVersion}`,
      `${chalk.dim('Platform:')}       ${process.platform} ${process.arch}`,
      '',
      `${chalk.dim('Git branch:')}     ${gitBranch}${gitDirty}`,
      `${chalk.dim('Git commit:')}     ${gitHash}`,
      '',
      `${chalk.dim('.env file:')}      ${hasEnv ? chalk.green('Found') : chalk.red('Missing')}`,
      `${chalk.dim('.output/ dir:')}   ${hasOutput ? chalk.green('Built') : chalk.dim('Not built')}`,
      `${chalk.dim('node_modules:')}   ${hasNodeModules ? chalk.green('Installed') : chalk.red('Missing')}`,
    ].join('\n'),
    'CS2Inspect Project Info',
  )
}

async function runClean(includeNodeModules: boolean): Promise<void> {
  const targets = ['.nuxt', '.output', 'dist', 'node_modules/.cache']
  if (includeNodeModules) targets.push('node_modules')

  const s = p.spinner()
  s.start('Cleaning build artifacts...')

  const removed: string[] = []
  for (const target of targets) {
    const fullPath = resolve(PROJECT_ROOT, target)
    if (existsSync(fullPath)) {
      execSync(`rm -rf "${fullPath}"`)
      removed.push(target)
    }
  }

  if (removed.length > 0) {
    s.stop(chalk.green(`Cleaned: ${removed.join(', ')}`))
  } else {
    s.stop('Nothing to clean \u2014 already clean!')
  }

  if (includeNodeModules) {
    p.log.warning('node_modules was deleted. Run ' + chalk.cyan('bun install') + ' to restore dependencies.')
    p.log.info('The CLI will now exit.')
    process.exit(0)
  }
}

// ─── Execute a Command ──────────────────────────────────────────────────────

async function executeCommand(command: Command): Promise<void> {
  // Handle dangerous operations
  if (command.dangerous) {
    const confirmed = await confirmDangerous(command.dangerMessage || 'perform this action')
    if (!confirmed) {
      p.log.info('Cancelled.')
      return
    }
  }

  // Handle special commands
  if (typeof command.run === 'string' && command.run.startsWith('__special:')) {
    switch (command.run) {
      case '__special:health':
        await runHealthCheck()
        return
      case '__special:info':
        await showProjectInfo()
        return
      case '__special:clean':
        await runClean(false)
        return
      case '__special:clean:all':
        await runClean(true)
        return
    }
  }

  // Check shell script exists (extract just the script path, ignore arguments)
  if (typeof command.run === 'string' && command.run.startsWith('./scripts/')) {
    const scriptFile = command.run.split(' ')[0]!
    const scriptPath = resolve(PROJECT_ROOT, scriptFile)
    if (!existsSync(scriptPath)) {
      p.log.error(`Script not found: ${scriptFile}`)
      return
    }
  }

  console.log() // breathing room before command output
  const exitCode = await runCommand(command.run)
  console.log() // breathing room after command output

  if (exitCode === 0) {
    p.log.success('Done!')
  }
}

// ─── Help & List Output ─────────────────────────────────────────────────────

function showHelp(): void {
  console.log()
  console.log(chalk.bold('CS2Inspect CLI') + chalk.dim(` v${VERSION}`) + ' \u2014 Unified project management')
  console.log()
  console.log(chalk.dim('Usage:'))
  console.log(`  ${chalk.cyan('bun run cli')}              Interactive mode (menu-driven)`)
  console.log(`  ${chalk.cyan('bun run cli <command>')}    Run a command directly`)
  console.log(`  ${chalk.cyan('bun run cli --help')}       Show this help message`)
  console.log(`  ${chalk.cyan('bun run cli --list')}       Compact command list`)
  console.log()

  for (const category of categories) {
    console.log(chalk.bold(`${category.emoji} ${category.label}`) + chalk.dim(` \u2014 ${category.description}`))
    for (const cmd of category.commands) {
      const id = chalk.cyan(cmd.id.padEnd(20))
      const danger = cmd.dangerous ? chalk.yellow(' \u26A0\uFE0F') : ''
      console.log(`  ${id} ${cmd.hint}${danger}`)
    }
    console.log()
  }
}

function showList(): void {
  console.log()
  console.log(chalk.bold('Available commands:'))
  console.log()
  for (const category of categories) {
    for (const cmd of category.commands) {
      const danger = cmd.dangerous ? chalk.yellow('\u26A0') : ' '
      console.log(`  ${danger} ${chalk.cyan(cmd.id.padEnd(20))} ${chalk.dim(cmd.label)}`)
    }
  }
  console.log()
}

// ─── Direct Mode ─────────────────────────────────────────────────────────────

async function runDirect(commandId: string): Promise<void> {
  const found = findCommand(commandId)

  if (!found) {
    p.log.error(`Unknown command: ${chalk.cyan(commandId)}`)

    // Suggest similar commands
    const allIds = categories.flatMap((c) => c.commands.map((cmd) => cmd.id))
    const suggestions = allIds.filter((id) =>
      id.includes(commandId) || commandId.includes(id.split(':')[0] ?? ''),
    )
    if (suggestions.length > 0) {
      p.log.info(`Did you mean: ${suggestions.map((s) => chalk.cyan(s)).join(', ')}?`)
    }
    p.log.info(`Run ${chalk.cyan('bun run cli --help')} to see all available commands.`)
    process.exit(1)
  }

  p.intro(chalk.bgCyan.black(' CS2Inspect CLI '))
  p.log.step(`Running ${chalk.cyan(found.command.label)}`)
  await executeCommand(found.command)
  p.outro('Done')
}

// ─── Interactive Mode ────────────────────────────────────────────────────────

async function showSubMenu(category: Category): Promise<void> {
  const commandId = handleCancel(await p.select({
    message: `${category.emoji} ${category.label}`,
    options: [
      ...category.commands.map((cmd) => ({
        value: cmd.id,
        label: cmd.label + (cmd.dangerous ? chalk.yellow(' \u26A0\uFE0F') : ''),
        hint: cmd.hint,
      })),
      { value: '__back', label: chalk.dim('\u2190 Back to main menu'), hint: '' },
    ],
  }))

  if (commandId === '__back') return

  const command = category.commands.find((cmd) => cmd.id === commandId)
  if (command) {
    await executeCommand(command)
  }
}

async function showMainMenu(): Promise<void> {
  p.intro(chalk.bgCyan.black(' CS2Inspect CLI '))

  // Main loop
  while (true) {
    const categoryId = handleCancel(await p.select({
      message: 'What would you like to do?',
      options: [
        ...categories.map((cat) => ({
          value: cat.id,
          label: `${cat.emoji}  ${cat.label}`,
          hint: cat.description,
        })),
        { value: '__quit', label: '\u{1F44B}  Quit', hint: 'Exit the CLI' },
      ],
    }))

    if (categoryId === '__quit') {
      p.outro('See you later!')
      return
    }

    const category = categories.find((c) => c.id === categoryId)
    if (category) {
      await showSubMenu(category)
    }
  }
}

// ─── Entry Point ─────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  const args = process.argv.slice(2)

  // Handle flags
  if (args.includes('--help') || args.includes('-h')) {
    showHelp()
    return
  }

  if (args.includes('--list') || args.includes('-l')) {
    showList()
    return
  }

  if (args.includes('--version') || args.includes('-v')) {
    console.log(`CS2Inspect CLI v${VERSION}`)
    return
  }

  // Direct command mode
  const firstArg = args[0]
  if (firstArg && !firstArg.startsWith('-')) {
    await runDirect(firstArg)
    return
  }

  // Interactive mode
  await showMainMenu()
}

// ─── Signal Handling ─────────────────────────────────────────────────────────

process.on('SIGINT', () => {
  console.log()
  p.cancel('Goodbye!')
  process.exit(0)
})

process.on('uncaughtException', (err) => {
  p.log.error(`Unexpected error: ${err.message}`)
  process.exit(1)
})

// ─── Run ─────────────────────────────────────────────────────────────────────

main().catch((err) => {
  p.log.error(`Fatal error: ${err.message}`)
  process.exit(1)
})
