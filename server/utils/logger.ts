export class APIRequestLogger {
    static info(message: string): void {
        if (process.env.NODE_ENV !== 'production')
            console.log(`\x1b[103m\x1b[30m INFO \x1b[0m\x1b[97m ${message}`);
    }
    static error(message: string): void {
        if (process.env.NODE_ENV !== 'production')
            console.log(`\x1b[101m\x1b[30m ERROR \x1b[0m\x1b[97m ${message}`);
    }
    static success(message: string): void {
        if (process.env.NODE_ENV !== 'production')
            console.log(`\x1b[92m✔\x1b[97m ${message}`);
    }
    static header(message: string): void {
        if (process.env.NODE_ENV !== 'production')
            console.log(`\n---------- \x1b[104m\x1b[30m ${message} \x1b[0m ----------`);
    }
    static responseTime(startTime: number): void {
        const responseTime = Date.now() - startTime;
        console.log(`Response Time: ${responseTime}ms`);
    }
}
export class Logger {
    static info(message: string): void {
        if (process.env.NODE_ENV !== 'production')
            console.log(`\x1b[103m\x1b[30m INFO \x1b[0m\x1b[97m ${message}`);
    }
    static error(message: string): void {
        if (process.env.NODE_ENV !== 'production')
            console.log(`\x1b[101m\x1b[30m ERROR \x1b[0m\x1b[97m ${message}`);
    }
    static success(message: string): void {
        if (process.env.NODE_ENV !== 'production')
            console.log(`\x1b[92m✔\x1b[97m ${message}`);
    }
    static header(message: string): void {
        if (process.env.NODE_ENV !== 'production')
            console.log(`\n---------- \x1b[104m\x1b[30m ${message} \x1b[0m ----------`);
    }
    static responseTime(startTime: number): void {
        const responseTime = Date.now() - startTime;
        console.log(`Response Time: ${responseTime}ms`);
    }
}