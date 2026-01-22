import { useState, useCallback, useMemo } from 'react';
import { type ZoneWithPriority, type PriorityLevel } from '@/core/domain/budget/budget.types';
import { BudgetEngine, type ObjectData } from '@/core/domain/budget/BudgetEngine';
import { useGlobalInventory } from '@/hooks/useGlobalInventory';
import { useCalculatorConfig } from '@/features/calculator/useCalculatorConfig';
import { ZONE_TYPES } from '@/features/dashboard/dashboard.types';

export interface BudgetObjectData {
    type: string;
    staffCount: string;
    dailyVisitors: string;
    sanitaryLevel: string;
    intensityLevel: string;
    replacementCycle: string;
    totalArea: string;
    selectedVenueId?: string;
}

export const useBudgetPlanner = () => {
    const { config } = useCalculatorConfig();
    const { data: inventoryData } = useGlobalInventory({ page: 1, pageSize: 10000 });
    const inventory = useMemo(() => inventoryData?.data || [], [inventoryData]);

    const [step, setStep] = useState(0);
    const [budget, setBudget] = useState<number>(0);
    const [objectData, setObjectData] = useState<BudgetObjectData>({
        type: '',
        staffCount: '',
        dailyVisitors: '',
        sanitaryLevel: 'medium',
        intensityLevel: 'medium',
        replacementCycle: 'weekly',
        totalArea: '',
        selectedVenueId: '',
    });

    const [zones, setZones] = useState<ZoneWithPriority[]>([]);

    // Deriving the plan
    const plan = useMemo(() => {
        if (!budget || zones.length === 0 || inventory.length === 0) return null;
        return BudgetEngine.optimize(
            budget,
            zones,
            inventory,
            objectData as unknown as ObjectData,
            config
        );
    }, [budget, zones, inventory, objectData, config]);

    const addZone = useCallback((type: string) => {
        const zoneType = ZONE_TYPES.find((t) => t.value === type);
        const newZone: ZoneWithPriority = {
            id: String(Date.now()),
            name: zoneType?.label || 'Новая зона',
            type,
            area: '',
            staffCount: '',
            color: zoneType?.color || '#ccc',
            priority: 'standard',
        };
        setZones((prev) => [...prev, newZone]);
    }, []);

    const updateZonePriority = useCallback((id: string | number, priority: PriorityLevel) => {
        setZones((prev) => prev.map((z) => (z.id === id ? { ...z, priority } : z)));
    }, []);

    const updateZoneArea = useCallback((id: string | number, area: string) => {
        setZones((prev) => prev.map((z) => (z.id === id ? { ...z, area } : z)));
    }, []);

    const removeZone = useCallback((id: string | number) => {
        setZones((prev) => prev.filter((z) => z.id !== id));
    }, []);

    return {
        step,
        setStep,
        budget,
        setBudget,
        objectData,
        setObjectData,
        zones,
        addZone,
        updateZonePriority,
        updateZoneArea,
        removeZone,
        plan,
        isInventoryLoading: !inventoryData,
    };
};
