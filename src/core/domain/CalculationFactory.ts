import type {
    Calculation,
    CalculationStatus,
    CalculationResults,
    Zone,
    InventoryItem,
} from '../types/calculation';
import { type BudgetPlan, type ZoneWithPriority } from '../domain/budget/budget.types';
import { OBJECT_TYPES } from '@/features/dashboard/dashboard.types';
import { DEFAULT_BUSINESS_RULES } from '../config/business.config';

export interface WizardObjectData {
    type: string;
    totalArea: string;
    staffCount?: string;
    dailyVisitors?: string;
    sanitaryLevel: string;
    intensityLevel: string;
    replacementCycle: string;
    selectedVenueId?: string;
}

export class CalculationFactory {
    /**
     * Creates a new Calculation DTO from wizard data.
     * Centralizes mapping from UI state to Domain model.
     */
    static createFromWizard(params: {
        objectData: WizardObjectData;
        zones: Zone[];
        results: CalculationResults;
        status: CalculationStatus;
        initialData?: Calculation;
        configSnapshot?: unknown;
    }): Calculation {
        const { objectData, zones, results, status, initialData, configSnapshot } = params;

        const selectedTypeLabel =
            OBJECT_TYPES.find((t) => t.value === objectData.type)?.label || objectData.type;

        // Implementation of business rules for staff count derivation
        const totalZonesStaff = zones.reduce((sum, z) => sum + parseInt(z.staffCount || '0'), 0);

        return {
            id: initialData?.id || crypto.randomUUID(),
            organizationName: selectedTypeLabel,
            type: objectData.type,
            status: status,
            zones: zones.map((z) => z.name),
            zoneDetails: zones,
            totalArea: parseFloat(objectData.totalArea || '0'),
            zonesCount: zones.length,
            staffCount:
                totalZonesStaff > 0 ? totalZonesStaff : parseInt(objectData.staffCount || '0'),
            dailyVisitors: parseInt(objectData.dailyVisitors || '0'),
            sanitaryLevel: objectData.sanitaryLevel,
            intensityLevel: objectData.intensityLevel,
            replacementCycle: objectData.replacementCycle,
            createdDate: initialData?.createdDate || new Date().toISOString(),
            manager: initialData?.manager || 'Назначается',
            comments: initialData?.comments || [],
            unreadComments: initialData?.unreadComments || 0,
            results: results,
            totalCost:
                results.grandTotal ||
                results.summary.reduce((acc, item) => acc + (item.total || 0), 0),
            calculator_config_snapshot: initialData?.calculator_config_snapshot || configSnapshot,
            venue_id: objectData.selectedVenueId || initialData?.venue_id,
        };
    }

    static createFromBudgetPlan(params: {
        plan: BudgetPlan;
        objectData: WizardObjectData;
        originalZones: ZoneWithPriority[];
        configSnapshot?: unknown;
    }): Calculation {
        const { plan, objectData, originalZones, configSnapshot } = params;

        const zones: Zone[] = plan.allocations.map((a) => {
            const original = originalZones.find((oz) => String(oz.id) === String(a.zoneId));
            return {
                id: String(a.zoneId),
                name: a.zoneName,
                type: original?.type || '',
                area: original?.area || '0',
                staffCount: original?.staffCount || '0',
                color: original?.color || '#ccc',
            };
        });

        // Aggregated summary of ALL items across ALL zones
        const summaryMap = new Map<string, InventoryItem>();
        plan.allocations.forEach((a) => {
            a.items.forEach((item) => {
                const key = `${item.inventory}-${item.sku}-${item.color}`;
                if (summaryMap.has(key)) {
                    const existing = summaryMap.get(key)!;
                    existing.quantity += item.quantity;
                    existing.total += item.total;
                } else {
                    summaryMap.set(key, { ...item });
                }
            });
        });

        const results: CalculationResults = {
            byZone: plan.allocations.map((a) => {
                const original = originalZones.find((oz) => String(oz.id) === String(a.zoneId));
                return {
                    zoneName: a.zoneName,
                    area: original?.area || '0',
                    type: original?.type || '',
                    color: original?.color || '#ccc',
                    items: a.items,
                };
            }),
            summary: Array.from(summaryMap.values()),
            totalGoods: plan.actualTotal,
            totalDelivery: 0, // Simplified for planner result
            totalVat: Math.ceil(plan.actualTotal * (DEFAULT_BUSINESS_RULES.TAX_RATE - 1)),
            grandTotal: Math.ceil(plan.actualTotal * DEFAULT_BUSINESS_RULES.TAX_RATE),
        };

        return this.createFromWizard({
            objectData,
            zones,
            results,
            status: 'draft',
            configSnapshot,
        });
    }
}
