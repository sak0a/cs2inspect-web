import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'
import { describe, it, expect } from 'bun:test'
import { setup, $fetch } from '@nuxt/test-utils/e2e'
import {
  DEFAULT_DEV_MOCK_ADMIN_STEAMID,
  DEFAULT_DEV_MOCK_STEAMID,
} from '../../server/utils/devAuth'

const rootDir = resolve(dirname(fileURLToPath(import.meta.url)), '../..')

const testEnv = {
  JWT_TOKEN: 'test-jwt-secret-key-32-characters-min!!',
  JWT_EXPIRY: '1h',
  DEV_AUTH_ENABLED: 'true',
  DEV_AUTH_USERNAME: 'dev',
  DEV_AUTH_PASSWORD: 'devpassword',
  DEV_MOCK_ADMIN_USERNAME: 'admin',
  DEV_MOCK_ADMIN_PASSWORD: 'adminpassword',
  NODE_ENV: 'development',
  DATABASE_HOST: '127.0.0.1',
  DATABASE_PORT: '3306',
  DATABASE_USER: 'test',
  DATABASE_PASSWORD: 'test',
  DATABASE_NAME: 'test',
  STEAM_API_KEY: '00000000000000000000000000000000',
  NUXT_TELEMETRY_DISABLED: 'true',
}

// Required during Nitro build — middleware validates env at bundle time
Object.assign(process.env, testEnv)

await setup({
  rootDir,
  runner: 'bun',
  server: true,
  build: true,
  setupTimeout: 300000,
  teardownTimeout: 60000,
  env: testEnv,
})

describe('dev auth e2e', () => {
  it('logs in as dev user and sets auth session', async () => {
    const response = await $fetch.raw('/api/auth/dev/login', {
      method: 'POST',
      body: {
        username: 'dev',
        password: 'devpassword',
        as: 'user',
      },
    })

    expect(response.status).toBe(200)

    const data = response._data as {
      steamId: string
      personaName: string
      authenticated: boolean
      role: string
    }

    expect(data.authenticated).toBe(true)
    expect(data.role).toBe('user')
    expect(data.steamId).toBe(DEFAULT_DEV_MOCK_STEAMID)
    expect(data.personaName).toBe('Dev User')

    const setCookie = response.headers.get('set-cookie') ?? ''
    expect(setCookie).toContain('auth_token=')
  })

  it('rejects invalid dev credentials', async () => {
    await expect(
      $fetch('/api/auth/dev/login', {
        method: 'POST',
        body: {
          username: 'dev',
          password: 'wrong-password',
          as: 'user',
        },
      })
    ).rejects.toMatchObject({ statusCode: 401 })
  })

  it('authenticates protected routes with the dev session cookie', async () => {
    await $fetch('/api/auth/dev/login', {
      method: 'POST',
      body: {
        username: 'dev',
        password: 'devpassword',
        as: 'user',
      },
    })

    const validation = await $fetch<{ authenticated: boolean; steamId: string }>(
      `/api/auth/validate?steamId=${DEFAULT_DEV_MOCK_STEAMID}`
    )

    expect(validation.authenticated).toBe(true)
    expect(validation.steamId).toBe(DEFAULT_DEV_MOCK_STEAMID)
  })

  it('returns mock Steam profile data for reserved dev SteamIDs', async () => {
    const data = await $fetch<{
      response: { players: Array<{ steamid: string; personaname: string }> }
    }>(`/api/steam/user?steamid=${DEFAULT_DEV_MOCK_STEAMID}`)

    expect(data.response.players[0]?.steamid).toBe(DEFAULT_DEV_MOCK_STEAMID)
    expect(data.response.players[0]?.personaname).toBe('Dev User')
  })
})

const e2eWithDatabase = process.env.E2E_WITH_DB === 'true'

describe.skipIf(!e2eWithDatabase)('dev auth e2e (database)', () => {
  it('logs in as dev admin when database is available', async () => {
    const response = await $fetch.raw('/api/auth/dev/login', {
      method: 'POST',
      body: {
        username: 'admin',
        password: 'adminpassword',
        as: 'admin',
      },
    })

    expect(response.status).toBe(200)

    const data = response._data as { steamId: string; role: string }
    expect(data.role).toBe('admin')
    expect(data.steamId).toBe(DEFAULT_DEV_MOCK_ADMIN_STEAMID)

    await $fetch('/api/auth/dev/login', {
      method: 'POST',
      body: {
        username: 'admin',
        password: 'adminpassword',
        as: 'admin',
      },
    })

    // Admin middleware returns 403 (not 401) when authenticated but not admin
    await expect($fetch('/api/admin/stats/overview')).resolves.toBeDefined()
  })
})
