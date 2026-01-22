/**
 * Utility for combining Tailwind CSS classes.
 * Simple implementation to avoid extra dependencies.
 */
export function cn(...inputs: (string | boolean | undefined | null)[]) {
    return inputs.filter(Boolean).join(' ');
}
