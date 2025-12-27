

/**
 * Custom storage for Supabase Auth that switches between localStorage and sessionStorage
 * based on the user's "Remember Me" preference.
 */
const REMEMBER_ME_KEY = 'remember_me_preference'

export const authStorage = {
    getItem: (key: string): string | null => {
        try {
            // Check if user wants to be remembered
            const isRemembered = localStorage.getItem(REMEMBER_ME_KEY) === 'true'

            if (isRemembered) {
                return localStorage.getItem(key)
            }
            return sessionStorage.getItem(key)
        } catch {
            return null
        }
    },

    setItem: (key: string, value: string): void => {
        try {
            const isRemembered = localStorage.getItem(REMEMBER_ME_KEY) === 'true'

            if (isRemembered) {
                localStorage.setItem(key, value)
                // Clean up sessionStorage to avoid dual sessions
                sessionStorage.removeItem(key)
            } else {
                sessionStorage.setItem(key, value)
                // Clean up localStorage if it was there (e.g. user unchecked box this time)
                localStorage.removeItem(key)
            }
        } catch (error) {
            console.error('Error setting auth storage:', error)
        }
    },

    removeItem: (key: string): void => {
        try {
            localStorage.removeItem(key)
            sessionStorage.removeItem(key)
        } catch (error) {
            console.error('Error removing auth storage:', error)
        }
    }
}
