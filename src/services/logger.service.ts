/**
 * Logger Service
 * Centralized logging with structured output.
 * In production, this can be extended to send logs to external services.
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogEntry {
    level: LogLevel;
    message: string;
    context?: string;
    data?: unknown;
    timestamp: string;
}

interface LoggerConfig {
    minLevel: LogLevel;
    enableConsole: boolean;
    enableRemote: boolean;
}

const LOG_LEVELS: Record<LogLevel, number> = {
    debug: 0,
    info: 1,
    warn: 2,
    error: 3,
};

const DEFAULT_CONFIG: LoggerConfig = {
    minLevel: import.meta.env.PROD ? 'info' : 'debug',
    enableConsole: true,
    enableRemote: import.meta.env.PROD,
};

class Logger {
    private config: LoggerConfig;

    constructor(config: Partial<LoggerConfig> = {}) {
        this.config = { ...DEFAULT_CONFIG, ...config };
    }

    private shouldLog(level: LogLevel): boolean {
        return LOG_LEVELS[level] >= LOG_LEVELS[this.config.minLevel];
    }

    private formatEntry(entry: LogEntry): string {
        const parts = [
            `[${entry.timestamp}]`,
            `[${entry.level.toUpperCase()}]`,
            entry.context ? `[${entry.context}]` : '',
            entry.message,
        ].filter(Boolean);

        return parts.join(' ');
    }

    private log(level: LogLevel, message: string, context?: string, data?: unknown): void {
        if (!this.shouldLog(level)) return;

        const entry: LogEntry = {
            level,
            message,
            context,
            data,
            timestamp: new Date().toISOString(),
        };

        if (this.config.enableConsole) {
            const formatted = this.formatEntry(entry);
            const consoleMethod = level === 'error' ? console.error
                : level === 'warn' ? console.warn
                    : level === 'info' ? console.info
                        : console.log;

            if (data !== undefined) {
                consoleMethod(formatted, data);
            } else {
                consoleMethod(formatted);
            }
        }

        // In production, send to remote logging service
        if (this.config.enableRemote && level === 'error') {
            this.sendToRemote(entry);
        }
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    private async sendToRemote(_entry: LogEntry): Promise<void> {
        // TODO: Implement remote logging (e.g., Sentry, LogRocket)
        // This is a placeholder for production logging infrastructure
        try {
            // Example: await fetch('/api/logs', { method: 'POST', body: JSON.stringify(_entry) });
        } catch {
            // Fail silently - don't break app for logging failures
        }
    }

    debug(message: string, context?: string, data?: unknown): void {
        this.log('debug', message, context, data);
    }

    info(message: string, context?: string, data?: unknown): void {
        this.log('info', message, context, data);
    }

    warn(message: string, context?: string, data?: unknown): void {
        this.log('warn', message, context, data);
    }

    error(message: string, context?: string, data?: unknown): void {
        this.log('error', message, context, data);
    }

    /**
     * Create a child logger with preset context.
     */
    child(context: string): ContextLogger {
        return new ContextLogger(this, context);
    }
}

class ContextLogger {
    private parent: Logger;
    private context: string;

    constructor(parent: Logger, context: string) {
        this.parent = parent;
        this.context = context;
    }

    debug(message: string, data?: unknown): void {
        this.parent.debug(message, this.context, data);
    }

    info(message: string, data?: unknown): void {
        this.parent.info(message, this.context, data);
    }

    warn(message: string, data?: unknown): void {
        this.parent.warn(message, this.context, data);
    }

    error(message: string, data?: unknown): void {
        this.parent.error(message, this.context, data);
    }
}

// Export singleton instance
export const logger = new Logger();

// Export for typed child loggers
export type { ContextLogger };
