import type { LoggerOptions } from 'pino'

type RedactOptions = NonNullable<LoggerOptions['redact']>

export const SENSITIVE_REDACTION_PATHS = [
  'authorization',
  'cookie',
  'set-cookie',
  'apiKey',
  'x-api-key',
  'token',
  'jwt',
  'password',
  '*.authorization',
  '*.cookie',
  '*.set-cookie',
  '*.apiKey',
  '*.x-api-key',
  '*.token',
  '*.jwt',
  '*.password',
  '*.headers.authorization',
  '*.headers.cookie',
  '*.headers.x-api-key',
  '*.headers.set-cookie',
  'req.headers.authorization',
  'req.headers.cookie',
  'req.headers.x-api-key',
  'req.headers.set-cookie',
  'request.headers.authorization',
  'request.headers.cookie',
  'request.headers.x-api-key',
  'request.headers.set-cookie',
] as const

export const LOG_REDACTION: RedactOptions = {
  paths: [...SENSITIVE_REDACTION_PATHS],
  censor: '[REDACTED]',
  remove: false,
}
