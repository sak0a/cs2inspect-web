import { describe, it, expect, beforeEach, afterEach } from 'bun:test'
import type { FastifyInstance } from 'fastify'
import { createServer } from '../server.js'
import type { AddressInfo } from 'net'

describe('Authentication Middleware', () => {
  let app: FastifyInstance
  let baseUrl: string
  const validApiKey = 'test-api-key'
  const invalidApiKey = 'invalid-key'

  beforeEach(async () => {
    process.env.API_KEYS = 'test-api-key'
    app = await createServer()
    await app.listen({ port: 0 })
    const address = app.server.address() as AddressInfo
    baseUrl = `http://localhost:${address.port}`
  })

  afterEach(async () => {
    await app.close()
  })

  it('should allow requests with valid API key', async () => {
    const response = await fetch(`${baseUrl}/api/inspect/analyze-url`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': validApiKey,
      },
      body: JSON.stringify({
        inspectUrl: 'steam://rungame/730/76561202255233023/+csgo_econ_action_preview%20test',
      }),
    })

    expect(response.status).not.toBe(401)
  })

  it('should reject requests without API key', async () => {
    const response = await fetch(`${baseUrl}/api/inspect/analyze-url`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        inspectUrl: 'test',
      }),
    })

    expect(response.status).toBe(401)
    const body = await response.json()
    expect(body.error.code).toBe('MISSING_API_KEY')
  })

  it('should reject requests with invalid API key', async () => {
    const response = await fetch(`${baseUrl}/api/inspect/analyze-url`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': invalidApiKey,
      },
      body: JSON.stringify({
        inspectUrl: 'test',
      }),
    })

    expect(response.status).toBe(401)
    const body = await response.json()
    expect(body.error.code).toBe('INVALID_API_KEY')
  })
})
