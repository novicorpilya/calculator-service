import { useQuery } from '@tanstack/react-query';
import { useServices } from '@/core/di/ServiceContainer';
import { type InventoryItemMaster, type InventoryPaginatedResult } from '@/services/inventory.service';

interface InventoryParams {
    page: number;
    pageSize: number;
    search?: string;
    supplierId?: string;
    category?: string;
}

export function useGlobalInventory(params: InventoryParams) {
    const { inventoryService } = useServices();

    return useQuery<InventoryPaginatedResult<InventoryItemMaster>>({
        queryKey: ['inventory', 'global', params],
        queryFn: async () => {
            const result = await inventoryService.getGlobalItems({
                page: params.page,
                pageSize: params.pageSize,
                search: params.search,
                supplierId: params.supplierId === 'all' ? undefined : params.supplierId,
                category: params.category === 'all' ? undefined : params.category
            });

            if (!result.success || !result.data) {
                throw new Error(result.error?.message || 'Failed to load inventory');
            }

            return result.data;
        },
        staleTime: 1000 * 60 * 5, // 5 minutes
    });
}
