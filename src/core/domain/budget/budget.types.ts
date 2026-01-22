import { type InventoryItem, type Zone } from '@/core/types/calculation';

export type PriorityLevel = 'critical' | 'standard' | 'low';

export interface ZoneWithPriority extends Zone {
    priority: PriorityLevel;
}

export interface BudgetAllocation {
    zoneId: string | number;
    zoneName: string;
    allocatedAmount: number;
    idealAmount: number;
    coveragePercent: number;
    isFullyFunded: boolean;
    items: InventoryItem[];
    droppedItems: InventoryItem[];
}

export interface BudgetPlan {
    totalBudget: number;
    actualTotal: number;
    coveragePercent: number;
    allocations: BudgetAllocation[];
    summary: {
        fullyFundedZones: number;
        partialZones: number;
        droppedZones: number;
    };
    suggestions: {
        type: 'upsell' | 'optimization' | 'warning';
        message: string;
        impactAmount?: number;
    }[];
}

export interface BudgetStrategy {
    name: string;
    description: string;
    apply: (
        items: InventoryItem[],
        availableBudget: number
    ) => { funded: InventoryItem[]; dropped: InventoryItem[] };
}
