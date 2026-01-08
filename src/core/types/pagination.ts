/**
 * Типы и утилиты для пагинации.
 * Используется во всех репозиториях и API-методах.
 */

/**
 * Параметры пагинации для запросов.
 */
export interface PaginationParams {
    /** Номер страницы (начиная с 1) */
    page: number;
    /** Количество элементов на странице */
    pageSize: number;
}

/**
 * Метаданные пагинации в ответе.
 */
export interface PaginationMeta {
    /** Текущая страница */
    page: number;
    /** Размер страницы */
    pageSize: number;
    /** Общее количество элементов */
    total: number;
    /** Общее количество страниц */
    totalPages: number;
    /** Есть ли следующая страница */
    hasMore: boolean;
    /** Есть ли предыдущая страница */
    hasPrevious: boolean;
}

/**
 * Пагинированный результат.
 */
export interface PaginatedResult<T> {
    /** Данные текущей страницы */
    data: T[];
    /** Метаданные пагинации */
    pagination: PaginationMeta;
}

/**
 * Размер страницы по умолчанию.
 */
export const DEFAULT_PAGE_SIZE = 50;

/**
 * Максимальный размер страницы (для защиты от DoS).
 */
export const MAX_PAGE_SIZE = 100;

/**
 * Создаёт объект пагинации с дефолтными значениями.
 */
export function createPaginationParams(
    page: number = 1,
    pageSize: number = DEFAULT_PAGE_SIZE
): PaginationParams {
    return {
        page: Math.max(1, page),
        pageSize: Math.min(Math.max(1, pageSize), MAX_PAGE_SIZE),
    };
}

/**
 * Вычисляет offset для SQL-запроса на основе параметров пагинации.
 */
export function calculateOffset(params: PaginationParams): { from: number; to: number } {
    const from = (params.page - 1) * params.pageSize;
    const to = from + params.pageSize - 1;
    return { from, to };
}

/**
 * Создаёт метаданные пагинации на основе total count.
 */
export function createPaginationMeta(
    params: PaginationParams,
    total: number
): PaginationMeta {
    const totalPages = Math.ceil(total / params.pageSize);
    return {
        page: params.page,
        pageSize: params.pageSize,
        total,
        totalPages,
        hasMore: params.page < totalPages,
        hasPrevious: params.page > 1,
    };
}

/**
 * Создаёт пагинированный результат.
 */
export function createPaginatedResult<T>(
    data: T[],
    params: PaginationParams,
    total: number
): PaginatedResult<T> {
    return {
        data,
        pagination: createPaginationMeta(params, total),
    };
}
