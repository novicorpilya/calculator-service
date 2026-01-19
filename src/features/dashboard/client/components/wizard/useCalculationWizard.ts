import { useState } from 'react';
import {
    type Calculation,
    type CalculationResults,
    type Zone,
    ZONE_TYPES,
} from '@/features/dashboard/dashboard.types';
import { toast } from 'sonner';
import { CalculationEngine } from '@/utils/calculation-engine';
import { useVenues } from '@/hooks/useVenues';
import { useGlobalInventory } from '@/hooks/useGlobalInventory';
import { type Venue } from '@/services/venue.service';
import { useCalculatorConfig } from '@/features/calculator/useCalculatorConfig';
import { type CalculatorConfig } from '@/features/calculator/calculator-config.types';

export interface ObjectData {
    name: string;
    type: string;
    totalArea: string;
    staffCount: string;
    dailyVisitors: string;
    sanitaryLevel: string;
    intensityLevel: string;
    replacementCycle: string;
    selectedVenueId?: string;
}

export const useCalculationWizard = (initialData?: Calculation) => {
    const { config } = useCalculatorConfig();
    // React Query Hooks
    const { data: venues = [], isLoading: isLoadingVenues } = useVenues();
    const { data: inventoryData, isLoading: isLoadingInventory } = useGlobalInventory({
        page: 1,
        pageSize: 10000,
    });
    const globalInventory = inventoryData?.data || [];

    const isLoadingData = isLoadingVenues || isLoadingInventory;

    // Step 1 State: Object Characteristics
    const [objectData, setObjectData] = useState<ObjectData>({
        name: initialData?.organizationName || '',
        type: initialData?.type || '',
        totalArea: initialData?.totalArea?.toString() || '',
        staffCount: initialData?.staffCount?.toString() || '',
        dailyVisitors: initialData?.dailyVisitors?.toString() || '',
        sanitaryLevel: initialData?.sanitaryLevel || 'medium',
        intensityLevel: initialData?.intensityLevel || 'medium',
        replacementCycle: initialData?.replacementCycle || 'weekly',
        selectedVenueId: '',
    });

    // Step 2 State: Zones
    const [zones, setZones] = useState<Zone[]>(initialData?.zoneDetails || []);
    const [showZoneModal, setShowZoneModal] = useState(false);

    // Step 3 State: Results
    const [results, setResults] = useState<CalculationResults | null>(initialData?.results || null);

    const [step, setStep] = useState(initialData ? 2 : 1);

    const handleVenueSelect = (venueId: string) => {
        const selectedVenue = venues.find((v: Venue) => v.id === venueId);
        if (selectedVenue) {
            setObjectData((prev) => ({
                ...prev,
                name: selectedVenue.name,
                type: selectedVenue.type,
                totalArea: selectedVenue.total_area.toString(),
                staffCount: selectedVenue.staff_count.toString(),
                dailyVisitors: selectedVenue.visitors_per_day.toString(),
                selectedVenueId: venueId,
            }));
            toast.success(`Данные подтянуты из объекта "${selectedVenue.name}"`);
        }
    };

    const addZone = (zone: Partial<Zone> & { type: string; area: string; color: string }) => {
        const zoneName = ZONE_TYPES.find((t) => t.value === zone.type)?.label || '';
        const newZone: Zone = {
            id: Date.now(), // Temp ID
            name: zoneName,
            staffCount: zone.staffCount || '0',
            ...zone,
        } as Zone;

        setZones((prev) => [...prev, newZone]);
        setShowZoneModal(false);
    };

    const deleteZone = (id: string | number) => {
        setZones((prev) => prev.filter((z) => z.id !== id));
    };

    const calculate = () => {
        const calculationResults = CalculationEngine.calculateInventory(
            zones,
            objectData,
            globalInventory,
            (initialData?.calculator_config_snapshot as unknown as CalculatorConfig) || config
        );
        setResults(calculationResults);
        setStep(3);
    };

    return {
        step,
        setStep,
        objectData,
        setObjectData,
        zones,
        setZones,
        results,
        venues,
        isLoadingData,
        handleVenueSelect,
        addZone,
        deleteZone,
        calculate,
        showZoneModal,
        setShowZoneModal,
        config,
    };
};
