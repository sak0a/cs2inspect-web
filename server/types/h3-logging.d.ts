import type { Logger as PinoLogger } from 'pino'

declare module 'h3' {
  interface H3EventContext {
    requestId?: string
    requestPath?: string
    requestStartTime?: number
    logTag?: string
    requestLogger?: PinoLogger
    requestErrorLogged?: boolean
  }
}

export {}
