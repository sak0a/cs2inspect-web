import pino, { type DestinationStream, type Logger as PinoLogger, type LoggerOptions } from 'pino'
import { createRequire } from 'node:module'
import { loggingConfig, resolveLoggingConfig, type LoggingConfig } from './config'
import { LOG_REDACTION } from './redaction'
import { formatTaggedMessage, resolveCanonicalTag } from './tags'

interface CreateServerLoggerOptions {
  config?: Partial<LoggingConfig>
  destination?: DestinationStream
}

const require = createRequire(import.meta.url)

function getPrettyOptions(): Record<string, unknown> {
  return {
    colorize: process.env.NODE_ENV !== 'production',
    translateTime: 'SYS:standard',
    ignore: 'pid,hostname',
    singleLine: true,
    messageFormat: (log: Record<string, unknown>, messageKey: string): string => {
      const message = typeof log[messageKey] === 'string' ? log[messageKey] : ''
      const tag = resolveCanonicalTag({
        tag: typeof log.tag === 'string' ? log.tag : undefined,
        context: typeof log.context === 'string' ? log.context : undefined,
        event: typeof log.event === 'string' ? log.event : undefined,
      })

      return formatTaggedMessage(tag, message)
    },
  }
}

function createPrettyDestination(): DestinationStream | undefined {
  const prettyOptions = getPrettyOptions()

  try {
    return pino.transport({
      target: 'pino-pretty',
      options: prettyOptions,
    }) as DestinationStream
  } catch {
    try {
      const pinoPretty = require('pino-pretty') as (
        options?: Record<string, unknown>
      ) => DestinationStream
      return pinoPretty(prettyOptions)
    } catch {
      return undefined
    }
  }
}

export function createServerLogger(options: CreateServerLoggerOptions = {}): PinoLogger {
  const resolved = { ...resolveLoggingConfig(), ...options.config }

  const loggerOptions: LoggerOptions = {
    level: resolved.level,
    base: {
      service: 'cs2inspect-web',
      env: process.env.NODE_ENV || 'development',
    },
    timestamp: pino.stdTimeFunctions.isoTime,
    redact: LOG_REDACTION,
    formatters: {
      level: (label) => ({ level: label }),
    },
  }

  const destination =
    options.destination || (resolved.format === 'pretty' ? createPrettyDestination() : undefined)

  return pino(loggerOptions, destination)
}

export const logger = createServerLogger({ config: loggingConfig })

export type { PinoLogger }
