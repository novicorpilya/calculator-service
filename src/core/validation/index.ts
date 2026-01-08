/**
 * Централизованный модуль валидации.
 * Все проверки входных данных должны использовать этот модуль.
 */

import { z } from 'zod';
import { ApplicationError } from '@/core/errors/AppErrors';

// ============================================
// UUID Validation
// ============================================

/**
 * Zod-схема для валидации UUID v4.
 */
export const UUIDSchema = z.string().uuid('Некорректный формат UUID');

/**
 * Проверяет, является ли значение корректным UUID.
 * Не выбрасывает исключение — возвращает boolean.
 * 
 * @param value - Значение для проверки
 * @returns true если значение является валидным UUID
 * 
 * @example
 * if (isValidUUID(userId)) {
 *   // Безопасно использовать userId
 * }
 */
export function isValidUUID(value: unknown): value is string {
    return UUIDSchema.safeParse(value).success;
}

/**
 * Валидирует значение как UUID и возвращает его.
 * Выбрасывает ApplicationError если значение невалидно.
 * 
 * @param value - Значение для валидации
 * @param fieldName - Название поля (для сообщения об ошибке)
 * @returns Валидированный UUID
 * @throws ApplicationError с кодом INVALID_UUID
 * 
 * @example
 * const userId = validateUUID(input.userId, 'userId');
 */
export function validateUUID(value: unknown, fieldName = 'id'): string {
    const result = UUIDSchema.safeParse(value);
    if (!result.success) {
        throw new ApplicationError(
            'INVALID_UUID',
            `Некорректный формат ${fieldName}: ${String(value)}`
        );
    }
    return result.data;
}

// ============================================
// Email Validation
// ============================================

/**
 * Zod-схема для валидации email.
 */
export const EmailSchema = z.string().email('Некорректный формат email');

/**
 * Проверяет, является ли значение корректным email.
 */
export function isValidEmail(value: unknown): value is string {
    return EmailSchema.safeParse(value).success;
}

/**
 * Валидирует email и возвращает его в lowercase.
 */
export function validateEmail(value: unknown): string {
    const result = EmailSchema.safeParse(value);
    if (!result.success) {
        throw new ApplicationError('INVALID_EMAIL', 'Некорректный формат email');
    }
    return result.data.toLowerCase();
}

// ============================================
// Common Schemas
// ============================================

/**
 * Схема для непустой строки.
 */
export const NonEmptyStringSchema = z.string().min(1, 'Поле не может быть пустым');

/**
 * Схема для положительного числа.
 */
export const PositiveNumberSchema = z.number().positive('Значение должно быть положительным');

/**
 * Схема для неотрицательного числа.
 */
export const NonNegativeNumberSchema = z.number().nonnegative('Значение не может быть отрицательным');

// ============================================
// Validation Helpers
// ============================================

/**
 * Безопасная валидация с возвратом результата.
 * Не выбрасывает исключение.
 */
export function safeValidate<T>(
    schema: z.ZodType<T>,
    value: unknown
): { success: true; data: T } | { success: false; error: string } {
    const result = schema.safeParse(value);
    if (result.success) {
        return { success: true, data: result.data };
    }
    return {
        success: false,
        error: result.error.issues.map((e) => e.message).join(', '),
    };
}
