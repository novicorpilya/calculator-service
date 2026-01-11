import { useState, useEffect } from 'react';
import { type Calculation, type CalculationResults, type Zone, ZONE_TYPES } from '@/features/dashboard/dashboard.types';
import { venueService, inventoryService, logger } from '@/app/services';
import type { Venue } from '@/services/venue.service';
import type { InventoryItemMaster } from '@/services/inventory.service';
import { toast } from 'sonner';
import { CalculationEngine } from '@/utils/calculation-engine';

export interface ObjectData {
    name: string;
    type: string;
    totalArea: string;
    staffCount: string;
    dailyVisitors: string;
    sanitaryLevel: string;
    intensityLevel: string;
    replacementCycle: string;
}

export const useCalculationWizard = (initialData?: Calculation) => {
    const [step, setStep] = useState(1);
    const [isLoadingData, setIsLoadingData] = useState(false);

    // Step 1 State: Object Characteristics
    const [objectData, setObjectData] = useState<ObjectData>({
        name: initialData?.organizationName || '',
        type: initialData?.type || '',
        totalArea: initialData?.totalArea?.toString() || '',
        staffCount: initialData?.staffCount?.toString() || '',
        dailyVisitors: initialData?.dailyVisitors?.toString() || '',
        sanitaryLevel: initialData?.sanitaryLevel || 'medium',
        intensityLevel: initialData?.intensityLevel || 'medium',
        replacementCycle: initialData?.replacementCycle || 'weekly'
    });

    // Step 2 State: Zones
    const [zones, setZones] = useState<Zone[]>(initialData?.zoneDetails || []);
    const [showZoneModal, setShowZoneModal] = useState(false);

    // Step 3 State: Results
    const [results, setResults] = useState<CalculationResults | null>(initialData?.results || null);

    // Reference Data
    const [venues, setVenues] = useState<Venue[]>([]);
    const [globalInventory, setGlobalInventory] = useState<InventoryItemMaster[]>([]);

    useEffect(() => {
        const fetchRefData = async () => {
            setIsLoadingData(true);
            try {
                const [vData, iData] = await Promise.all([
                    venueService.getVenues(),
                    inventoryService.getGlobalItems()
                ]);
                setVenues(vData);
                setGlobalInventory(iData.data);
            } catch (e) {
                logger.error('Failed to load wizard data', { error: e });
            } finally {
                setIsLoadingData(false);
            }
        };
        fetchRefData();
    }, []);

    // Effect: Update if initialData changes (Edit Mode)
    useEffect(() => {
        if (initialData) {
            setObjectData({
                name: initialData.organizationName,
                type: initialData.type || '',
                totalArea: initialData.totalArea.toString(),
                staffCount: initialData.staffCount.toString(),
                dailyVisitors: initialData.dailyVisitors.toString(),
                sanitaryLevel: initialData.sanitaryLevel,
                intensityLevel: initialData.intensityLevel || 'medium',
                replacementCycle: initialData.replacementCycle
            });
            setZones(initialData.zoneDetails || []);
            setResults(initialData.results);
            setStep(2); // Jump to step 2 if editing
        }
    }, [initialData]);

    const handleVenueSelect = (venueId: string) => {
        const selectedVenue = venues.find(v => v.id === venueId);
        if (selectedVenue) {
            setObjectData(prev => ({
                ...prev,
                name: selectedVenue.name,
                type: selectedVenue.type,
                totalArea: selectedVenue.total_area.toString(),
                staffCount: selectedVenue.staff_count.toString(),
                dailyVisitors: selectedVenue.visitors_per_day.toString()
            }));
            toast.success(`Данные подтянуты из объекта "${selectedVenue.name}"`);
        }
    };

    const addZone = (zone: Partial<Zone> & { type: string, area: string, color: string }) => {
        const zoneName = ZONE_TYPES.find(t => t.value === zone.type)?.label || '';
        const newZone: Zone = {
            id: Date.now(), // Temp ID
            name: zoneName,
            staffCount: zone.staffCount || '0',
            ...zone
        } as Zone;

        setZones(prev => [...prev, newZone]);
        setShowZoneModal(false);
    };

    const deleteZone = (id: string | number) => {
        setZones(prev => prev.filter(z => z.id !== id));
    };

    const calculate = () => {
        const calculationResults = CalculationEngine.calculateInventory(zones, objectData, globalInventory);
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
        setShowZoneModal
    };
};
