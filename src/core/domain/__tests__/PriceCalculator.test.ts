import { describe, it, expect } from 'vitest';
import { PriceCalculator } from '../PriceCalculator';
import type { InventoryItem } from '@/features/dashboard/dashboard.types';

describe('PriceCalculator', () => {
    const mockItems = [
        {
            inventory: 'item1',
            quantity: 2,
            price: 100,
            total: 200,
            norm_area: 1,
            color: 'white',
            stock: 10,
        },
        {
            inventory: 'item2',
            quantity: 1,
            price: 50,
            total: 50,
            norm_area: 1,
            color: 'white',
            stock: 10,
        },
    ] as unknown as InventoryItem[];

    it('should calculate base net total correctly', () => {
        const net = PriceCalculator.calculateNetTotal(mockItems);
        expect(net).toBe(250); // (2*100) + (1*50)
    });

    it('should apply global margin correctly', () => {
        const net = PriceCalculator.calculateNetTotal(mockItems, { global_margin: 1.2 });
        expect(net).toBe(300); // 250 * 1.2
    });

    it('should add delivery and service costs', () => {
        const net = PriceCalculator.calculateNetTotal(mockItems, {
            delivery_cost: 50,
            service_cost: 100,
        });
        expect(net).toBe(400); // 250 + 50 + 100
    });

    it('should calculate final total with VAT and rounding', () => {
        // Net: 250. VAT: 0.20. Total: 250 * 1.2 = 300
        const total = PriceCalculator.calculateFinalTotal(mockItems);
        expect(total).toBe(300);
    });

    it('should handle complex adjustments together', () => {
        // Base: 250. Margin: 1.1 -> 275. Delivery: 25. Service: 0 -> 300 Net. VAT 1.2 -> 360 Total
        const total = PriceCalculator.calculateFinalTotal(mockItems, {
            global_margin: 1.1,
            delivery_cost: 25,
        });
        expect(total).toBe(360);
    });
});
