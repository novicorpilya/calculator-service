import type { InventoryItem } from '../../features/dashboard/dashboard.types';

/**
 * Pure function to calculate total cost from inventory items.
 * @param items List of inventory items
 * @returns Total cost (sum of price * quantity or total field)
 */
export function calculateTotalCost(items: InventoryItem[] = []): number {
    if (!Array.isArray(items)) return 0;

    return items.reduce((acc, item) => {
        // Prefer explicit total if available, otherwise calculate
        const itemTotal = Number(item.total) || (Number(item.price) * Number(item.quantity));

        // Handle NaN/Infinity
        if (!Number.isFinite(itemTotal)) return acc;

        return acc + itemTotal;
    }, 0);
}

/**
 * Pure function to calculate total items count.
 * @param items List of inventory items
 * @returns Count of items
 */
export function calculateTotalItems(items: InventoryItem[] = []): number {
    if (!Array.isArray(items)) return 0;
    return items.length;
}

/**
 * Pure function to format a number as currency.
 * Using 'ru-RU' and 'RUB' as domain constants for this project.
 * @param amount Amount to format
 * @returns Formatted currency string
 */
export function formatCurrency(amount: number): string {
    if (!Number.isFinite(amount)) return '0 ₽';
    return new Intl.NumberFormat('ru-RU', {
        style: 'currency',
        currency: 'RUB',
        maximumFractionDigits: 0
    }).format(amount);
}
