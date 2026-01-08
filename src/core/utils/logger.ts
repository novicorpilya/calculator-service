/**
 * Production-Ready Logger
 * 
 * Structured logging with environment-aware output.
 * Sentry integration is disabled by default - install @sentry/react and set VITE_SENTRY_DSN to enable.
 */

/**
 * Structured Logger Class
 */
class Logger {
    private static isDev = import.meta.env.DEV;

    /**
     * Log informational messages
     * In production, these are filtered out to console
     */
    static info(message: string, context?: Record<string, unknown>) {
        if (this.isDev) {
            console.info(
                `%c[INFO] ${message}`,
                'color: #3b82f6; font-weight: 500',
                context || ''
            );
        }
    }

    /**
     * Log warnings - potential issues that aren't fatal
     */
    static warn(message: string, context?: Record<string, unknown>) {
        console.warn(`[WARN] ${message}`, context || '');
    }

    /**
     * Log errors - these are always logged
     */
    static error(message: string, error?: unknown, context?: Record<string, unknown>) {
        console.error(
            `%c[ERROR] ${message}`,
            'color: #ef4444; font-weight: bold',
            error || '',
            context || ''
        );

        // In production, errors should be sent to a monitoring service
        // TODO: Integrate with Sentry when needed:
        // npm install @sentry/react
        // Add VITE_SENTRY_DSN to .env
    }

    /**
     * Set user context for telemetry (placeholder)
     */
    static setUser(_user: { id: string; email?: string; role?: string } | null) {
        // Placeholder for Sentry integration
    }

    /**
     * Add custom context (placeholder)
     */
    static setContext(_name: string, _context: Record<string, unknown>) {
        // Placeholder for Sentry integration
    }

    /**
     * Track a custom event/metric
     */
    static trackEvent(name: string, data?: Record<string, unknown>) {
        if (this.isDev) {
            console.info(`%c[EVENT] ${name}`, 'color: #10b981', data);
        }
    }

    /**
     * Performance tracking wrapper
     */
    static startSpan<T>(name: string, _operation: string, fn: () => Promise<T>): Promise<T> {
        const start = performance.now();

        return fn().finally(() => {
            const duration = performance.now() - start;
            if (this.isDev) {
                console.info(`%c[PERF] ${name}: ${duration.toFixed(2)}ms`, 'color: #8b5cf6');
            }
        });
    }
}

/**
 * Initialize telemetry (no-op without Sentry installed)
 */
export async function initTelemetry() {
    // Sentry integration placeholder
    // To enable: npm install @sentry/react, then uncomment and configure
    console.info('[Telemetry] Running without external telemetry service');
}

export const logger = Logger;
export { Logger };
