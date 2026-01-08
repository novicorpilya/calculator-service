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
                { inventory_id: '1', quantity: 2, price: 100 } as any,
                { inventory_id: '2', quantity: 1, price: 50 } as any
            ];
            // 2*100 + 1*50 = 250
            expect(calculateTotalCost(items)).toBe(250);
        });

        test('should prefer explicit total if available', () => {
            const items: InventoryItem[] = [
                { quantity: 2, price: 100, total: 500 } as any // total 500 overrides 2*100=200
            ];
            expect(calculateTotalCost(items)).toBe(500);
        });

        test('should handle floating point logic safely (rounding handled at display usually, but here raw)', () => {
            const items: InventoryItem[] = [
                { quantity: 0.1, price: 0.2 } as any // 0.02
            ];
            expect(calculateTotalCost(items)).toBeCloseTo(0.02);
        });

        test('should ignore non-finite numbers', () => {
            const items: InventoryItem[] = [
                { quantity: 1, price: 100 } as any,
                { quantity: 1, total: NaN } as any, // should be ignored
                { quantity: 1, total: Infinity } as any // should be ignored
            ];
            expect(calculateTotalCost(items)).toBe(100);
        });
    });

    describe('calculateTotalItems', () => {
        test('should return array length', () => {
            expect(calculateTotalItems([1, 2, 3] as any)).toBe(3);
        });
    });

    describe('formatCurrency', () => {
        test('should format RUB correctly', () => {
            // Intl output depends on locale, environment.
            // We check if it contains the number and symbol
            const str = formatCurrency(1000);
            expect(str).toContain('1');
            expect(str).toContain('000');
            expect(str).toContain('₽');
        });

        test('should handle NaN as 0 ₽', () => {
            expect(formatCurrency(NaN)).toBe('0 ₽');
        });
    });
});
