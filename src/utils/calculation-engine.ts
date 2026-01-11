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
 * Tier mapping for different object types.
 * 1: Economy, 2: Standard, 3: Premium
 */
const TIER_MAPPING = {
    'hotel': [2, 3],
    'restaurant': [2, 3],
    'production_food': [2, 3],
    'production_nonfood': [1, 2],
    'beauty': [2, 3],
    'mall': [1, 2],
    'other': [1, 2]
};

/**
 * Durability thresholds based on intensity levels.
 * Items with durability below these values are filtered out for high-load objects.
 */
const DURABILITY_THRESHOLDS: Record<string, number> = {
    'high': 50,
    'very_high': 100,
    'critical': 200
};

/**
 * CalculationEngine v3.0 (Senior Implementation)
 * Implements professional ISO 18406 + BICSc forecasting methodology.
 * Formula: Qty = MAX(Q_area, Q_staff, Q_visitors) × K_zone × K_intensity × (1 + K_reserve)
 */
export const CalculationEngine = {
    calculateInventory(
        zones: Zone[],
        objectData: {
            type: string;
            staffCount: string;
            dailyVisitors: string;
            sanitaryLevel: string;
            replacementCycle: string;
            intensityLevel?: string;
        },
        globalInventory: InventoryItemMaster[]
    ): CalculationResults {
        const intensityKey = (objectData.intensityLevel || 'medium').toLowerCase();
        const durabilityThreshold = DURABILITY_THRESHOLDS[intensityKey] || 0;

        // 0. Pre-filter inventory by Tier and Durability
        const allowedTiers = TIER_MAPPING[objectData.type as keyof typeof TIER_MAPPING] ?? [1, 2];
        const filteredInventory = globalInventory.filter(item => {
            // Tier check
            const isTierAllowed = !item.tier || allowedTiers.includes(item.tier);
            // Durability check (only for high-load objects)
            const isDurableEnough = !durabilityThreshold || !item.durability || item.durability >= durabilityThreshold;
            // Compliance check (for high/sterile sanitary levels)
            const isCompliant = (objectData.sanitaryLevel !== 'high' && objectData.sanitaryLevel !== 'sterile') 
                || item.compliance_level === 'certified' 
                || item.compliance_level === 'sterile';
            
            return isTierAllowed && isDurableEnough && isCompliant;
        });

        // 0.5. Selection Logic: TCO + Bundle Compatibility
        const optimizedByColor: Record<string, Record<string, InventoryItemMaster>> = {};

        // Helper to get TCO score (lower is better)
        const getTCO = (item: InventoryItemMaster) => item.price / (item.durability || 1);

        // First Pass: Identify Master items and establish Series Lock per color group
        const seriesLock: Record<string, string> = {}; 
        const masterCategories = ['holder', 'dispenser', 'equipment', 'tool'];

        filteredInventory.forEach(item => {
            if (!item.category) return;
            const color = item.color;
            if (!optimizedByColor[color]) optimizedByColor[color] = {};

            // If it's a master item, we evaluate it for Series Lock
            if (masterCategories.includes(item.category.toLowerCase())) {
                const currentBest = optimizedByColor[color][item.category];
                if (!currentBest || getTCO(item) < getTCO(currentBest)) {
                    optimizedByColor[color][item.category] = item;
                    if (item.series) seriesLock[color] = item.series;
                }
            }
        });

        // Second Pass: Pick remaining items, respecting Series Lock if applicable
        filteredInventory.forEach(item => {
            if (!item.category) return;
            const color = item.color;
            if (masterCategories.includes(item.category.toLowerCase())) return; // Already processed

            const lock = seriesLock[color];
            const currentBest = optimizedByColor[color][item.category];

            // Selection Logic: 
            // 1. If we have a series lock and this item matches it -> prioritized
            // 2. If no lock or current matches lock too -> compare TCO
            const isMatchLock = lock && item.series === lock;
            const bestIsLock = lock && currentBest?.series === lock;

            if (isMatchLock && !bestIsLock) {
                optimizedByColor[color][item.category] = item;
            } else if ((!lock || isMatchLock || !bestIsLock) && (!currentBest || getTCO(item) < getTCO(currentBest))) {
                optimizedByColor[color][item.category] = item;
            }
        });

        // Flatten optimized items + add standalone items (those without category)
        const optimizedInventory = [
            ...filteredInventory.filter(i => !i.category), // Keep uncategorized items (respect filters)
            ...Object.values(optimizedByColor).flatMap(catMap => Object.values(catMap))
        ];

        const zoneResults: ZoneResult[] = [];
        const aggregated: Record<string, InventoryItem> = {};

        // 1. Resolve Global Coefficients
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

            optimizedInventory.forEach(item => {
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
                                monthlyOrder: Math.ceil(monthlyOrder),
                                annualConsumption: Math.ceil(annualConsumption),
                                annualBudget: Math.ceil(annualConsumption * item.price),
                                reorderPoint: Math.ceil(reorderPoint),
                                safetyStock: Math.ceil(safetyStock),
                                formula: `MAX(${Math.ceil(qArea)}, ${Math.ceil(qStaff)}, ${Math.ceil(qVisitors)}) × ${kZone} × ${kIntensity} × ${1 + kReserve}`,
                                breakdown: `Лимитирующий фактор: ${Math.ceil(qBase)} ед. База запаса с учетом зоны (${kZone.toFixed(2)}) и нагрузки (${kIntensity.toFixed(2)}).`
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
                            calc.monthlyOrder = (calc.monthlyOrder || 0) + Math.ceil(monthlyOrder);
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
                monthlyOrder: Math.ceil(monthlyOrder),
                annualConsumption: Math.ceil(annualConsumption),
                annualBudget: Math.ceil(annualConsumption * item.price),
                reorderPoint: Math.ceil(finalQuantity * 0.3),
                safetyStock: Math.ceil(finalQuantity * 0.2),
                formula: `MAX(${Math.ceil(qArea)}, ${Math.ceil(qStaff)}, ${Math.ceil(qVisitors)}) × ${kZone} × ${kIntensity} × ${1 + kReserve}`,
                breakdown: `Ручное добавление: лимитирующий фактор ${Math.ceil(qBase)} ед. База с учетом зоны (${kZone.toFixed(2)}) и нагрузки (${kIntensity.toFixed(2)}).`
            }
        };
    }
};
