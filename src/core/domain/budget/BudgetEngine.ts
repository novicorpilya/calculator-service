import { CalculationEngine } from '@/utils/calculation-engine';
import {
    type ZoneWithPriority,
    type BudgetPlan,
    type BudgetAllocation,
    type PriorityLevel,
} from './budget.types';
import { type InventoryItemMaster } from '@/services/inventory.service';
import { type InventoryItem, type ZoneResult } from '@/features/dashboard/dashboard.types';
import { DEFAULT_CALCULATOR_CONFIG } from '@/features/calculator/calculator-config.types';

interface BudgetSummary {
    fullyFundedZones: number;
    partialZones: number;
    droppedZones: number;
}

interface BudgetSuggestion {
    type: 'upsell' | 'optimization' | 'warning';
    message: string;
    impactAmount?: number;
}

export interface ObjectData {
    type: string;
    staffCount: string;
    dailyVisitors: string;
    sanitaryLevel: string;
    replacementCycle: string;
    intensityLevel?: string;
}

export class BudgetEngine {
    /**
     * Core Algorithm: Optimized greedy allocation with priority-based simulation.
     */
    static optimize(
        totalBudget: number,
        zones: ZoneWithPriority[],
        inventory: InventoryItemMaster[],
        objectData: ObjectData,
        config = DEFAULT_CALCULATOR_CONFIG
    ): BudgetPlan {
        // 1. Initial Simulation - What is the "Ideal" world cost?
        const fullResults = CalculationEngine.calculateInventory(
            zones,
            objectData,
            inventory,
            config
        );

        // Map ideal results back to our priorities
        const idealByZone = new Map<string, ZoneResult>();
        fullResults.byZone.forEach((zr) => {
            // Find the original zone to get its priority and ID
            const original = zones.find((z) => z.name === zr.zoneName);
            if (original) {
                idealByZone.set(String(original.id), zr); // Ensure ID is string
            }
        });

        // 2. Sort Zones by Priority
        const priorityOrder: PriorityLevel[] = ['critical', 'standard', 'low'];
        const sortedZones = [...zones].sort((a, b) => {
            return priorityOrder.indexOf(a.priority) - priorityOrder.indexOf(b.priority);
        });

        let remainingBudget = totalBudget;
        const allocations: BudgetAllocation[] = [];

        // 3. Sequential Allocation
        sortedZones.forEach((zone) => {
            const ideal = idealByZone.get(String(zone.id)); // Ensure ID is string
            if (!ideal) return;

            const idealZoneCost = ideal.items.reduce(
                (sum: number, item: InventoryItem) => sum + (item.total || 0),
                0
            );

            let allocatedItems: InventoryItem[] = [];
            let droppedItems: InventoryItem[] = [];
            let allocatedAmount = 0;

            if (remainingBudget >= idealZoneCost) {
                // Fully funded
                allocatedItems = [...ideal.items];
                allocatedAmount = idealZoneCost;
                remainingBudget -= idealZoneCost;
            } else if (remainingBudget > 0) {
                // Partially funded - Apply "Essential First" strategy
                const { funded, dropped } = this.applyEssentialStrategy(
                    ideal.items,
                    remainingBudget
                );
                allocatedItems = funded;
                droppedItems = dropped;
                allocatedAmount = funded.reduce((sum, item) => sum + (item.total || 0), 0);
                remainingBudget -= allocatedAmount;
            } else {
                // Not funded at all
                droppedItems = [...ideal.items];
                allocatedAmount = 0;
            }

            allocations.push({
                zoneId: String(zone.id), // Ensure ID is string
                zoneName: zone.name,
                idealAmount: idealZoneCost,
                allocatedAmount: allocatedAmount,
                coveragePercent: idealZoneCost > 0 ? (allocatedAmount / idealZoneCost) * 100 : 100,
                isFullyFunded: allocatedAmount >= idealZoneCost,
                items: allocatedItems,
                droppedItems: droppedItems,
            });
        });

        const actualTotal = allocations.reduce((sum, a) => sum + a.allocatedAmount, 0);

        // 4. Generate Meta Summary
        const summary: BudgetSummary = {
            fullyFundedZones: allocations.filter((a) => a.isFullyFunded).length,
            partialZones: allocations.filter((a) => !a.isFullyFunded && a.allocatedAmount > 0)
                .length,
            droppedZones: allocations.filter((a) => a.allocatedAmount === 0).length,
        };

        const suggestions = this.generateSuggestions(
            totalBudget,
            fullResults.grandTotal || 0,
            summary
        );

        return {
            totalBudget,
            actualTotal,
            coveragePercent:
                (fullResults.grandTotal || 0) > 0
                    ? (actualTotal / (fullResults.grandTotal || 0)) * 100
                    : 100,
            allocations,
            summary,
            suggestions,
        };
    }

    /**
     * Internal Strategy: Prioritize items based on category importance.
     */
    private static applyEssentialStrategy(items: InventoryItem[], budget: number) {
        // Sort items by priority category
        // 1. Systems/Equipment (Holders, Dispensers)
        // 2. Main Inventory (Mops, Trolleys)
        // 3. Consumables (Chemicals, Paper)
        const categoryPriority = (cat: string = '') => {
            const c = cat.toLowerCase();
            if (
                c.includes('систем') ||
                c.includes('оборуд') ||
                c.includes('диспенс') ||
                c.includes('держат')
            )
                return 1;
            if (c.includes('инвентар') || c.includes('инструм') || c.includes('моп')) return 2;
            return 3; // Everything else (supplies, chemistry)
        };

        const sortedItems = [...items].sort(
            (a, b) => categoryPriority(a.category) - categoryPriority(b.category)
        );

        const funded: InventoryItem[] = [];
        const dropped: InventoryItem[] = [];
        let currentBudget = budget;

        sortedItems.forEach((item) => {
            if (currentBudget >= item.total) {
                funded.push(item);
                currentBudget -= item.total;
            } else {
                dropped.push(item);
            }
        });

        return { funded, dropped };
    }

    private static generateSuggestions(
        budget: number,
        idealTotal: number,
        summary: BudgetSummary
    ): BudgetSuggestion[] {
        const suggestions: BudgetSuggestion[] = [];

        if (budget >= idealTotal) {
            suggestions.push({
                type: 'upsell',
                message:
                    'Ваш бюджет полностью покрывает потребности. Рекомендуем рассмотреть переход на премиум-линейку аксессуаров для повышения имиджа.',
            });
        } else {
            const diff = idealTotal - budget;
            suggestions.push({
                type: 'optimization',
                message: `Чтобы полностью укомплектовать объект, необходимо добавить ${diff.toLocaleString('ru-RU')} ₽.`,
                impactAmount: diff,
            });

            if (summary.droppedZones > 0) {
                suggestions.push({
                    type: 'warning',
                    message: `Внимание: ${summary.droppedZones} зон(ы) остались без оснащения из-за ограничений бюджета.`,
                });
            }
        }

        return suggestions;
    }
}
