import { Parser } from 'npm:expr-eval';

// ==========================================
// CORE TYPES (Extracted from shared domain)
// ==========================================

export interface Zone {
    id: string;
    name: string;
    type: string;
    area: string;
    staffCount: string;
    color: string;
    priority?: 'critical' | 'standard' | 'low';
}

export interface InventoryItem {
    inventory: string;
    sku?: string;
    color: string;
    quantity: number;
    price: number;
    stock: number;
    category?: string;
    norm_area?: number;
    supplier_id?: string;
    series?: string;
    durability?: number;
    total: number;
    norms?: {
        area: number;
        personnel: number;
        intensity?: number;
        replacementCycle?: number;
    };
    calculation?: {
        qArea: number;
        qStaff: number;
        qVisitors: number;
        qBase: number;
        kZone: number;
        kIntensity: number;
        kReserve: number;
        monthlyOrder: number;
        annualConsumption: number;
        annualBudget: number;
        reorderPoint?: number;
        safetyStock?: number;
        formula?: string;
        breakdown?: string;
    };
}

export interface ZoneResult {
    zoneName: string;
    area: string;
    type: string;
    color: string;
    items: InventoryItem[];
}

export interface CalculationResults {
    byZone: ZoneResult[];
    summary: InventoryItem[];
    totalGoods: number;
    totalDelivery: number;
    totalVat: number;
    grandTotal: number;
}

export interface BudgetAllocation {
    zoneId: string;
    zoneName: string;
    idealAmount: number;
    allocatedAmount: number;
    coveragePercent: number;
    isFullyFunded: boolean;
    items: InventoryItem[];
    droppedItems: InventoryItem[];
}

export interface OptimizationResult {
    totalBudget: number;
    actualTotal: number;
    coveragePercent: number;
    allocations: BudgetAllocation[];
    estimatedTotal: number;
}

// ==========================================
// ENGINE CONFIGURATION
// ==========================================

export const INTENSITY_LEVELS = [
    { value: 'low', coeff: 0.8 },
    { value: 'medium', coeff: 1.0 },
    { value: 'high', coeff: 1.2 },
    { value: 'very_high', coeff: 1.3 },
    { value: 'critical', coeff: 1.5 },
];

export const RESERVE_COEFFS: Record<string, number> = {
    low: 0.1,
    medium: 0.15,
    high: 0.2,
    very_high: 0.2,
    critical: 0.25,
    default: 0.1,
};

export const ZONE_COEFFS: Record<string, number> = {
    '#ef4444': 1.25, // RED
    '#facc15': 1.15, // YELLOW
    '#22c55e': 1.0, // GREEN
    '#3b82f6': 0.85, // BLUE
    '#ec4899': 1.3, // PINK
    '#f97316': 1.4, // ORANGE
    '#78350f': 1.05, // BROWN
    '#f8fafc': 0.95, // WHITE
};

export type BaseMethod = 'max' | 'sum' | 'avg';

export const DEFAULT_CALCULATOR_CONFIG = {
    formula: {
        isAdvanced: false,
        customFormula: 'max(q_area, q_staff, q_visitors) * k_zone * k_intensity * (1 + k_reserve)',
        baseMethod: 'max' as BaseMethod,
        factors: { area: true, staff: true, visitors: true },
        multipliers: { zone: true, intensity: true, reserve: true },
    },
};

export interface InventoryItemMaster {
    name: string;
    sku: string;
    color: string;
    price: number;
    stock: number;
    norm_area: number;
    norm_personnel: number;
    norm_intensity: number;
    replacement_cycle_days: number;
    category?: string;
    series?: string;
    durability?: number;
    supplier_id?: string;
}

// ==========================================
// CALCULATION ENGINE
// ==========================================

