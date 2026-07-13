#!/usr/bin/env bun
import { spawn, type ChildProcess } from 'node:child_process'
import { execSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'
import { chromium } from 'playwright-core'
import { expect as playwrightExpect } from '@playwright/test'
import { waitForPort } from 'get-port-please'
import {
  DEFAULT_DEV_MOCK_ADMIN_STEAMID,
  DEFAULT_DEV_MOCK_STEAMID,
} from '../server/utils/devAuth'
import { applyE2eTestEnv } from '../test/e2e/helpers/env'
import { prepareTestDatabase, waitForDatabase } from '../test/e2e/helpers/database'

const rootDir = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const serverEntry = resolve(rootDir, '.output/server/index.mjs')
const host = '127.0.0.1'
const port = 3210

applyE2eTestEnv()

let failures = 0
let serverProcess: ChildProcess | undefined

function pass(message: string): void {
  console.log(`  ✓ ${message}`)
}

function fail(message: string, error?: unknown): void {
  failures++
  console.error(`  ✗ ${message}`)
  if (error !== undefined) {
    console.error(error)
  }
}

async function runStep(name: string, fn: () => Promise<void>): Promise<void> {
  try {
    await fn()
    pass(name)
  } catch (error) {
    fail(name, error)
  }
}

async function stopServer(): Promise<void> {
  if (!serverProcess || serverProcess.killed) {
    return
  }

  serverProcess.kill('SIGTERM')
  await new Promise<void>((resolvePromise) => {
    const timeout = setTimeout(() => {
      serverProcess?.kill('SIGKILL')
      resolvePromise()
    }, 5000)

    serverProcess?.once('exit', () => {
      clearTimeout(timeout)
      resolvePromise()
    })
  })
}

async function extractAuthCookie(response: Response): Promise<string> {
  const cookies = response.headers.getSetCookie?.() ?? []
  const authCookie = cookies.find((cookie) => cookie.startsWith('auth_token='))
  if (authCookie) {
    return authCookie.split(';')[0]?.trim() ?? ''
  }

  const raw = response.headers.get('set-cookie') ?? ''
  return raw.split(';')[0]?.trim() ?? ''
}

type ApiFetchInit = Omit<RequestInit, 'body'> & { body?: unknown }

async function apiFetch(baseUrl: string, path: string, init?: ApiFetchInit): Promise<Response> {
  const headers = new Headers(init?.headers)
  if (init?.body !== undefined && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json')
  }

  const body =
    init?.body !== undefined && typeof init.body !== 'string'
      ? JSON.stringify(init.body)
      : init?.body

  return fetch(new URL(path, baseUrl), {
    ...init,
    headers,
    body: body as BodyInit | undefined,
  })
}

const databaseReady =
  process.env.E2E_SKIP_DB === 'true' ? false : await waitForDatabase(30)

if (databaseReady) {
  prepareTestDatabase()
  console.log('E2E database ready — running database-backed tests')
} else {
  console.log('No MariaDB detected — skipping database-backed admin tests')
}

console.log('Building Nuxt for e2e...')
execSync('bun run build', {
  cwd: rootDir,
  env: {
    ...process.env,
    NODE_ENV: 'development',
    DEV_AUTH_ENABLED: 'true',
    NUXT_PUBLIC_DEV_AUTH_ENABLED: 'true',
  },
  stdio: 'inherit',
})

let authCookie = ''
let baseUrl = ''

try {
  serverProcess = spawn('node', [serverEntry], {
    cwd: rootDir,
    env: {
      ...process.env,
      PORT: String(port),
      HOST: host,
      NODE_ENV: 'development',
      DEV_AUTH_ENABLED: 'true',
      NUXT_PUBLIC_DEV_AUTH_ENABLED: 'true',
      E2E_DISABLE_BACKGROUND_JOBS: 'true',
    },
    stdio: ['ignore', 'pipe', 'pipe'],
  })

  serverProcess.stdout?.on('data', (chunk) => process.stdout.write(chunk))
  serverProcess.stderr?.on('data', (chunk) => process.stdout.write(chunk))

  await waitForPort(port, { host, retries: 60 })
  baseUrl = `http://${host}:${port}`
  console.log(`E2E server listening at ${baseUrl}`)

  await runStep('dev user login sets auth session', async () => {
    const response = await apiFetch(baseUrl, '/api/auth/dev/login', {
      method: 'POST',
      body: { username: 'dev', password: 'devpassword', as: 'user' },
    })

    if (response.status !== 200) {
      const text = await response.text()
      throw new Error(`Expected status 200, got ${response.status}: ${text}`)
    }

    const data = (await response.json()) as {
      steamId: string
      authenticated: boolean
      role: string
    }

    if (!data.authenticated || data.role !== 'user') {
      throw new Error(`Unexpected login payload: ${JSON.stringify(data)}`)
    }

    if (data.steamId !== DEFAULT_DEV_MOCK_STEAMID) {
      throw new Error(`Expected steamId ${DEFAULT_DEV_MOCK_STEAMID}, got ${data.steamId}`)
    }

    authCookie = await extractAuthCookie(response)
    if (!authCookie.includes('auth_token=')) {
      throw new Error(`Missing auth_token cookie (cookie: ${authCookie})`)
    }
  })

  await runStep('invalid dev credentials are rejected', async () => {
    const response = await apiFetch(baseUrl, '/api/auth/dev/login', {
      method: 'POST',
      body: { username: 'dev', password: 'wrong-password', as: 'user' },
    })

    if (response.status !== 401) {
      throw new Error(`Expected status 401, got ${response.status}`)
    }
  })

  if (databaseReady) {
    await runStep('protected routes accept dev session cookie', async () => {
      const response = await apiFetch(
        baseUrl,
        `/api/auth/validate?steamId=${DEFAULT_DEV_MOCK_STEAMID}`,
        {
          headers: { Cookie: authCookie },
        }
      )

      if (response.status !== 200) {
        throw new Error(`Expected status 200, got ${response.status}`)
      }

      const validation = (await response.json()) as { authenticated: boolean; steamId: string }
      if (!validation.authenticated || validation.steamId !== DEFAULT_DEV_MOCK_STEAMID) {
        throw new Error(`Unexpected validation response: ${JSON.stringify(validation)}`)
      }
    })
  }

  if (databaseReady) {
    await runStep('dev admin login works with database', async () => {
      const response = await apiFetch(baseUrl, '/api/auth/dev/login', {
        method: 'POST',
        body: { username: 'admin', password: 'adminpassword', as: 'admin' },
      })

      if (response.status !== 200) {
        throw new Error(`Expected status 200, got ${response.status}`)
      }

      const data = (await response.json()) as { steamId: string }
      if (data.steamId !== DEFAULT_DEV_MOCK_ADMIN_STEAMID) {
        throw new Error(`Expected admin steamId ${DEFAULT_DEV_MOCK_ADMIN_STEAMID}`)
      }

      const adminCookie = await extractAuthCookie(response)
      const adminResponse = await apiFetch(baseUrl, '/api/admin/stats/overview', {
        headers: { Cookie: adminCookie },
      })

      if (adminResponse.status !== 200) {
        throw new Error(`Expected admin overview 200, got ${adminResponse.status}`)
      }
    })
  }

  const browser = await chromium.launch({ headless: true })

  try {
    await runStep('browser login via /dev page (dev user)', async () => {
      const context = await browser.newContext({ ignoreHTTPSErrors: true })
      const page = await context.newPage()

      await page.goto(`${baseUrl}/dev`, { waitUntil: 'networkidle', timeout: 30000 })
      await playwrightExpect(page.getByTestId('dev-auth-card')).toBeVisible({ timeout: 20000 })
      await page.getByTestId('dev-login-user').click()

      await page.waitForFunction(
        () => {
          const saved = localStorage.getItem('steamUser')
          return saved !== null && saved.includes('76561198000000001')
        },
        { timeout: 20000 }
      )

      const savedUser = await page.evaluate(() => localStorage.getItem('steamUser'))
      if (!savedUser?.includes('Dev User')) {
        throw new Error(`Unexpected localStorage user: ${savedUser}`)
      }

      await page.close()
      await context.close()
    })

    if (databaseReady) {
      await runStep('browser login via /dev page (dev admin)', async () => {
        const context = await browser.newContext({ ignoreHTTPSErrors: true })
        const page = await context.newPage()

        await page.goto(`${baseUrl}/dev`, { waitUntil: 'networkidle', timeout: 30000 })
        await page.getByTestId('dev-login-admin').click()

        await page.waitForFunction(
          () => localStorage.getItem('steamUser')?.includes('76561198000000002') ?? false,
          { timeout: 20000 }
        )

        await page.goto(`${baseUrl}/admin`, { waitUntil: 'domcontentloaded', timeout: 30000 })
        await playwrightExpect(page).not.toHaveURL(/\/admin\/error/, { timeout: 20000 })
        await playwrightExpect(page.getByRole('heading', { name: 'Overview' })).toBeVisible({
          timeout: 20000,
        })

        await page.close()
        await context.close()
      })
    }
  } finally {
    await browser.close()
  }
} finally {
  await stopServer()
}

if (failures > 0) {
  console.error(`\nE2E failed: ${failures} assertion(s)`)
  process.exit(1)
}

console.log('\nE2E passed')
