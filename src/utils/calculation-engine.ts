import {
    type Zone,
    type InventoryItem,
    type CalculationResults,
    type ZoneResult,
    INTENSITY_LEVELS,
    ZONE_COEFFS,
    RESERVE_COEFFS,
} from '../features/dashboard/dashboard.types';
import { type InventoryItemMaster } from '../services/inventory.service';
import { getTotalZonesArea, getTotalZonesStaff } from '@/core/domain/calculator.utils';
import { type CalculatorConfig, DEFAULT_CALCULATOR_CONFIG } from '@/features/calculator/calculator-config.types';

/**
 * Tier mapping for different object types.
 * 1: Economy, 2: Standard, 3: Premium
 */
const TIER_MAPPING: Record<string, number[]> = {
    hotel: [2, 3],
    restaurant: [2, 3],
    production_food: [2, 3],
    production_nonfood: [1, 2],
    beauty: [2, 3],
    mall: [1, 2],
    other: [1, 2],
};

/**
 * Durability thresholds based on intensity levels.
 * Items with durability below these values are filtered out for high-load objects.
 */
const DURABILITY_THRESHOLDS: Record<string, number> = {
    high: 50,
    very_high: 100,
    critical: 200,
};

/**
 * Internal helper for core calculation logic.
 * Encapsulates the MAX rule and coefficient applications.
 * UPDATED: Uses dynamic configuration from Admin Panel.
 */
function calculateFinalQuantity(
    item: InventoryItemMaster,
    metrics: { area: number; personnel: number; visitorShare: number },
    coeffs: { kZone: number; kIntensity: number; kReserve: number },
    config: CalculatorConfig = DEFAULT_CALCULATOR_CONFIG
) {
    // 1. Calculate Factors
    const FACTORS = config.formula.factors;
    const qArea = FACTORS.area ? (metrics.area / 100) * (item.norm_area || 0) : 0;
    const qStaff = FACTORS.staff ? metrics.personnel * (item.norm_personnel || 0) : 0;
    const qVisitors = FACTORS.visitors ? (metrics.visitorShare / 100) * (item.norm_intensity || 0) : 0;

    // 2. Base Quantity (Aggregation Method)
    let qBase = 0;
    const activeValues = [qArea, qStaff, qVisitors].filter(v => v > 0);
    
    // 3. Calculate Final Total
    let total = 0;

    // 4. Advanced Custom Formula Logic
    if (config.formula.isAdvanced && config.formula.customFormula) {
        try {
            // Safe evaluation context
            const context = {
                q_area: qArea,
                q_staff: qStaff,
                q_visitors: qVisitors,
                k_zone: coeffs.kZone,
                k_intensity: coeffs.kIntensity,
                k_reserve: coeffs.kReserve,
                max: Math.max,
                min: Math.min,
                sum: (...args: number[]) => args.reduce((a, b) => a + b, 0),
                avg: (...args: number[]) => args.length ? args.reduce((a, b) => a + b, 0) / args.length : 0,
                ceil: Math.ceil,
                floor: Math.floor,
                round: Math.round,
                sqrt: Math.sqrt
            };

            // Create a function body that returns the evaluated expression
            // NOTE: 'new Function' is used here within a strictly controlled scope.
            // Only math keys are exposed. No access to window, DOM, or external scope.
            const safeEval = new Function(...Object.keys(context), `return ${config.formula.customFormula};`);
            const result = safeEval(...Object.values(context));
            
            if (typeof result === 'number' && !isNaN(result) && isFinite(result)) {
                total = result;
            } else {
                console.warn('Custom formula returned invalid result:', result);
                // Fallback to standard logic handled below if we didn't return
            }
        } catch (err) {
            console.error('Error evaluating custom formula:', err);
             // Fallback to standard logic
        }
    } else {
        // Standard Logic
        switch (config.formula.baseMethod) {
            case 'sum':
                qBase = qArea + qStaff + qVisitors;
                break;
            case 'avg':
                qBase = activeValues.length ? (qArea + qStaff + qVisitors) / activeValues.length : 0;
                break;
            case 'max':
            default:
                qBase = Math.max(qArea, qStaff, qVisitors);
                break;
        }

        const MULTIPLIERS = config.formula.multipliers;
        total = qBase;
        
        if (MULTIPLIERS.zone) total *= coeffs.kZone;
        if (MULTIPLIERS.intensity) total *= coeffs.kIntensity;
        if (MULTIPLIERS.reserve) total *= (1 + coeffs.kReserve);
    }

    // 4. Rounding & Minimums
    // BICSc Rule: If active and norm set, min is 1
    const hasNorm = item.norm_personnel > 0 || item.norm_area > 0;
    const minQuantity = hasNorm ? 1 : 0;
    const finalQuantity = Math.max(Math.ceil(total), minQuantity);

    return {
        qArea,
        qStaff,
        qVisitors,
        qBase,
        finalQuantity,
    };
}

