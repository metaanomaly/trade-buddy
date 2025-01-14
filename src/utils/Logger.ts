import chalk from 'chalk';

export enum LogLevel {
    DEBUG = 0,
    INFO = 1,
    WARN = 2,
    ERROR = 3
}

export class Logger {
    private static instance: Logger;
    private logLevel: LogLevel;

    private constructor() {
        this.logLevel = LogLevel.INFO;
    }

    public static getInstance(): Logger {
        if (!Logger.instance) {
            Logger.instance = new Logger();
        }
        return Logger.instance;
    }

    setLogLevel(level: LogLevel) {
        this.logLevel = level;
    }

    private formatTime(): string {
        return new Date().toISOString().replace('T', ' ').split('.')[0];
    }

    debug(message: string, context?: string) {
        if (this.logLevel <= LogLevel.DEBUG) {
            console.log(
                chalk.gray(`[${this.formatTime()}]`),
                chalk.blue('[DEBUG]'),
                context ? chalk.cyan(`[${context}]`) : '',
                message
            );
        }
    }

    info(message: string, context?: string) {
        if (this.logLevel <= LogLevel.INFO) {
            console.log(
                chalk.gray(`[${this.formatTime()}]`),
                chalk.green('[INFO]'),
                context ? chalk.cyan(`[${context}]`) : '',
                message
            );
        }
    }

    warn(message: string, context?: string) {
        if (this.logLevel <= LogLevel.WARN) {
            console.log(
                chalk.gray(`[${this.formatTime()}]`),
                chalk.yellow('[WARN]'),
                context ? chalk.cyan(`[${context}]`) : '',
                message
            );
        }
    }

    error(message: string, error?: Error, context?: string) {
        if (this.logLevel <= LogLevel.ERROR) {
            console.log(
                chalk.gray(`[${this.formatTime()}]`),
                chalk.red('[ERROR]'),
                context ? chalk.cyan(`[${context}]`) : '',
                message
            );
            if (error) {
                console.log(chalk.red(error.stack || error.message));
            }
        }
    }

    command(username: string, command: string, guild?: string) {
        this.info(
            `${chalk.yellow(username)} executed ${chalk.blue(command)}${guild ? ` in ${chalk.green(guild)}` : ''}`,
            'Command'
        );
    }
}

export const logger = Logger.getInstance(); 