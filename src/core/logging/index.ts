import { LogManager, LogLevel } from './LogManager';

/**
 * Singleton instance of the application logger.
 * Located in core/logging to establish it as cross-cutting infrastructure.
 */
export const logger = new LogManager(import.meta.env.DEV ? LogLevel.DEBUG : LogLevel.INFO);

// Re-export common types
export { LogLevel };
export type { ILogger } from './LogManager';
