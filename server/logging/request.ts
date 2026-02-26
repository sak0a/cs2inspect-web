import { randomUUID } from 'node:crypto'
import {
  getRequestHeader,
  getRequestURL,
  getResponseStatus,
  setResponseHeader,
  type H3Event,
} from 'h3'
import type { PinoLogger } from './logger'
import { logger } from './logger'
import { loggingConfig, type LoggingConfig } from './config'
import { resolveCanonicalTag } from './tags'

const REQUEST_ID_HEADER = 'x-request-id'

export function getEventPath(event: H3Event): string {
  return event.context.requestPath || getRequestURL(event).pathname
}

export function isHealthPath(path: string): boolean {
  return path.startsWith('/api/health')
    || path.startsWith('/api/status')
    || path === '/health'
    || path.startsWith('/status')
}

export function isApiPath(path: string): boolean {
  return path.startsWith('/api')
}

export function createRequestId(): string {
  return randomUUID()
}

export function getOrCreateRequestId(event: H3Event): string {
  if (event.context.requestId) {
    return event.context.requestId
  }

  const incoming = getRequestHeader(event, REQUEST_ID_HEADER)
  const requestId = incoming && incoming.length > 0 ? incoming : createRequestId()
  event.context.requestId = requestId

  return requestId
}

export function setRequestContext(event: H3Event): void {
  const requestId = getOrCreateRequestId(event)
  const path = getEventPath(event)
  const tag = resolveCanonicalTag({ tag: event.context.logTag || 'Req' })

  event.context.requestPath = path
  event.context.requestStartTime = Date.now()
  event.context.requestLogger = logger.child({
    tag,
    requestId,
    method: event.method,
    path,
  })
}

export function getRequestLogger(event: H3Event): PinoLogger {
  if (event.context.requestLogger) {
    return event.context.requestLogger
  }

  const requestId = getOrCreateRequestId(event)
  const path = getEventPath(event)
  const tag = resolveCanonicalTag({ tag: event.context.logTag || 'Req' })

  event.context.requestLogger = logger.child({
    tag,
    requestId,
    method: event.method,
    path,
  })

  return event.context.requestLogger
}

export function getRequestDuration(event: H3Event): number {
  if (typeof event.context.requestStartTime !== 'number') {
    return 0
  }

  return Math.max(0, Date.now() - event.context.requestStartTime)
}

export function setRequestResponseHeaders(event: H3Event): { requestId: string; durationMs: number } {
  const requestId = getOrCreateRequestId(event)
  const durationMs = getRequestDuration(event)

  setResponseHeader(event, 'X-Request-ID', requestId)
  setResponseHeader(event, 'X-Response-Time', `${durationMs}ms`)

  return { requestId, durationMs }
}

export function shouldLogAccess(path: string, statusCode: number, config: LoggingConfig = loggingConfig): boolean {
  if (statusCode >= 500) {
    return true
  }

  if (isHealthPath(path)) {
    return config.logHealthRequests
  }

  if (isApiPath(path)) {
    return config.logApiRequests
  }

  return false
}

export function getEventStatus(event: H3Event): number {
  return getResponseStatus(event)
}