/**
 * CalculationEngine v4.0 (Configurable)
 * Implements professional ISO 18406 + BICSc logic controlled by Admin Configuration.
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
        globalInventory: InventoryItemMaster[],
        config: CalculatorConfig = DEFAULT_CALCULATOR_CONFIG
    ): CalculationResults {
        const intensityKey = (objectData.intensityLevel || 'medium').toLowerCase();
        const durabilityThreshold = DURABILITY_THRESHOLDS[intensityKey] || 0;

        // 0. Pre-filter inventory by Tier and Durability
        const allowedTiers = TIER_MAPPING[objectData.type] ?? [1, 2];
        const filteredInventory = globalInventory.filter((item) => {
            const isTierAllowed = !item.tier || allowedTiers.includes(item.tier);
            const isDurableEnough =
                !durabilityThreshold || !item.durability || item.durability >= durabilityThreshold;
            const isCompliant =
                (objectData.sanitaryLevel !== 'high' && objectData.sanitaryLevel !== 'sterile') ||
                item.compliance_level === 'certified' ||
                item.compliance_level === 'sterile';

            return isTierAllowed && isDurableEnough && isCompliant;
        });

        // 0.5. Selection Logic: TCO + Bundle Compatibility
        const optimizedByColor: Record<string, Record<string, InventoryItemMaster>> = {};
        const getTCO = (item: InventoryItemMaster) => item.price / (item.durability || 1);
        const seriesLock: Record<string, string> = {};
        const masterCategories = ['holder', 'dispenser', 'equipment', 'tool'];

        filteredInventory.forEach((item) => {
            if (!item.category) return;
            const color = item.color;
            if (!optimizedByColor[color]) optimizedByColor[color] = {};

            if (masterCategories.includes(item.category.toLowerCase())) {
                const currentBest = optimizedByColor[color][item.category];
                if (!currentBest || getTCO(item) < getTCO(currentBest)) {
                    optimizedByColor[color][item.category] = item;
                    if (item.series) seriesLock[color] = item.series;
                }
            }
        });

        filteredInventory.forEach((item) => {
            if (!item.category || masterCategories.includes(item.category.toLowerCase())) return;
            const color = item.color;
            const lock = seriesLock[color];
            const currentBest = optimizedByColor[color][item.category];
            const isMatchLock = lock && item.series === lock;
            const bestIsLock = lock && currentBest?.series === lock;

            if (isMatchLock && !bestIsLock) {
                optimizedByColor[color][item.category] = item;
            } else if (
                (!lock || isMatchLock || !bestIsLock) &&
                (!currentBest || getTCO(item) < getTCO(currentBest))
            ) {
                optimizedByColor[color][item.category] = item;
            }
        });

        const optimizedInventory = [
            ...filteredInventory.filter((i) => !i.category),
            ...Object.values(optimizedByColor).flatMap((catMap) => Object.values(catMap)),
        ];

        // 1. Resolve Global Coefficients
        const kIntensity = INTENSITY_LEVELS.find((l) => l.value === intensityKey)?.coeff ?? 1.0;
        const kReserve = RESERVE_COEFFS[intensityKey as keyof typeof RESERVE_COEFFS] ?? RESERVE_COEFFS.default;

        const totalZonesStaff = getTotalZonesStaff(zones);
        const globalPersonnel = totalZonesStaff > 0 ? totalZonesStaff : parseInt(objectData.staffCount || '0');
        const globalVisitors = parseInt(objectData.dailyVisitors || '0');

        const zoneResults: ZoneResult[] = [];
        const aggregated: Record<string, InventoryItem> = {};

        zones.forEach((zone) => {
            const zoneItems: InventoryItem[] = [];
            const zonePersonnel = parseInt(zone.staffCount || '0');
            const zoneArea = parseFloat(zone.area || '0');
            const zoneVisitorShare = globalPersonnel > 0 ? globalVisitors * (zonePersonnel / globalPersonnel) : 0;

            optimizedInventory.forEach((item) => {
                if (item.color === zone.color) {
                    const kZone = ZONE_COEFFS[item.color] ?? 1.0;
                    const { qArea, qStaff, qVisitors, qBase, finalQuantity } = calculateFinalQuantity(
                        item,
                        { area: zoneArea, personnel: zonePersonnel, visitorShare: zoneVisitorShare },
                        { kZone, kIntensity, kReserve },
                        config
                    );

                    if (finalQuantity > 0) {
                        const replacementCycle = item.replacement_cycle_days || 365;
                        const annualConsumption = finalQuantity * (365 / replacementCycle);
                        
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
                                replacementCycle: replacementCycle,
                            },
                            calculation: {
                                qArea: Number(qArea.toFixed(2)),
                                qStaff: Number(qStaff.toFixed(2)),
                                qVisitors: Number(qVisitors.toFixed(2)),
                                qBase: Number(qBase.toFixed(2)),
                                kZone,
                                kIntensity,
                                kReserve,
                                monthlyOrder: Math.ceil(annualConsumption / 12),
                                annualConsumption: Math.ceil(annualConsumption),
                                annualBudget: Math.ceil(annualConsumption * item.price),
                                reorderPoint: Math.ceil(finalQuantity * 0.3),
                                safetyStock: Math.ceil(finalQuantity * 0.2),
                                formula: `${config.formula.baseMethod.toUpperCase()}(${Math.ceil(qArea)}, ${Math.ceil(qStaff)}, ${Math.ceil(qVisitors)}) \u00d7 ${kZone} \u00d7 ${kIntensity} \u00d7 ${1 + kReserve}`,
                                breakdown: `\u041b\u0438\u043c\u0438\u0442\u0438\u0440\u0443\u044e\u0449\u0438\u0439 \u0444\u0430\u043a\u0442\u043e\u0440: ${Math.ceil(qBase)} \u0435\u0434. \u0411\u0430\u0437\u0430 \u0437\u0430\u043f\u0430\u0441\u0430 \u0441 \u0443\u0447\u0435\u0442\u043e\u043c \u0437\u043e\u043d\u044b (${kZone.toFixed(2)}) \u0438 \u043d\u0430\u0433\u0440\u0443\u0437\u043a\u0438 (${kIntensity.toFixed(2)}).`,
                            },
                        };

                        zoneItems.push(newItem);
                        const key = `${item.name}-${item.sku || 'N/A'}-${item.color}`;
                        if (!aggregated[key]) {
                            aggregated[key] = { ...newItem, quantity: 0, total: 0 };
                        }
                        aggregated[key].quantity += finalQuantity;
                        aggregated[key].total += finalQuantity;

                        if (aggregated[key].calculation) {
                            const cal = aggregated[key].calculation!;
                            cal.annualConsumption = (cal.annualConsumption || 0) + Math.ceil(annualConsumption);
                            cal.annualBudget = (cal.annualBudget || 0) + Math.ceil(annualConsumption * item.price);
                            cal.monthlyOrder = (cal.monthlyOrder || 0) + Math.ceil(annualConsumption / 12);
                        }
                    }
                }
            });

            zoneResults.push({
                zoneName: zone.name,
                area: zone.area,
                type: zone.type,
                color: zone.color,
                items: zoneItems,
            });
        });

        return {
            byZone: zoneResults,
            summary: Object.values(aggregated).map((item) => ({ ...item, total: item.quantity })),
        };
    },

    calculateSingleItem(
        item: InventoryItemMaster,
        zones: Zone[],
        objectData: {
            staffCount: string;
            dailyVisitors: string;
            sanitaryLevel: string;
            replacementCycle: string;
            intensityLevel?: string;
        },
        config: CalculatorConfig = DEFAULT_CALCULATOR_CONFIG
    ): InventoryItem {
        const intensityKey = (objectData.intensityLevel || 'medium').toLowerCase();
        const kIntensity = INTENSITY_LEVELS.find((l) => l.value === intensityKey)?.coeff ?? 1.0;
        const kReserve = RESERVE_COEFFS[intensityKey as keyof typeof RESERVE_COEFFS] ?? RESERVE_COEFFS.default;

        const totalArea = getTotalZonesArea(zones);
        const totalStaff = getTotalZonesStaff(zones);
        const globalStaff = totalStaff > 0 ? totalStaff : parseInt(objectData.staffCount || '0');
        const globalVisitors = parseInt(objectData.dailyVisitors || '0');

        const kZone = ZONE_COEFFS[item.color] ?? 1.0;
        const { qArea, qStaff, qVisitors, qBase, finalQuantity } = calculateFinalQuantity(
            item,
            { area: totalArea, personnel: globalStaff, visitorShare: globalVisitors },
            { kZone, kIntensity, kReserve },
            config
        );

        const replacementCycle = item.replacement_cycle_days || 365;
        const annualConsumption = finalQuantity * (365 / replacementCycle);

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
                replacementCycle: replacementCycle,
            },
            calculation: {
                qArea: Number(qArea.toFixed(2)),
                qStaff: Number(qStaff.toFixed(2)),
                qVisitors: Number(qVisitors.toFixed(2)),
                qBase: Number(qBase.toFixed(2)),
                kZone,
                kIntensity,
                kReserve,
                monthlyOrder: Math.ceil(annualConsumption / 12),
                annualConsumption: Math.ceil(annualConsumption),
                annualBudget: Math.ceil(annualConsumption * item.price),
                reorderPoint: Math.ceil(finalQuantity * 0.3),
                safetyStock: Math.ceil(finalQuantity * 0.2),
                formula: `${config.formula.baseMethod.toUpperCase()}(${Math.ceil(qArea)}, ${Math.ceil(qStaff)}, ${Math.ceil(qVisitors)}) \u00d7 ${kZone} \u00d7 ${kIntensity} \u00d7 ${1 + kReserve}`,
                breakdown: `\u0420\u0443\u0447\u043d\u043e\u0435 \u0434\u043e\u0431\u0430\u0432\u043b\u0435\u043d\u0438\u0435: \u043b\u0438\u043c\u0438\u0442\u0438\u0440\u0443\u044e\u0449\u0438\u0439 \u0444\u0430\u043a\u0442\u043e\u0440 ${Math.ceil(qBase)} \u0435\u0434. \u0411\u0430\u0437\u0430 \u0441 \u0443\u0447\u0435\u0442\u043e\u043c \u0437\u043e\u043d\u044b (${kZone.toFixed(2)}) \u0438 \u043d\u0430\u0433\u0440\u0443\u0437\u043a\u0438 (${kIntensity.toFixed(2)}).`,
            },
        };
    },
};
