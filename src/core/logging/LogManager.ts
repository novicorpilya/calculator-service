import { supabase } from '@/services/supabase';

export const LogLevel = {
    DEBUG: 0,
    INFO: 1,
    WARN: 2,
    ERROR: 3,
} as const;

export type LogLevel = (typeof LogLevel)[keyof typeof LogLevel];

const LogLevelNames: Record<LogLevel, string> = {
    [LogLevel.DEBUG]: 'DEBUG',
    [LogLevel.INFO]: 'INFO',
    [LogLevel.WARN]: 'WARN',
    [LogLevel.ERROR]: 'ERROR',
};

export interface ILogger {
    debug(message: string, context?: unknown): void;
    info(message: string, context?: unknown): void;
    warn(message: string, context?: unknown): void;
    error(message: string, context?: unknown, error?: unknown): void;
}

export class LogManager implements ILogger {
    private minLevel: LogLevel;

    constructor(minLevel: LogLevel = LogLevel.INFO) {
        this.minLevel = minLevel;
    }

    private async log(level: LogLevel, message: string, context?: unknown, error?: unknown) {
        if (level < this.minLevel) return;

        const timestamp = new Date().toISOString();
        const levelName = LogLevelNames[level];
        const prefix = `[${timestamp}] [${levelName}]`;

        // Local Console Logging (Dev friendly)
        switch (level) {
            case LogLevel.DEBUG:
                console.debug(prefix, message, context);
                break;
            case LogLevel.INFO:
                console.info(prefix, message, context);
                break;
            case LogLevel.WARN:
                console.warn(prefix, message, context);
                break;
            case LogLevel.ERROR:
                console.error(prefix, message, context, error);
                if (error && typeof error === 'object') {
                    console.log(`${prefix} [DETAILS]`, JSON.stringify(error, Object.getOwnPropertyNames(error), 2));
                }
                break;
        }

        // Remote Logging (Production Safety)
        // We only send WARN and ERROR to the database to save quota
        if (level >= LogLevel.WARN) {
            this.sendToRemote(levelName, message, context, error);
        }
    }

    private async sendToRemote(level: string, message: string, context: unknown, error: unknown) {
        try {
            await supabase.from('system_logs').insert({
                level,
                message,
                context: {
                    context,
                    error_details:
                        error instanceof Error
                            ? { name: error.name, message: error.message, stack: error.stack }
                            : error,
                    url: window.location.href,
                    user_agent: navigator.userAgent,
                },
            });
        } catch (e) {
            // Fail-safe: Don't crash app if logger fails
            console.error('Remote logging failed:', e);
        }
    }

    debug(message: string, context?: unknown) {
        this.log(LogLevel.DEBUG, message, context);
    }

    info(message: string, context?: unknown) {
        this.log(LogLevel.INFO, message, context);
    }

    warn(message: string, context?: unknown) {
        this.log(LogLevel.WARN, message, context);
    }

    error(message: string, context?: unknown, error?: unknown) {
        this.log(LogLevel.ERROR, message, context, error);
    }
}
