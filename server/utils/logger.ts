export const APIRequestLogger = {
    info(message: string): void {
        if (process.env.NODE_ENV !== 'production')
            console.log(`\x1b[103m\x1b[30m INFO \x1b[0m\x1b[97m ${message}`);
    },
    error(message: string): void {
        if (process.env.NODE_ENV !== 'production')
            console.log(`\x1b[101m\x1b[30m ERROR \x1b[0m\x1b[97m ${message}`);
    },
    success(message: string): void {
        if (process.env.NODE_ENV !== 'production')
            console.log(`\x1b[92m✔\x1b[97m ${message}`);
    },
    header(message: string): void {
        if (process.env.NODE_ENV !== 'production')
            console.log(`\n---------- \x1b[104m\x1b[30m ${message} \x1b[0m ----------`);
    },
    responseTime(startTime: number): void {
        const responseTime = Date.now() - startTime;
        console.log(`Response Time: ${responseTime}ms`);
    }
} as const;

export const Logger = {
    info(message: string): void {
        if (process.env.NODE_ENV !== 'production')
            console.log(`\x1b[103m\x1b[30m INFO \x1b[0m\x1b[97m ${message}`);
    },
    error(message: string): void {
        if (process.env.NODE_ENV !== 'production')
            console.log(`\x1b[101m\x1b[30m ERROR \x1b[0m\x1b[97m ${message}`);
    },
    success(message: string): void {
        if (process.env.NODE_ENV !== 'production')
            console.log(`\x1b[92m✔\x1b[97m ${message}`);
    },
    header(message: string): void {
        if (process.env.NODE_ENV !== 'production')
            console.log(`\n---------- \x1b[104m\x1b[30m ${message} \x1b[0m ----------`);
    },
    responseTime(startTime: number): void {
        const responseTime = Date.now() - startTime;
        console.log(`Response Time: ${responseTime}ms`);
    }
} as const;