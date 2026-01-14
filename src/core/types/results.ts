/**
 * Standardized result contract for asynchronous operations.
 * Helps in avoiding try/catch blocks in UI components.
 */
export interface ActionResult<T = void, E = string> {
    success: boolean;
    data?: T;
    error?: {
        message: E;
        code?: string;
        details?: unknown;
    };
}

/**
 * Specifically for operations that don't return data on success.
 */
export type VoidResult<E = string> = ActionResult<void, E>;
