import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { useServices } from '@/core/di/ServiceContainer';
import type { InventoryItemMaster } from '@/services/inventory.service';
import type { CalculationEntity } from '@/core/domain/CalculationEntity';
import type {
    CalculationStatus,
    CalculationResults,
    ZoneResult,
    InventoryItem,
} from '../dashboard.types';
import { logger } from '@/core/logging';
import { CalculationEngine } from '@/utils/calculation-engine';
import { useCalculatorConfig } from '@/features/calculator/useCalculatorConfig';
import { type CalculatorConfig } from '@/features/calculator/calculator-config.types';

interface UseProductSelectionProps {
    user: { id?: string; role?: string } | null;
    entity: CalculationEntity;
    onUpdateStatus: (
        id: number | string,
        status: CalculationStatus,
        additional?: { results?: CalculationResults }
    ) => void;
    onAdjustExpert?: (
        id: string | number,
        results: CalculationResults,
        adjustments: Record<string, unknown>,
        version: number
    ) => Promise<void>;
}

export function useProductSelection({
    user,
    entity,
    onUpdateStatus,
    onAdjustExpert,
}: UseProductSelectionProps) {
    const { inventoryService } = useServices();
    const { config } = useCalculatorConfig();

    // State
    const [isAuditMode, setIsAuditMode] = useState(false);
    const [auditItemIndex, setAuditItemIndex] = useState<number | null>(null);
    const [catalog, setCatalog] = useState<InventoryItemMaster[]>([]);

    // Fetch catalog for managers/admins
    useEffect(() => {
        if (user?.role === 'manager' || user?.role === 'admin') {
            inventoryService
                .getGlobalItems({ pageSize: 100 })
                .then((res) => {
                    if (res.success && res.data) {
                        setCatalog(res.data.data); // Extract array from paginated result
                    } else {
                        logger.warn('Failed to load inventory catalog', { error: res.error });
                        setCatalog([]);
                    }
                })
                .catch((error) => {
                    logger.error(
                        'Failed to load inventory catalog',
                        {
                            role: user.role,
                            userId: user?.id,
                        },
                        error
                    );
                    setCatalog([]);
                });
        }
    }, [user, inventoryService]);

    const handleProductSelect = async (master: InventoryItemMaster) => {
        if (auditItemIndex === null || !entity.results) return;

        try {
            const newResults = structuredClone(entity.results);
            const oldItem = newResults.summary[auditItemIndex];

            // Use core engine to calculate correct demand for the replacement product
            const calculatedItem = CalculationEngine.calculateSingleItem(
                master,
                entity.rawData.zoneDetails || [],
                {
                    staffCount: String(entity.staffCount),
                    dailyVisitors: String(entity.dailyVisitors),
                    sanitaryLevel: entity.sanitaryLevel,
                    replacementCycle: entity.replacementCycle,
                    intensityLevel: entity.rawData.intensityLevel,
                },
                (entity.configSnapshot as unknown as CalculatorConfig) || config
            );

            // Update summary item
            newResults.summary[auditItemIndex] = calculatedItem;

            // Update byZone items (global replace logic)
            newResults.byZone.forEach((zone: ZoneResult) => {
                zone.items.forEach((item: InventoryItem, idx: number) => {
                    if (item.inventory === oldItem.inventory && item.sku === oldItem.sku) {
                        zone.items[idx] = { ...calculatedItem };
                    }
                });
            });

            if (onAdjustExpert) {
                await onAdjustExpert(
                    entity.id,
                    newResults,
                    entity.managerAdjustments,
                    entity.versionNumber
                );
            } else {
                onUpdateStatus(entity.id, entity.status, { results: newResults });
            }
            setAuditItemIndex(null);
            toast.success(`Товар заменен на ${master.name}`);
        } catch (error) {
            logger.error(
                'Failed to swap product in calculation',
                {
                    calculationId: entity.id,
                    targetIndex: auditItemIndex,
                    masterSku: master.sku,
                },
                error
            );
            toast.error('Ошибка замены товара');
        }
    };

    const handleRemoveItem = async (index: number) => {
        if (!entity.results) return;
        try {
            const newResults = structuredClone(entity.results);
            const removedItem = newResults.summary[index];
            newResults.summary.splice(index, 1);

            if (onAdjustExpert) {
                await onAdjustExpert(
                    entity.id,
                    newResults,
                    entity.managerAdjustments,
                    entity.versionNumber
                );
            } else {
                onUpdateStatus(entity.id, entity.status, { results: newResults });
            }
            toast.success(`Товар ${removedItem.inventory} удален`);
        } catch {
            toast.error('Ошибка удаления');
        }
    };

    const handleAddItem = async (master: InventoryItemMaster) => {
        if (!entity.results) return;

        // Use core engine to calculate demand for the new item based on project metrics
        const newItem = CalculationEngine.calculateSingleItem(
            master,
            entity.rawData.zoneDetails || [],
            {
                staffCount: String(entity.staffCount),
                dailyVisitors: String(entity.dailyVisitors),
                sanitaryLevel: entity.sanitaryLevel,
                replacementCycle: entity.replacementCycle,
                intensityLevel: entity.rawData.intensityLevel,
            },
            (entity.configSnapshot as unknown as CalculatorConfig) || config
        );

        const newResults = structuredClone(entity.results);
        newResults.summary.push(newItem);

        try {
            if (onAdjustExpert) {
                await onAdjustExpert(
                    entity.id,
                    newResults,
                    entity.managerAdjustments,
                    entity.versionNumber
                );
            } else {
                onUpdateStatus(entity.id, entity.status, { results: newResults });
            }
            setAuditItemIndex(null);
            toast.success(`Добавлена позиция: ${master.name}`);
        } catch {
            toast.error('Ошибка при добавлении товара');
        }
    };

    const handleUpdateAdjustments = async (adjustments: Record<string, unknown>) => {
        if (!entity.results) return;
        try {
            if (onAdjustExpert) {
                await onAdjustExpert(entity.id, entity.results, adjustments, entity.versionNumber);
            } else {
                onUpdateStatus(entity.id, entity.status, { results: entity.results });
            }
            toast.success('Параметры обновлены');
        } catch {
            toast.error('Ошибка обновления параметров');
        }
    };

    return {
        isAuditMode,
        setIsAuditMode,
        auditItemIndex,
        setAuditItemIndex,
        catalog,
        handleProductSelect,
        handleAddItem,
        handleRemoveItem,
        handleUpdateAdjustments,
    };
}
