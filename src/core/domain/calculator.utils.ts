import type { InventoryItem } from '../../features/dashboard/dashboard.types';

/**
 * Pure function to calculate total cost from inventory items.
 * @param items List of inventory items
 * @returns Total cost (sum of price * quantity or total field)
 */
export function calculateTotalCost(items: InventoryItem[] = []): number {
    if (!Array.isArray(items)) return 0;

    return items.reduce((acc, item) => {
        // Priority: 
        // 1. item.total (should be quantity * price)
        // 2. price * quantity (fallback calculation)
        // 3. annualBudget (only if no quantity/price data)
        const itemTotal = 
            Number(item.total) || 
            (Number(item.price) * (Number(item.quantity) || 0)) ||
            Number(item.calculation?.annualBudget) || 0;

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
        maximumFractionDigits: 0,
    }).format(amount);
}

// ============================================
// Zone Aggregation Helpers
// ============================================

interface ZoneLike {
    area?: string | number;
    staffCount?: string | number;
}

/**
 * Calculate total area across all zones.
 * @param zones Array of zone objects with area field
 * @returns Total area as number
 */
export function getTotalZonesArea(zones: ZoneLike[] = []): number {
    if (!Array.isArray(zones)) return 0;
    return zones.reduce((sum, zone) => sum + parseFloat(String(zone.area || '0')), 0);
}

/**
 * Calculate total staff count across all zones.
 * @param zones Array of zone objects with staffCount field
 * @returns Total staff count as number
 */
export function getTotalZonesStaff(zones: ZoneLike[] = []): number {
    if (!Array.isArray(zones)) return 0;
    return zones.reduce((sum, zone) => sum + parseInt(String(zone.staffCount || '0'), 10), 0);
}
