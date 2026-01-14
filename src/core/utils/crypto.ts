/**
 * Криптографически безопасные утилиты для генерации токенов и идентификаторов.
 *
 * ⚠️ ВАЖНО: Не использовать Math.random() для security-критичных операций!
 * Этот модуль предоставляет безопасные альтернативы.
 */

/**
 * Генерация криптографически безопасного UUID v4.
 * Используется для: токенов приглашений, id сессий, уникальных идентификаторов.
 *
 * @returns UUID в формате xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx
 */
export const generateSecureToken = (): string => {
    return crypto.randomUUID();
};

/**
 * Генерация короткого токена на основе криптографически безопасного источника.
 * Используется для: коротких invite-ссылок, verification кодов.
 *
 * @param length - Длина результирующего токена (по умолчанию 24 символа)
 * @returns Строка из случайных символов [a-z0-9]
 *
 * @example
 * generateShortToken() // "k3m8n2p5q7r1s4t6u9v0w2x4"
 * generateShortToken(8) // "a1b2c3d4"
 */
export const generateShortToken = (length: number = 24): string => {
    const alphabet = 'abcdefghijklmnopqrstuvwxyz0123456789';
    const array = new Uint8Array(length);
    crypto.getRandomValues(array);

    return Array.from(array)
        .map((byte) => alphabet[byte % alphabet.length])
        .join('');
};

/**
 * Генерация числового кода (для SMS/Email верификации).
 *
 * @param digits - Количество цифр (по умолчанию 6)
 * @returns Строка из случайных цифр
 *
 * @example
 * generateNumericCode() // "847291"
 * generateNumericCode(4) // "3847"
 */
export const generateNumericCode = (digits: number = 6): string => {
    const array = new Uint8Array(digits);
    crypto.getRandomValues(array);

    return Array.from(array)
        .map((byte) => byte % 10)
        .join('');
};
