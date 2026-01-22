/**
 * Standard Storage Adapter for HICS.
 * Handles persistence preferences (session vs local) based on user choice.
 */

const STORAGE_PREFIX = 'hics_';
const REMEMBER_ME_KEY = 'hrc_rm_pref';

const getSecureKey = (key: string) => {
    // Standard prefixing to avoid collisions with other apps on the same domain
    return `${STORAGE_PREFIX}${key}`;
};

export const authStorage = {
    getItem: (key: string): string | null => {
        try {
            const secureKey = getSecureKey(key);
            const rememberMe = localStorage.getItem(REMEMBER_ME_KEY) === 'true';

            const value = rememberMe
                ? localStorage.getItem(secureKey)
                : sessionStorage.getItem(secureKey);

            return value;
        } catch {
            return null;
        }
    },

    setItem: (key: string, value: string): void => {
        try {
            const secureKey = getSecureKey(key);
            const rememberMe = localStorage.getItem(REMEMBER_ME_KEY) === 'true';

            if (rememberMe) {
                localStorage.setItem(secureKey, value);
                sessionStorage.removeItem(secureKey);
            } else {
                sessionStorage.setItem(secureKey, value);
                localStorage.removeItem(secureKey);
            }
        } catch (error) {
            console.error('[Storage] Write failed:', error);
        }
    },

    removeItem: (key: string): void => {
        try {
            const secureKey = getSecureKey(key);
            localStorage.removeItem(secureKey);
            sessionStorage.removeItem(secureKey);
        } catch (error) {
            console.error('[Storage] Remove failed:', error);
        }
    },

    /**
     * Тотальная очистка всех данных сессии при выходе
     */
    clearAll: (): void => {
        try {
            // Удаляем предпочтение
            localStorage.removeItem(REMEMBER_ME_KEY);

            // Удаляем все ключи с нашим префиксом из обоих хранилищ
            [localStorage, sessionStorage].forEach((storage) => {
                Object.keys(storage).forEach((key) => {
                    if (key.startsWith(STORAGE_PREFIX)) {
                        storage.removeItem(key);
                    }
                });
            });
        } catch (err) {
            console.error('[Storage] Global clear failed:', err);
        }
    },
};

export const setRememberMePreference = (preference: boolean) => {
    localStorage.setItem(REMEMBER_ME_KEY, String(preference));
};
