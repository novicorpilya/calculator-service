import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { useServices } from '@/core/di/ServiceContainer';
import type { InventoryItemMaster } from '@/services/inventory.service';
import type { CalculationEntity } from '@/core/domain/CalculationEntity';
import type { CalculationStatus, CalculationResults } from '../dashboard.types';
import { logger } from '@/core/utils/logger';

interface UseProductSelectionProps {
    user: { role?: string } | null;
    entity: CalculationEntity;
    onUpdateStatus: (id: number | string, status: CalculationStatus, additional?: { results?: CalculationResults }) => void;
}

export function useProductSelection({ user, entity, onUpdateStatus }: UseProductSelectionProps) {
    const { inventoryService } = useServices();

    // State
    const [isAuditMode, setIsAuditMode] = useState(false);
    const [auditItemIndex, setAuditItemIndex] = useState<number | null>(null);
    const [catalog, setCatalog] = useState<InventoryItemMaster[]>([]);

    // Fetch catalog for managers/admins
    useEffect(() => {
        if (user?.role === 'manager' || user?.role === 'admin') {
            inventoryService.getGlobalItems()
                .then(setCatalog)
                .catch(error => {
                    logger.error('Failed to load inventory catalog', error, {
                        role: user.role,
                        userId: (user as any)?.id // Attempt to log ID if available
                    });
                });
        }
    }, [user, inventoryService]);

    const handleProductSelect = async (master: InventoryItemMaster) => {
        if (auditItemIndex === null || !entity.results) return;

        try {
            const newResults = JSON.parse(JSON.stringify(entity.results));
            const oldItem = newResults.summary[auditItemIndex];

            // Update summary item
            newResults.summary[auditItemIndex] = {
                ...oldItem,
                inventory: master.name,
                sku: master.sku,
                price: master.price,
                supplier_id: master.supplier_id,
                stock: master.stock
            };

            // Update byZone items
            newResults.byZone.forEach((zone: any) => {
                zone.items.forEach((item: any) => {
                    if (item.inventory === oldItem.inventory && item.sku === oldItem.sku) {
                        item.inventory = master.name;
                        item.sku = master.sku;
                        item.price = master.price;
                        item.supplier_id = master.supplier_id;
                        item.stock = master.stock;
                    }
                });
            });

            onUpdateStatus(entity.id, entity.status, { results: newResults });
            setAuditItemIndex(null);
            toast.success(`Товар заменен на ${master.name}`);
        } catch (error) {
            logger.error('Failed to swap product in calculation', error, {
                calculationId: entity.id,
                targetIndex: auditItemIndex,
                masterSku: master.sku
            });
            toast.error('Ошибка замены товара');
        }
    };

    return {
        isAuditMode,
        setIsAuditMode,
        auditItemIndex,
        setAuditItemIndex,
        catalog,
        handleProductSelect
    };
}
