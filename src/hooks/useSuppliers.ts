import { useQuery } from '@tanstack/react-query';
import { useServices } from '@/app/di/ServiceContainer';
import { type Supplier } from '@/features/dashboard/dashboard.types';

export function useSuppliers() {
    const { supplierService } = useServices();

    return useQuery<Supplier[]>({
        queryKey: ['suppliers'],
        queryFn: async () => {
            const result = await supplierService.getSuppliers();
            if (!result.success || !result.data) {
                throw new Error(result.error?.message || 'Failed to load suppliers');
            }
            return result.data;
        },
        staleTime: 1000 * 60 * 30, // 30 minutes
    });
}
