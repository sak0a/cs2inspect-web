import { describe, expect, it } from 'bun:test'
import { createApp, createError, eventHandler, toNodeListener } from 'h3'
import { fetchNodeRequestHandler, type NodeRequestHandler } from 'node-mock-http'
import { withErrorHandling } from '~/server/utils/api/responseHelpers'
import {
  getRequestLogger,
  setRequestContext,
  setRequestResponseHeaders,
  shouldLogAccess,
} from '../request'

describe('request logging helpers', () => {
  it('respects access logging toggles and always logs server errors', () => {
    expect(
      shouldLogAccess('/api/items/weapons', 200, {
        level: 'info',
        format: 'json',
        logApiRequests: false,
        logHealthRequests: false,
      })
    ).toBe(false)

    expect(
      shouldLogAccess('/api/items/weapons', 200, {
        level: 'info',
        format: 'json',
        logApiRequests: true,
        logHealthRequests: false,
      })
    ).toBe(true)

    expect(
      shouldLogAccess('/api/health/live', 200, {
        level: 'info',
        format: 'json',
        logApiRequests: false,
        logHealthRequests: false,
      })
    ).toBe(false)

    expect(
      shouldLogAccess('/api/health/live', 200, {
        level: 'info',
        format: 'json',
        logApiRequests: false,
        logHealthRequests: true,
      })
    ).toBe(true)

    expect(
      shouldLogAccess('/api/items/weapons', 500, {
        level: 'info',
        format: 'json',
        logApiRequests: false,
        logHealthRequests: false,
      })
    ).toBe(true)
  })

  it('sets request correlation headers on success and error responses', async () => {
    const app = createApp({
      onRequest: setRequestContext,
      onBeforeResponse: (event) => {
        setRequestResponseHeaders(event)
      },
    })

    app.use(
      '/api/ok',
      eventHandler(() => ({ ok: true }))
    )

    app.use(
      '/api/fail',
      eventHandler(() => {
        throw createError({ statusCode: 500, message: 'boom' })
      })
    )

    const handler = toNodeListener(app) as NodeRequestHandler

    const okResponse = await fetchNodeRequestHandler(handler, '/api/ok')
    const failResponse = await fetchNodeRequestHandler(handler, '/api/fail')

    expect(okResponse.headers.get('x-request-id')).toBeTruthy()
    expect(okResponse.headers.get('x-response-time')).toBeTruthy()

    expect(failResponse.headers.get('x-request-id')).toBeTruthy()
    expect(failResponse.headers.get('x-response-time')).toBeTruthy()
  })

  it('creates request logger with Req tag by default', async () => {
    let loggerBindings: Record<string, unknown> | null = null
    const app = createApp({
      onRequest: (event) => {
        setRequestContext(event)
        const requestLogger = getRequestLogger(event) as unknown as {
          bindings?: () => Record<string, unknown>
        }
        loggerBindings = requestLogger.bindings ? requestLogger.bindings() : null
      },
    })

    app.use(
      '/api/tag-check',
      eventHandler(() => ({ ok: true }))
    )

    const handler = toNodeListener(app) as NodeRequestHandler
    await fetchNodeRequestHandler(handler, '/api/tag-check')

    expect(loggerBindings?.tag).toBe('Req')
    expect(typeof loggerBindings?.requestId).toBe('string')
  })

  it('includes requestId in standardized error response meta', async () => {
    const app = createApp({
      onRequest: setRequestContext,
      onBeforeResponse: (event) => {
        setRequestResponseHeaders(event)
      },
    })

    app.use(
      '/api/handled-error',
      eventHandler(
        withErrorHandling(async () => {
          throw new Error('intentional failure')
        }, 'TEST_ERROR')
      )
    )

    const handler = toNodeListener(app) as NodeRequestHandler
    const response = await fetchNodeRequestHandler(handler, '/api/handled-error')
    const body = (await response.json()) as {
      data?: {
        meta?: {
          requestId?: string
        }
      }
    }

    expect(response.status).toBe(500)
    expect(typeof body.data?.meta?.requestId).toBe('string')
  })
})
