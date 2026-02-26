import { logger } from '~/server/logging/logger'
import { resolveCanonicalTag } from '~/server/logging/tags'

/**
 * Backward-compatible logger wrapper.
 *
 * @deprecated Prefer `~/server/logging/logger` and request-scoped loggers.
 */
export const Logger = {
  info(message: string, context?: string): void {
    const tag = resolveCanonicalTag({ context })
    logger.info({ tag, context }, message)
  },

  warn(message: string, context?: string): void {
    const tag = resolveCanonicalTag({ context })
    logger.warn({ tag, context }, message)
  },

  error(message: string, context?: string): void {
    const tag = resolveCanonicalTag({ context })
    logger.error({ tag, context }, message)
  },

  debug(message: string, context?: string): void {
    const tag = resolveCanonicalTag({ context })
    logger.debug({ tag, context }, message)
  },

  success(message: string, context?: string): void {
    const tag = resolveCanonicalTag({ context, event: 'success' })
    logger.debug({ tag, context, event: 'success' }, message)
  },

  header(message: string): void {
    logger.debug({ tag: 'Req', event: 'header', section: message }, message)
  },

  responseTime(startTime: number): void {
    logger.debug({ tag: 'Req', durationMs: Date.now() - startTime }, 'Response time')
  },
} as const

// Backward compatibility alias (deprecated, will be removed in v2.0)
/** @deprecated Use Logger instead */
export const APIRequestLogger = Logger
