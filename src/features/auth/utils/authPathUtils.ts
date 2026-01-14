/**
 * Checks if the current URL points to a password recovery flow.
 * Supports both standard query parameters and Supabase hash fragments.
 */
export const checkIsRecoveryFlow = (): boolean => {
    return (
        window.location.hash.includes('type=recovery') ||
        window.location.search.includes('type=recovery') ||
        window.location.hash.includes('access_token')
    );
};

/**
 * Clears authentication-related hash fragments from the URL.
 * Useful after successful password reset to prevent re-triggering the flow.
 */
export const clearAuthHash = (): void => {
    if (window.history.replaceState) {
        window.history.replaceState(null, '', window.location.pathname + window.location.search);
    }
};
