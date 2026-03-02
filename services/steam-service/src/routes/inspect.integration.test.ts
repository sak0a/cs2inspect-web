import { describe, it, expect, beforeAll, afterAll } from 'bun:test'
import type { FastifyInstance } from 'fastify'
import { createServer } from '../server.js'
import { steamClientService } from '../services/steamClient.js'
import type { AddressInfo } from 'net'

/**
 * Integration tests that require actual Steam account
 * These tests are skipped by default unless STEAM_TEST_ENABLED=true
 *
 * To run these tests:
 * 1. Set STEAM_USERNAME, STEAM_PASSWORD, STEAM_API_KEY in .env
 * 2. Set STEAM_TEST_ENABLED=true
 * 3. Run: bun test src/routes/inspect.integration.test.ts
 */
const STEAM_TEST_ENABLED = process.env.STEAM_TEST_ENABLED === 'true'
const hasSteamCredentials = !!(process.env.STEAM_USERNAME && process.env.STEAM_PASSWORD)

describe.skipIf(!STEAM_TEST_ENABLED || !hasSteamCredentials)(
  'Inspect Routes Integration (Requires Steam Account)',
  () => {
    let app: FastifyInstance
    let baseUrl: string
    const testApiKey = process.env.API_KEYS?.split(',')[0] || 'test-api-key'

    beforeAll(async () => {
      app = await createServer()
      await app.listen({ port: 0 })
      const address = app.server.address() as AddressInfo
      baseUrl = `http://localhost:${address.port}`

      // Wait for Steam client to initialize
      try {
        await steamClientService.initialize()
        // Wait a bit for connection to stabilize
        await new Promise((resolve) => setTimeout(resolve, 2000))
      } catch (error) {
        console.warn('Steam client initialization failed, some tests may fail:', error)
      }
    })

    afterAll(async () => {
      await app.close()
    })

    describe('POST /api/inspect/inspect-item (with Steam client)', () => {
      it('should inspect unmasked URL with Steam client', async () => {
        const unmaskedUrl =
          process.env.TEST_UNMASKED_URL ||
          'steam://rungame/730/76561202255233023/+csgo_econ_action_preview%20S123456A789D123'

        const response = await fetch(`${baseUrl}/api/inspect/inspect-item`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-API-Key': testApiKey,
          },
          body: JSON.stringify({
            inspectUrl: unmaskedUrl,
            itemType: 'weapon',
          }),
        })

        if (response.status === 503) {
          console.warn('Steam client not available, skipping test')
          return
        }

        expect(response.status).toBe(200)
        const body = await response.json()
        expect(body.success).toBe(true)
        expect(body.data).toBeDefined()
      }, 30000)

      it('should handle masked URLs without Steam client', async () => {
        const maskedUrl =
          'steam://rungame/730/76561202255233023/+csgo_econ_action_preview%20M4A1-S%20%7C%20Hyper%20Beast'

        const response = await fetch(`${baseUrl}/api/inspect/inspect-item`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-API-Key': testApiKey,
          },
          body: JSON.stringify({
            inspectUrl: maskedUrl,
          }),
        })

        expect(response.status).toBe(200)
        const body = await response.json()
        expect(body.success).toBe(true)
      })
    })

    describe('Steam Client Status', () => {
      it('should report Steam client status', async () => {
        const status = steamClientService.getStatus()
        expect(status).toHaveProperty('available')
        expect(status).toHaveProperty('status')

        if (status.available) {
          expect(status.status).not.toBe('not_initialized')
        }
      })
    })
  }
)
