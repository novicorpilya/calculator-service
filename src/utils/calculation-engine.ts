import {
    type Zone,
    type InventoryItem,
    type CalculationResults,
    type ZoneResult,
    SANITARY_LEVELS,
    REPLACEMENT_CYCLES
} from '../features/dashboard/dashboard.types';
import { type InventoryItemMaster } from '../services/inventory.service';

/**
 * CalculationEngine v2.0
 * Specialized engine for HoReCa inventory forecasting.
 * Provides normalized calculations based on area, personnel, and visitor intensity.
 */
export const CalculationEngine = {
    /**
     * Performs a comprehensive inventory calculation for multiple zones.
     * @param zones List of individual zones with their parameters.
     * @param objectData Global object parameters (sanitary level, replacement cycle).
     * @param globalInventory Master catalog of inventory items with norms.
     */
    calculateInventory(
        zones: Zone[],
        objectData: { staffCount: string; dailyVisitors: string; sanitaryLevel: string; replacementCycle: string },
        globalInventory: InventoryItemMaster[]
    ): CalculationResults {
        const zoneResults: ZoneResult[] = [];
        const aggregated: Record<string, InventoryItem> = {};

        const sanitaryCoeff = SANITARY_LEVELS.find(l => l.value === objectData.sanitaryLevel)?.coeff || 1.3;
        const replacementCoeff = REPLACEMENT_CYCLES.find(c => c.value === objectData.replacementCycle)?.coeff || 0.3;

        const totalZonesStaff = zones.reduce((sum, zone) => sum + parseInt(zone.staffCount || '0'), 0);
        const totalPersonnel = zones.length > 0 ? totalZonesStaff : parseInt(objectData.staffCount || '0');
        const totalVisitors = parseInt(objectData.dailyVisitors || '0');

        zones.forEach(zone => {
            const zoneItems: InventoryItem[] = [];
            const zonePersonnel = parseInt(zone.staffCount || '0');
            const zoneArea = parseFloat(zone.area || '0');

            // Распределение посетителей пропорционально персоналу в зоне
            const zoneVisitorShare = totalPersonnel > 0
                ? totalVisitors * (zonePersonnel / totalPersonnel)
                : 0;

            globalInventory.forEach(item => {
                if (item.color === zone.color) {
                    // Расчет по 3 параметрам из БД норм
                    const quantityByArea = (zoneArea / 100) * item.norm_area;
                    const quantityByPersonnel = zonePersonnel * item.norm_personnel;
                    const quantityByIntensity = (zoneVisitorShare / 100) * item.norm_intensity;

                    const baseQuantity = quantityByArea + quantityByPersonnel + quantityByIntensity;

                    // Применение коэффициентов санитарии и цикла замены
                    const totalQuantity = baseQuantity * sanitaryCoeff * replacementCoeff;

                    // Округление и минимальные значения (1 шт если есть площадь или персонал)
                    const minQuantity = (item.norm_personnel > 0 || item.norm_area > 0) ? 1 : 0;
                    const finalQuantity = Math.max(Math.ceil(totalQuantity), minQuantity);

                    if (finalQuantity > 0) {
                        const newItem: InventoryItem = {
                            inventory: item.name,
                            color: item.color,
                            quantity: finalQuantity,
                            price: item.price,
                            total: finalQuantity * item.price,
                            norms: {
                                area: item.norm_area,
                                personnel: item.norm_personnel,
                                intensity: item.norm_intensity
                            }
                        };

                        zoneItems.push(newItem);

                        const key = `${item.name}-${item.color}`;
                        if (!aggregated[key]) {
                            aggregated[key] = { ...newItem, quantity: 0, total: 0 };
                        }
                        aggregated[key].quantity += finalQuantity;
                        aggregated[key].total += (finalQuantity * item.price);
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
            summary: Object.values(aggregated)
        };
    }
};