export class CalculationEngine {
    static calculateInventory(
        zones: Zone[],
        objectData: {
            staffCount: string;
            dailyVisitors: string;
            intensityLevel?: string;
        },
        globalInventory: InventoryItemMaster[],
        config = DEFAULT_CALCULATOR_CONFIG
    ): CalculationResults {
        const intensityKey = (objectData.intensityLevel || 'medium').toLowerCase();
        const kIntensity = INTENSITY_LEVELS.find((l) => l.value === intensityKey)?.coeff ?? 1.0;
        const kReserve = RESERVE_COEFFS[intensityKey] ?? RESERVE_COEFFS.default;

        // --- PRE-OPTIMIZATION: Select best items by TCO (Price/Durability) ---
        const optimizedByColor: Record<string, Record<string, InventoryItemMaster>> = {};
        const getTCO = (item: InventoryItemMaster) => item.price / (item.durability || 1);
        const seriesLock: Record<string, string> = {};
        const masterCategories = ['holder', 'dispenser', 'equipment', 'tool'];

        globalInventory.forEach((item) => {
            if (!item.category) return;
            const color = this.normalizeColor(item.color);
            if (!color) return;

            if (!optimizedByColor[color]) optimizedByColor[color] = {};

            if (masterCategories.includes(item.category.toLowerCase())) {
                const currentBest = optimizedByColor[color][item.category];
                if (!currentBest || getTCO(item) < getTCO(currentBest)) {
                    optimizedByColor[color][item.category] = item;
                    if (item.series) seriesLock[color] = item.series;
                }
            }
        });

        // Second pass for series compatibility
        globalInventory.forEach((item) => {
            if (!item.category || masterCategories.includes(item.category.toLowerCase())) return;
            const color = this.normalizeColor(item.color);
            if (!color) return;

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
            ...globalInventory.filter((i) => !i.category),
            ...Object.values(optimizedByColor).flatMap((catMap) => Object.values(catMap)),
        ];

        // --- CALCULATION ---
        const totalStaff = zones.reduce((sum, z) => sum + parseInt(z.staffCount || '0'), 0);
        const globalPersonnel =
            totalStaff > 0 ? totalStaff : parseInt(objectData.staffCount || '0');
        const globalVisitors = parseInt(objectData.dailyVisitors || '0');

        const zoneResults: ZoneResult[] = [];
        const aggregated: Record<string, InventoryItem> = {};

        zones.forEach((zone) => {
            const zoneItems: InventoryItem[] = [];
            const zonePersonnel = parseInt(zone.staffCount || '0');
            const zoneArea = parseFloat(zone.area || '0');
            const zoneVisitorShare =
                globalPersonnel > 0 ? globalVisitors * (zonePersonnel / globalPersonnel) : 0;

            optimizedInventory.forEach((item) => {
                const itemColor = this.normalizeColor(item.color);
                const zoneColor = this.normalizeColor(zone.color);

                if (itemColor && zoneColor && itemColor === zoneColor) {
                    const kZone = ZONE_COEFFS[itemColor] ?? 1.0;
                    const { qArea, qStaff, qVisitors, qBase, finalQuantity } =
                        this.calculateFinalQuantity(
                            item,
                            {
                                area: zoneArea,
                                personnel: zonePersonnel,
                                visitorShare: zoneVisitorShare,
                            },
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
                            total: finalQuantity * item.price,
                            stock: item.stock,
                            norm_area: item.norm_area,
                            category: item.category,
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
                            },
                        };

                        zoneItems.push(newItem);
                        const key = `${item.name}-${item.sku || 'N/A'}-${item.color}`;
                        if (!aggregated[key]) {
                            aggregated[key] = {
                                ...newItem,
                                quantity: 0,
                                total: 0,
                                calculation: {
                                    ...newItem.calculation!,
                                    annualConsumption: 0,
                                    annualBudget: 0,
                                    monthlyOrder: 0,
                                },
                            };
                        }

                        aggregated[key].quantity += finalQuantity;
                        aggregated[key].total += finalQuantity * item.price;
                        if (aggregated[key].calculation) {
                            aggregated[key].calculation!.annualConsumption += annualConsumption;
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

        const summary = Object.values(aggregated).map((item) => {
            if (item.calculation) {
                const cal = item.calculation;
                cal.annualConsumption = Math.ceil(cal.annualConsumption);
                cal.annualBudget = Math.ceil(cal.annualConsumption * item.price);
                cal.monthlyOrder = Math.ceil(cal.annualConsumption / 12);
            }
            return item;
        });

        const totalGoods = summary.reduce((acc, item) => acc + (item.total || 0), 0);
        const baseDelivery = 2500;
        const variableDelivery = totalGoods * 0.02;
        const totalDelivery =
            totalGoods > 0 ? Math.max(3000, Math.ceil(baseDelivery + variableDelivery)) : 0;
        const totalVat = Math.ceil((totalGoods + totalDelivery) * 0.2);
        const grandTotal = totalGoods + totalDelivery + totalVat;

        return {
            byZone: zoneResults,
            summary,
            totalGoods,
            totalDelivery,
            totalVat,
            grandTotal,
        };
    }

    private static calculateFinalQuantity(
        item: InventoryItemMaster,
        metrics: { area: number; personnel: number; visitorShare: number },
        coeffs: { kZone: number; kIntensity: number; kReserve: number },
        config: typeof DEFAULT_CALCULATOR_CONFIG
    ) {
        const FACTORS = config.formula.factors;
        const qArea = FACTORS.area ? (metrics.area / 100) * (item.norm_area || 0) : 0;
        const qStaff = FACTORS.staff ? metrics.personnel * (item.norm_personnel || 0) : 0;
        const qVisitors = FACTORS.visitors
            ? (metrics.visitorShare / 100) * (item.norm_intensity || 0)
            : 0;

        let total = 0;

        if (config.formula.isAdvanced && config.formula.customFormula) {
            try {
                const parser = new Parser();
                const expr = parser.parse(config.formula.customFormula);
                const result = expr.evaluate({
                    q_area: qArea,
                    q_staff: qStaff,
                    q_visitors: qVisitors,
                    k_zone: coeffs.kZone,
                    k_intensity: coeffs.kIntensity,
                    k_reserve: coeffs.kReserve,
                });
                if (typeof result === 'number' && !isNaN(result)) total = result;
            } catch (e) {
                console.error('Formula error:', e);
            }
        }

        if (!total) {
            const activeValues = [qArea, qStaff, qVisitors].filter((v) => v > 0);
            let qBase = 0;
            switch (config.formula.baseMethod) {
                case 'sum':
                    qBase = qArea + qStaff + qVisitors;
                    break;
                case 'avg':
                    qBase = activeValues.length
                        ? (qArea + qStaff + qVisitors) / activeValues.length
                        : 0;
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
            if (MULTIPLIERS.reserve) total *= 1 + coeffs.kReserve;
        }

        const hasNorm = (item.norm_personnel || 0) > 0 || (item.norm_area || 0) > 0;
        const minQuantity = hasNorm ? 1 : 0;
        const finalQuantity = Math.max(Math.ceil(total), minQuantity);

        return {
            qArea,
            qStaff,
            qVisitors,
            qBase: Math.max(qArea, qStaff, qVisitors),
            finalQuantity,
        };
    }

    private static normalizeColor(c: string) {
        if (!c) return '';
        const clean = c.trim().toLowerCase().replace('#', '');
        const COLOR_MAP: Record<string, string> = {
            red: 'ef4444',
            yellow: 'facc15',
            green: '22c55e',
            blue: '3b82f6',
            pink: 'ec4899',
            orange: 'f97316',
            brown: '78350f',
            white: 'f8fafc',
            ffffff: 'f8fafc',
            fff: 'f8fafc',
            ffff00: 'facc15',
            ff0: 'facc15',
        };
        if (COLOR_MAP[clean]) return `#${COLOR_MAP[clean]}`;
        return clean ? `#${clean}` : '';
    }
}

// ==========================================
// BUDGET ENGINE (Optimization Logic)
// ==========================================

export class BudgetEngine {
    static optimize(
        totalBudget: number,
        zones: Zone[],
        inventory: InventoryItemMaster[],
        objectData: {
            staffCount: string;
            dailyVisitors: string;
            intensityLevel?: string;
        }
    ): OptimizationResult {
        const fullResults = CalculationEngine.calculateInventory(zones, objectData, inventory);

        const priorityOrder: ('critical' | 'standard' | 'low')[] = ['critical', 'standard', 'low'];
        const sortedZones = [...zones].sort((a, b) => {
            const pA = a.priority || 'standard';
            const pB = b.priority || 'standard';
            return priorityOrder.indexOf(pA) - priorityOrder.indexOf(pB);
        });

        let remainingBudget = totalBudget;
        const allocations: BudgetAllocation[] = [];

        sortedZones.forEach((zone) => {
            const ideal = fullResults.byZone.find((zr) => zr.zoneName === zone.name);
            if (!ideal) return;

            const idealZoneCost = ideal.items.reduce((sum, item) => sum + (item.total || 0), 0);
            let allocatedItems: InventoryItem[] = [];
            let droppedItems: InventoryItem[] = [];
            let allocatedAmount = 0;

            if (remainingBudget >= idealZoneCost) {
                allocatedItems = [...ideal.items];
                allocatedAmount = idealZoneCost;
                remainingBudget -= idealZoneCost;
            } else if (remainingBudget > 0) {
                const { funded, dropped } = this.applyEssentialStrategy(
                    ideal.items,
                    remainingBudget
                );
                allocatedItems = funded;
                droppedItems = dropped;
                allocatedAmount = funded.reduce((sum, item) => sum + (item.total || 0), 0);
                remainingBudget -= allocatedAmount;
            } else {
                droppedItems = [...ideal.items];
            }

            allocations.push({
                zoneId: zone.id,
                zoneName: zone.name,
                idealAmount: idealZoneCost,
                allocatedAmount,
                coveragePercent: idealZoneCost > 0 ? (allocatedAmount / idealZoneCost) * 100 : 100,
                isFullyFunded: allocatedAmount >= idealZoneCost,
                items: allocatedItems,
                droppedItems: droppedItems,
            });
        });

        const actualTotal = allocations.reduce((sum, a) => sum + a.allocatedAmount, 0);

        return {
            totalBudget,
            actualTotal,
            coveragePercent:
                (fullResults.grandTotal || 0) > 0
                    ? (actualTotal / (fullResults.grandTotal || 0)) * 100
                    : 100,
            allocations,
            estimatedTotal: actualTotal,
        };
    }

    private static applyEssentialStrategy(items: InventoryItem[], budget: number) {
        const categoryPriority = (cat: string = '') => {
            const c = cat.toLowerCase();
            if (c.includes('систем') || c.includes('оборуд') || c.includes('диспенс')) return 1;
            if (c.includes('инвентар') || c.includes('инструм')) return 2;
            return 3;
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
}
