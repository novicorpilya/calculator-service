import { describe, it, expect, vi } from 'vitest';
import { BudgetEngine } from '../BudgetEngine';
import { CalculationEngine } from '@/utils/calculation-engine';
import type { ZoneWithPriority } from '../budget.types';
import type { InventoryItemMaster } from '@/services/inventory.service';
import type { CalculationResults } from '@/features/dashboard/dashboard.types';

// Mock CalculationEngine
vi.mock('@/utils/calculation-engine', () => ({
    CalculationEngine: {
        calculateInventory: vi.fn(),
    },
}));

describe('BudgetEngine', () => {
    const mockInventory: InventoryItemMaster[] = [];
    const mockObjectData = {
        type: 'hotel',
        staffCount: '10',
        dailyVisitors: '100',
        sanitaryLevel: 'medium',
        replacementCycle: 'weekly',
    };

    it('should fully fund all zones if budget is sufficient', () => {
        const mockZones = [
            {
                id: '1',
                name: 'Kitchen',
                priority: 'critical',
                area: '100',
                color: 'red',
                type: 'kitchen',
                staffCount: '2',
            },
            {
                id: '2',
                name: 'WC',
                priority: 'standard',
                area: '50',
                color: 'blue',
                type: 'wc',
                staffCount: '1',
            },
        ] as ZoneWithPriority[];

        vi.mocked(CalculationEngine.calculateInventory).mockReturnValue({
            byZone: [
                {
                    zoneName: 'Kitchen',
                    items: [{ inventory: 'Soap', total: 1000, category: 'Consumables' }],
                },
                {
                    zoneName: 'WC',
                    items: [{ inventory: 'Paper', total: 500, category: 'Consumables' }],
                },
            ],
            grandTotal: 1500,
        } as unknown as CalculationResults);

        const plan = BudgetEngine.optimize(2000, mockZones, mockInventory, mockObjectData);

        expect(plan.actualTotal).toBe(1500);
        expect(plan.coveragePercent).toBe(100);
        expect(plan.summary.fullyFundedZones).toBe(2);
        expect(plan.allocations[0].isFullyFunded).toBe(true);
        expect(plan.allocations[1].isFullyFunded).toBe(true);
    });

    it('should prioritize critical zones when budget is limited', () => {
        const mockZones = [
            {
                id: '1',
                name: 'Kitchen',
                priority: 'critical',
                area: '100',
                color: 'red',
                type: 'kitchen',
            },
            { id: '2', name: 'WC', priority: 'standard', area: '50', color: 'blue', type: 'wc' },
        ] as ZoneWithPriority[];

        vi.mocked(CalculationEngine.calculateInventory).mockReturnValue({
            byZone: [
                {
                    zoneName: 'Kitchen',
                    items: [{ inventory: 'Soap', total: 1000, category: 'Consumables' }],
                },
                {
                    zoneName: 'WC',
                    items: [{ inventory: 'Paper', total: 500, category: 'Consumables' }],
                },
            ],
            grandTotal: 1500,
        } as unknown as CalculationResults);

        // Budget is only enough for Kitchen
        const plan = BudgetEngine.optimize(1200, mockZones, mockInventory, mockObjectData);

        expect(plan.actualTotal).toBe(1000);
        expect(plan.allocations.find((a) => a.zoneName === 'Kitchen')?.isFullyFunded).toBe(true);
        expect(plan.allocations.find((a) => a.zoneName === 'WC')?.allocatedAmount).toBe(0);
        expect(plan.summary.fullyFundedZones).toBe(1);
        expect(plan.summary.droppedZones).toBe(1);
    });

    it('should handle zero budget', () => {
        const mockZones = [
            {
                id: '1',
                name: 'Kitchen',
                priority: 'critical',
                area: '100',
                color: 'red',
                type: 'kitchen',
            },
        ] as ZoneWithPriority[];
        vi.mocked(CalculationEngine.calculateInventory).mockReturnValue({
            byZone: [{ zoneName: 'Kitchen', items: [{ inventory: 'Soap', total: 1000 }] }],
            grandTotal: 1000,
        } as unknown as CalculationResults);

        const plan = BudgetEngine.optimize(0, mockZones, mockInventory, mockObjectData);
        expect(plan.actualTotal).toBe(0);
        expect(plan.summary.droppedZones).toBe(1);
    });

    it('should apply essential first strategy for partial funding', () => {
        const mockZones = [
            {
                id: '1',
                name: 'Kitchen',
                priority: 'critical',
                area: '100',
                color: 'red',
                type: 'kitchen',
            },
        ] as ZoneWithPriority[];

        vi.mocked(CalculationEngine.calculateInventory).mockReturnValue({
            byZone: [
                {
                    zoneName: 'Kitchen',
                    items: [
                        { inventory: 'Dispenser', total: 1000, category: 'Equipment' },
                        { inventory: 'Soap', total: 500, category: 'Consumables' },
                    ],
                },
            ],
            grandTotal: 1500,
        } as unknown as CalculationResults);

        const plan = BudgetEngine.optimize(1200, mockZones, mockInventory, mockObjectData);

        const kitchen = plan.allocations[0];
        expect(kitchen.allocatedAmount).toBe(1000);
        expect(kitchen.items).toHaveLength(1);
        expect(kitchen.items[0].inventory).toBe('Dispenser');
        expect(kitchen.droppedItems[0].inventory).toBe('Soap');
    });

    it('should provide upsell suggestion if budget is large', () => {
        const mockZones = [
            {
                id: '1',
                name: 'Kitchen',
                priority: 'critical',
                area: '100',
                color: 'red',
                type: 'kitchen',
            },
        ] as ZoneWithPriority[];
        vi.mocked(CalculationEngine.calculateInventory).mockReturnValue({
            byZone: [{ zoneName: 'Kitchen', items: [{ inventory: 'Soap', total: 1000 }] }],
            grandTotal: 1000,
        } as unknown as CalculationResults);

        const plan = BudgetEngine.optimize(5000, mockZones, mockInventory, mockObjectData);
        expect(plan.suggestions.some((s) => s.type === 'upsell')).toBe(true);
    });
});
