import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { resolve } from 'node:path'

const { raw } = vi.hoisted(() => ({ raw: vi.fn() }))
vi.mock('ofetch', () => ({ $fetch: { raw } }))
let checkEnvironment: typeof import('../../../../server/utils/health/probes').checkEnvironment
let checkImageProxy: typeof import('../../../../server/utils/health/probes').checkImageProxy
beforeAll(async () => {
  vi.doMock(resolve('server/database/client.ts'), () => ({
    db: { execute: vi.fn(async () => []) },
    pool: {},
  }))
  vi.doMock(resolve('server/plugins/init.ts'), () => ({ getCS2Client: vi.fn() }))
  vi.doMock(resolve('server/utils/api/steamServiceClient.ts'), () => ({ steamServiceClient: {} }))
  ;({ checkEnvironment, checkImageProxy } = await import('../../../../server/utils/health/probes'))
})

const required = [
  'DATABASE_HOST',
  'DATABASE_USER',
  'DATABASE_PASSWORD',
  'DATABASE_NAME',
  'JWT_TOKEN',
  'STEAM_API_KEY',
]

beforeEach(() => {
  vi.resetAllMocks()
  for (const key of [
    ...required,
    'STEAM_USERNAME',
    'STEAM_PASSWORD',
    'STEAM_SERVICE_URL',
    'STEAM_SERVICE_API_KEY',
    'PROXY_HEALTH_BASE_URL',
    'NITRO_HOST',
    'NITRO_PORT',
    'HOST',
    'PORT',
    'JWT_EXPIRY',
    'DATABASE_CONNECTION_LIMIT',
    'LOG_API_REQUESTS',
  ]) {
    vi.stubEnv(key, '')
  }
  vi.stubEnv('NODE_ENV', 'production')
  for (const key of required) vi.stubEnv(key, 'test-value')
  raw.mockResolvedValue({ status: 200, headers: new Headers({ 'content-type': 'image/svg+xml' }) })
})
afterEach(() => {
  vi.unstubAllEnvs()
  vi.unstubAllGlobals()
})

describe('environment readiness', () => {
  it('accepts omitted optional settings and local Steam credentials', async () => {
    const result = await checkEnvironment()
    expect(result.status).toBe('ok')
    expect(result.metadata?.missing_required).toEqual([])
    expect(result.metadata?.missing_vars).toContain('STEAM_PASSWORD')
  })
  it('accepts the external Steam service without duplicate local credentials', async () => {
    vi.stubEnv('STEAM_SERVICE_URL', 'http://steam-service:3211')
    vi.stubEnv('STEAM_SERVICE_API_KEY', 'test-key')
    expect((await checkEnvironment()).status).toBe('ok')
  })
  it.each(required)('still fails when %s is missing', async (key) => {
    vi.stubEnv(key, '')
    const result = await checkEnvironment()
    expect(result.status).toBe('fail')
    expect(result.metadata?.missing_required).toContain(key)
  })
  it.each(['STEAM_SERVICE_URL', 'STEAM_SERVICE_API_KEY'])(
    'rejects an incomplete external service configuration: %s only',
    async (key) => {
      vi.stubEnv(key, 'configured')
      expect((await checkEnvironment()).status).toBe('fail')
    }
  )
})

describe('image proxy health', () => {
  it('uses internal HTTP and loopback in production behind TLS termination', async () => {
    vi.stubEnv('HOST', '0.0.0.0')
    vi.stubEnv('PORT', '3210')
    expect((await checkImageProxy()).status).toBe('ok')
    expect(raw).toHaveBeenCalledWith(
      'http://127.0.0.1:3210/api/proxy/image',
      expect.objectContaining({ timeout: 5000, retry: 0 })
    )
  })
  it('uses Nitro listener overrides and IPv6 loopback', async () => {
    vi.stubEnv('NITRO_HOST', '::')
    vi.stubEnv('NITRO_PORT', '4000')
    vi.stubEnv('PORT', '3210')
    await checkImageProxy()
    expect(raw.mock.calls[0]?.[0]).toBe('http://[::1]:4000/api/proxy/image')
  })
  it('preserves an explicit HTTPS health endpoint override', async () => {
    vi.stubEnv('PROXY_HEALTH_BASE_URL', 'https://example.com/')
    await checkImageProxy()
    expect(raw.mock.calls[0]?.[0]).toBe('https://example.com/api/proxy/image')
  })
  it('does not report success for non-image responses', async () => {
    raw.mockResolvedValue({ status: 200, headers: new Headers({ 'content-type': 'text/html' }) })
    expect((await checkImageProxy()).status).toBe('fail')
  })
  it('reports a broken local proxy as degraded even if upstream is reachable', async () => {
    raw.mockRejectedValue(new Error('local proxy unavailable'))
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response('<svg/>', { headers: { 'content-type': 'image/svg+xml' } }))
    )
    expect((await checkImageProxy()).status).toBe('degraded')
  })
  it('reports failure when both the proxy and upstream are unavailable', async () => {
    raw.mockRejectedValue(new Error('local proxy unavailable'))
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => {
        throw new Error('upstream unavailable')
      })
    )
    expect((await checkImageProxy()).status).toBe('fail')
  })
})
