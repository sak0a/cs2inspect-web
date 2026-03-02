export const LOG_LEVELS = ['fatal', 'error', 'warn', 'info', 'debug', 'trace'] as const
export type LogLevel = (typeof LOG_LEVELS)[number]

export const LOG_FORMATS = ['pretty', 'json'] as const
export type LogFormat = (typeof LOG_FORMATS)[number]

export interface LoggingConfig {
  level: LogLevel
  format: LogFormat
  logApiRequests: boolean
  logHealthRequests: boolean
}

function isLogLevel(value: string): value is LogLevel {
  return (LOG_LEVELS as readonly string[]).includes(value)
}

function isLogFormat(value: string): value is LogFormat {
  return (LOG_FORMATS as readonly string[]).includes(value)
}

export function resolveLoggingConfig(env: NodeJS.ProcessEnv = process.env): LoggingConfig {
  const isProduction = env.NODE_ENV === 'production'

  const rawLevel = (env.LOG_LEVEL || 'info').toLowerCase()
  const rawFormat = (env.LOG_FORMAT || (isProduction ? 'json' : 'pretty')).toLowerCase()

  return {
    level: isLogLevel(rawLevel) ? rawLevel : 'info',
    format: isLogFormat(rawFormat) ? rawFormat : isProduction ? 'json' : 'pretty',
    logApiRequests: env.LOG_API_REQUESTS === 'true',
    logHealthRequests: env.LOG_HEALTH_REQUESTS === 'true',
  }
}

export const loggingConfig = resolveLoggingConfig()

export function isDebugLoggingEnabled(config: LoggingConfig = loggingConfig): boolean {
  return config.level === 'debug' || config.level === 'trace'
}
