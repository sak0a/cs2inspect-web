const LOG_LEVELS = {
    error: 0,
    warn: 1,
    info: 2,
    debug: 3,
} as const

type LogLevel = keyof typeof LOG_LEVELS

class Logger {
    private level: LogLevel

    constructor(level: LogLevel = 'info') {
        this.level = level
    }

    private shouldLog(level: LogLevel): boolean {
        return LOG_LEVELS[level] <= LOG_LEVELS[this.level]
    }

    private formatMessage(level: string, message: string, ...args: unknown[]): string {
        const timestamp = new Date().toISOString()
        const formattedArgs = args.length > 0 ? ` ${JSON.stringify(args)}` : ''
        return `[${timestamp}] [${level.toUpperCase()}] ${message}${formattedArgs}`
    }

    error(message: string, ...args: unknown[]): void {
        if (this.shouldLog('error')) {
            console.error(this.formatMessage('error', message, ...args))
        }
    }

    warn(message: string, ...args: unknown[]): void {
        if (this.shouldLog('warn')) {
            console.warn(this.formatMessage('warn', message, ...args))
        }
    }

    info(message: string, ...args: unknown[]): void {
        if (this.shouldLog('info')) {
            console.log(this.formatMessage('info', message, ...args))
        }
    }

    debug(message: string, ...args: unknown[]): void {
        if (this.shouldLog('debug')) {
            console.log(this.formatMessage('debug', message, ...args))
        }
    }
}

export const logger = new Logger((process.env.LOG_LEVEL as LogLevel) || 'info')
