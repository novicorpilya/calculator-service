import { useState, useEffect, useMemo } from 'react';
import { type Calculation, type Zone, ZONE_TYPES } from '@/features/dashboard/dashboard.types';
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
    const globalInventory = useMemo(() => inventoryData?.data || [], [inventoryData]);

    const isLoadingData = isLoadingVenues || isLoadingInventory;

    // Step 1 State: Object Characteristics
    // Initialize from localStorage if available and no initialData provided
    const [objectData, setObjectData] = useState<ObjectData>(() => {
        if (initialData) {
            return {
                name: initialData.organizationName || '',
                type: initialData.type || '',
                totalArea: initialData.totalArea?.toString() || '',
                staffCount: initialData.staffCount?.toString() || '',
                dailyVisitors: initialData.dailyVisitors?.toString() || '',
                sanitaryLevel: initialData.sanitaryLevel || 'medium',
                intensityLevel: initialData.intensityLevel || 'medium',
                replacementCycle: initialData.replacementCycle || 'weekly',
                selectedVenueId: '',
            };
        }

        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem('calculator_draft_data');
            if (saved) {
                try {
                    return JSON.parse(saved).objectData;
                } catch (err) {
                    console.error('Failed to parse draft data', err);
                }
            }
        }

        return {
            name: '',
            type: '',
            totalArea: '',
            staffCount: '',
            dailyVisitors: '',
            sanitaryLevel: 'medium',
            intensityLevel: 'medium',
            replacementCycle: 'weekly',
            selectedVenueId: '',
        };
    });

    // Step 2 State: Zones
    const [zones, setZones] = useState<Zone[]>(() => {
        if (initialData?.zoneDetails) return initialData.zoneDetails;

        if (typeof window !== 'undefined' && !initialData) {
            const saved = localStorage.getItem('calculator_draft_data');
            if (saved) {
                try {
                    return JSON.parse(saved).zones || [];
                } catch {
                    // Ignore malformed draft data
                }
            }
        }
        return [];
    });

    const [showZoneModal, setShowZoneModal] = useState(false);

    const [step, setStep] = useState(() => {
        if (initialData) return 1; // Was 2 in 1-based, so 1 in 0-based
        if (typeof window !== 'undefined') {
            const savedStep = localStorage.getItem('calculator_draft_step');
            if (savedStep) return parseInt(savedStep, 10);
        }
        return 0; // Start at 0
    });

    // Persistence Effect
    useEffect(() => {
        if (!initialData && typeof window !== 'undefined') {
            localStorage.setItem('calculator_draft_data', JSON.stringify({ objectData, zones }));
            localStorage.setItem('calculator_draft_step', step.toString());
        }
    }, [objectData, zones, step, initialData]);

    const clearDraft = () => {
        if (typeof window !== 'undefined') {
            localStorage.removeItem('calculator_draft_data');
            localStorage.removeItem('calculator_draft_step');
        }
    };

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
                sanitaryLevel: selectedVenue.sanitary_level || 'medium',
                intensityLevel: selectedVenue.intensity_level || 'medium',
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

    // Real-time calculation using useMemo to avoid effect loops
    const results = useMemo(() => {
        if (!globalInventory.length) {
            return initialData?.results || null;
        }

        return CalculationEngine.calculateInventory(
            zones,
            objectData,
            globalInventory,
            (initialData?.calculator_config_snapshot as unknown as CalculatorConfig) || config
        );
    }, [zones, objectData, globalInventory, config, initialData]);

    const calculate = () => {
        if (results) {
            setStep(2);
        }
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
        clearDraft,
    };
};
