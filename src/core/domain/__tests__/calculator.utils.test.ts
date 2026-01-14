import { describe, test, expect } from 'vitest';
import { calculateTotalCost, calculateTotalItems, formatCurrency } from '../calculator.utils';
import type { InventoryItem } from '../../../features/dashboard/dashboard.types';

describe('calculator.utils', () => {
    describe('calculateTotalCost', () => {
        test('should return 0 for empty input', () => {
            expect(calculateTotalCost([])).toBe(0);
        });

        test('should sum up valid items', () => {
            const items: InventoryItem[] = [
                { inventory_id: '1', quantity: 2, price: 100 } as unknown as InventoryItem,
                { inventory_id: '2', quantity: 1, price: 50 } as unknown as InventoryItem,
            ];
            expect(calculateTotalCost(items)).toBe(250);
        });

        test('should prefer explicit total if available', () => {
            const items: InventoryItem[] = [
                { quantity: 2, price: 100, total: 500 } as unknown as InventoryItem,
            ];
            expect(calculateTotalCost(items)).toBe(500);
        });
    });

    describe('calculateTotalItems', () => {
        test('should return array length', () => {
            expect(calculateTotalItems([{}, {}, {}] as unknown as InventoryItem[])).toBe(3);
        });
    });

    describe('formatCurrency', () => {
        test('should format RUB correctly', () => {
            const str = formatCurrency(1000);
            expect(str).toContain('₽');
        });

        test('should handle NaN as 0 ₽', () => {
            expect(formatCurrency(NaN)).toBe('0 ₽');
        });
    });
});
