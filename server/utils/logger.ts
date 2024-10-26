export class Logger {
    static info(message: string): void {
        console.log(`\x1b[103m\x1b[30m INFO \x1b[0m\x1b[97m ${message}`);
    }
    static error(message: string): void {
        console.log(`\x1b[101m\x1b[30m ERROR \x1b[0m\x1b[97m ${message}`);
    }
    static success(message: string): void {
        console.log(`\x1b[92m✔\x1b[97m ${message}`);
    }
}