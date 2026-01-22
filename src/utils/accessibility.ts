/**
 * Accessibility Utilities
 * WCAG 2.1 AA Compliance Helpers
 */

/**
 * Announces a message to screen readers via the aria-live region
 * @param message - The message to announce
 * @param priority - 'polite' for non-urgent, 'assertive' for important
 */
export function announceToScreenReader(
    message: string,
    priority: 'polite' | 'assertive' = 'polite'
): void {
    const announcer = document.getElementById('page-announcer');
    if (announcer) {
        announcer.setAttribute('aria-live', priority);
        announcer.textContent = message;

        // Clear after announcement
        setTimeout(() => {
            announcer.textContent = '';
        }, 1000);
    }
}

/**
 * Generates a unique ID for accessibility purposes
 */
export function generateA11yId(prefix: string): string {
    return `${prefix}-${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Checks if user prefers reduced motion
 */
export function prefersReducedMotion(): boolean {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Checks if user prefers high contrast
 */
export function prefersHighContrast(): boolean {
    return window.matchMedia('(prefers-contrast: more)').matches;
}
