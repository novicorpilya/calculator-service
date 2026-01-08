import {
    type Zone,
    type InventoryItem,
    type CalculationResults,
    type ZoneResult,
    INTENSITY_LEVELS,
    ZONE_COEFFS,
    RESERVE_COEFFS
} from '../features/dashboard/dashboard.types';
import { type InventoryItemMaster } from '../services/inventory.service';
import { getTotalZonesArea, getTotalZonesStaff } from '@/core/domain/calculator.utils';

/**
 * CalculationEngine v3.0 (Senior Implementation)
 * Implements professional ISO 18406 + BICSc forecasting methodology.
 * Formula: Qty = MAX(Q_area, Q_staff, Q_visitors) × K_zone × K_intensity × (1 + K_reserve)
 */
export const CalculationEngine = {
    calculateInventory(
        zones: Zone[],
        objectData: {
            staffCount: string;
            dailyVisitors: string;
            sanitaryLevel: string;
            replacementCycle: string;
            intensityLevel?: string;
        },
        globalInventory: InventoryItemMaster[]
    ): CalculationResults {
        const zoneResults: ZoneResult[] = [];
        const aggregated: Record<string, InventoryItem> = {};

        // 1. Resolve Global Coefficients
        const intensityKey = (objectData.intensityLevel || 'medium').toLowerCase();
        const kIntensity = INTENSITY_LEVELS.find(l => l.value === intensityKey)?.coeff ?? 1.0;

        const reserveKey = intensityKey as keyof typeof RESERVE_COEFFS;
        const kReserve = RESERVE_COEFFS[reserveKey as keyof typeof RESERVE_COEFFS] ?? RESERVE_COEFFS.default;

        const totalZonesStaff = getTotalZonesStaff(zones);
        const globalPersonnel = totalZonesStaff > 0 ? totalZonesStaff : parseInt(objectData.staffCount || '0');
        const globalVisitors = parseInt(objectData.dailyVisitors || '0');

        zones.forEach(zone => {
            const zoneItems: InventoryItem[] = [];
            const zonePersonnel = parseInt(zone.staffCount || '0');
            const zoneArea = parseFloat(zone.area || '0');

            // Share of global visitors for this specific zone based on personnel ratio
            const zoneVisitorShare = globalPersonnel > 0
                ? globalVisitors * (zonePersonnel / globalPersonnel)
                : 0;

            globalInventory.forEach(item => {
                if (item.color === zone.color) {
                    // 2. Component Demand Calculation
                    const qArea = (zoneArea / 100) * (item.norm_area || 0);
                    const qStaff = zonePersonnel * (item.norm_personnel || 0);
                    const qVisitors = (zoneVisitorShare / 100) * (item.norm_intensity || 0);

                    // 3. Limiting Factor Selection (The "MAX" rule)
                    const qBase = Math.max(qArea, qStaff, qVisitors);

                    // 4. Coefficient Application
                    const kZone = ZONE_COEFFS[item.color] ?? 1.0;

                    // Final Quantity (Commercial Stock)
                    const totalQuantityFloat = qBase * kZone * kIntensity * (1 + kReserve);

                    // BICSc Rule: If zone is active and norm is set, minimum is 1
                    const minQuantity = (item.norm_personnel > 0 || item.norm_area > 0) ? 1 : 0;
                    const finalQuantity = Math.max(Math.ceil(totalQuantityFloat), minQuantity);

                    if (finalQuantity > 0) {
                        // 5. Extended Metrics for Reporting
                        const replacementCycle = item.replacement_cycle_days || 365;
                        const annualMultiplier = 365 / replacementCycle;
                        const annualConsumption = finalQuantity * annualMultiplier;
                        const monthlyOrder = annualConsumption / 12;

                        // Logistic Parameters
                        const reorderPoint = finalQuantity * 0.3;
                        const safetyStock = finalQuantity * 0.2;

                        // 6. Build Detailed Breakdown
                        const newItem: InventoryItem = {
                            inventory: item.name,
                            sku: item.sku,
                            color: item.color,
                            quantity: finalQuantity,
                            price: item.price,
                            total: finalQuantity,
                            stock: item.stock,
                            norm_area: item.norm_area,
                            supplier_id: item.supplier_id,
                            norms: {
                                area: item.norm_area,
                                personnel: item.norm_personnel,
                                intensity: item.norm_intensity,
                                replacementCycle: replacementCycle
                            },
                            calculation: {
                                qArea: Number(qArea.toFixed(2)),
                                qStaff: Number(qStaff.toFixed(2)),
                                qVisitors: Number(qVisitors.toFixed(2)),
                                qBase: Number(qBase.toFixed(2)),
                                kZone,
                                kIntensity,
                                kReserve,
                                monthlyOrder: Number(monthlyOrder.toFixed(1)),
                                annualConsumption: Math.ceil(annualConsumption),
                                annualBudget: Math.ceil(annualConsumption * item.price),
                                reorderPoint: Math.ceil(reorderPoint),
                                safetyStock: Math.ceil(safetyStock),
                                formula: `MAX(${qArea.toFixed(1)}, ${qStaff.toFixed(1)}, ${qVisitors.toFixed(1)}) × ${kZone} × ${kIntensity} × ${1 + kReserve}`,
                                breakdown: `Лимитирующий фактор: ${qBase.toFixed(1)} ед. База запаса с учетом зоны (${kZone.toFixed(2)}) и нагрузки (${kIntensity.toFixed(2)}).`
                            }
                        };

                        zoneItems.push(newItem);

                        const key = `${item.name}-${item.sku || 'N/A'}-${item.color}`;
                        if (!aggregated[key]) {
                            aggregated[key] = { ...newItem, quantity: 0, total: 0 };
                        }
                        aggregated[key].quantity += finalQuantity;
                        aggregated[key].total += finalQuantity;

                        // Aggregated results should also have calculation summary for the group
                        if (aggregated[key].calculation) {
                            const calc = aggregated[key].calculation!;
                            calc.annualConsumption = (calc.annualConsumption || 0) + Math.ceil(annualConsumption);
                            calc.annualBudget = (calc.annualBudget || 0) + Math.ceil(annualConsumption * item.price);
                            calc.monthlyOrder = (calc.monthlyOrder || 0) + Number(monthlyOrder.toFixed(1));
                        }
                    }
                }
            });

            zoneResults.push({
                zoneName: zone.name,
                area: zone.area,
                type: zone.type,
                color: zone.color,
                items: zoneItems
            });
        });

        return {
            byZone: zoneResults,
            summary: Object.values(aggregated).map(item => ({
                ...item,
                total: item.quantity // Ensure total reflects quantity in summary
            }))
        };
    },

    /**
     * Calculates demand for a single master item based on aggregate project data.
     * Useful for manual additions by managers in Expert Mode.
     */
    calculateSingleItem(
        item: InventoryItemMaster,
        zones: Zone[],
        objectData: {
            staffCount: string;
            dailyVisitors: string;
            sanitaryLevel: string;
            replacementCycle: string;
            intensityLevel?: string;
        }
    ): InventoryItem {
        const intensityKey = (objectData.intensityLevel || 'medium').toLowerCase();
        const kIntensity = INTENSITY_LEVELS.find(l => l.value === intensityKey)?.coeff ?? 1.0;
        const reserveKey = intensityKey as keyof typeof RESERVE_COEFFS;
        const kReserve = RESERVE_COEFFS[reserveKey as keyof typeof RESERVE_COEFFS] ?? RESERVE_COEFFS.default;

        const totalArea = getTotalZonesArea(zones);
        const totalStaff = getTotalZonesStaff(zones);
        const globalStaff = totalStaff > 0 ? totalStaff : parseInt(objectData.staffCount || '0');
        const globalVisitors = parseInt(objectData.dailyVisitors || '0');

        // Demand components
        const qArea = (totalArea / 100) * (item.norm_area || 0);
        const qStaff = globalStaff * (item.norm_personnel || 0);
        const qVisitors = (globalVisitors / 100) * (item.norm_intensity || 0);

        const qBase = Math.max(qArea, qStaff, qVisitors);
        const kZone = ZONE_COEFFS[item.color] ?? 1.0;
        const totalQuantityFloat = qBase * kZone * kIntensity * (1 + kReserve);
        const minQuantity = (item.norm_personnel > 0 || item.norm_area > 0) ? 1 : 0;
        const finalQuantity = Math.max(Math.ceil(totalQuantityFloat), minQuantity);

        const replacementCycle = item.replacement_cycle_days || 365;
        const annualMultiplier = 365 / replacementCycle;
        const annualConsumption = finalQuantity * annualMultiplier;
        const monthlyOrder = annualConsumption / 12;

        return {
            inventory: item.name,
            sku: item.sku,
            color: item.color,
            quantity: finalQuantity,
            price: item.price,
            total: finalQuantity,
            stock: item.stock,
            norm_area: item.norm_area,
            supplier_id: item.supplier_id,
            norms: {
                area: item.norm_area,
                personnel: item.norm_personnel,
                intensity: item.norm_intensity,
                replacementCycle: replacementCycle
            },
            calculation: {
                qArea: Number(qArea.toFixed(2)),
                qStaff: Number(qStaff.toFixed(2)),
                qVisitors: Number(qVisitors.toFixed(2)),
                qBase: Number(qBase.toFixed(2)),
                kZone,
                kIntensity,
                kReserve,
                monthlyOrder: Number(monthlyOrder.toFixed(1)),
                annualConsumption: Math.ceil(annualConsumption),
                annualBudget: Math.ceil(annualConsumption * item.price),
                reorderPoint: Math.ceil(finalQuantity * 0.3),
                safetyStock: Math.ceil(finalQuantity * 0.2),
                formula: `MAX(${qArea.toFixed(1)}, ${qStaff.toFixed(1)}, ${qVisitors.toFixed(1)}) × ${kZone} × ${kIntensity} × ${1 + kReserve}`,
                breakdown: `Ручное добавление: лимитирующий фактор ${qBase.toFixed(1)} ед. База с учетом зоны (${kZone.toFixed(2)}) и нагрузки (${kIntensity.toFixed(2)}).`
            }
        };
    }
};
