/**
 * Unified logger for the application
 * Provides consistent logging across server utilities and API routes
 */
export const Logger = {
    info(message: string, context?: string): void {
        if (process.env.NODE_ENV !== 'production') {
            const contextStr = context ? `[${context}] ` : '';
            console.log(`\x1b[103m\x1b[30m INFO \x1b[0m\x1b[97m ${contextStr}${message}`);
        }
    },
    error(message: string, context?: string): void {
        if (process.env.NODE_ENV !== 'production') {
            const contextStr = context ? `[${context}] ` : '';
            console.log(`\x1b[101m\x1b[30m ERROR \x1b[0m\x1b[97m ${contextStr}${message}`);
        }
    },
    success(message: string, context?: string): void {
        if (process.env.NODE_ENV !== 'production') {
            const contextStr = context ? `[${context}] ` : '';
            console.log(`\x1b[92m✔\x1b[97m ${contextStr}${message}`);
        }
    },
    header(message: string): void {
        if (process.env.NODE_ENV !== 'production') {
            console.log(`\n---------- \x1b[104m\x1b[30m ${message} \x1b[0m ----------`);
        }
    },
    responseTime(startTime: number): void {
        const responseTime = Date.now() - startTime;
        console.log(`Response Time: ${responseTime}ms`);
    }
} as const;

// Backward compatibility alias (deprecated, will be removed in v2.0)
/** @deprecated Use Logger instead */
export const APIRequestLogger = Logger;