import { defineNitroPlugin } from 'nitropack/runtime'
import { getResponseStatus, type H3Event } from 'h3'
import { loggingConfig } from '~/server/logging/config'
import { logger } from '~/server/logging/logger'
import {
  getEventPath,
  getRequestDuration,
  getRequestLogger,
  setRequestContext,
  setRequestResponseHeaders,
  shouldLogAccess,
} from '~/server/logging/request'

function logAccess(event: H3Event, statusCode: number): void {
  const requestLogger = getRequestLogger(event)
  const durationMs = getRequestDuration(event)

  const payload = {
    statusCode,
    durationMs,
    requestId: event.context.requestId,
  }

  if (statusCode >= 500) {
    requestLogger.error(payload, 'Request done server_error')
    return
  }

  if (statusCode >= 400) {
    requestLogger.warn(payload, 'Request done client_error')
    return
  }

  requestLogger.info(payload, 'Request done')
}

export default defineNitroPlugin((nitroApp) => {
  nitroApp.hooks.hook('request', (event) => {
    setRequestContext(event)
  })

  nitroApp.hooks.hook('beforeResponse', (event) => {
    setRequestResponseHeaders(event)
  })

  nitroApp.hooks.hook('afterResponse', (event) => {
    const path = getEventPath(event)
    const statusCode = getResponseStatus(event)

    if (!shouldLogAccess(path, statusCode, loggingConfig)) {
      return
    }

    logAccess(event, statusCode)
  })

  nitroApp.hooks.hook('error', (error, context) => {
    const event = context.event

    if (event) {
      event.context.requestErrorLogged = true
      const requestLogger = getRequestLogger(event)
      const statusCode = getResponseStatus(event)

      requestLogger.error(
        {
          err: error,
          statusCode,
          tags: context.tags,
          requestId: event.context.requestId,
          durationMs: getRequestDuration(event),
        },
        'Unhandled error'
      )

      return
    }

    logger.error({ tag: 'App', err: error, context }, 'Unhandled app error')
  })
})
