import type { ActionResult } from '../types/results';

/**
 * Standardized error wrapper for safe service responses.
 * Converts any unknown error into a structured ActionResult error.
 */
export const wrapError = (err: unknown): { message: string } => {
    if (err instanceof Error) return { message: err.message };
    if (typeof err === 'object' && err !== null && 'message' in err) {
        return { message: String((err as { message: unknown }).message) };
    }
    return { message: String(err) };
};

/**
 * Utility to create a failed ActionResult from any error.
 */
export const toErrorResult = (err: unknown): ActionResult<void> => {
    return {
        success: false,
        error: wrapError(err),
    };
};
