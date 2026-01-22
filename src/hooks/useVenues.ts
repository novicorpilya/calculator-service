import { useQuery, type UseQueryOptions } from '@tanstack/react-query';
import { useServices } from '@/app/di/ServiceContainer';
import { type Venue } from '@/services/venue.service';

export function useVenues(options?: Partial<UseQueryOptions<Venue[]>>) {
    const { venueService } = useServices();

    return useQuery<Venue[]>({
        queryKey: ['venues'],
        queryFn: async () => {
            const result = await venueService.getVenues();
            if (!result.success || !result.data) {
                throw new Error(result.error?.message || 'Failed to load venues');
            }
            return result.data;
        },
        staleTime: 1000 * 60 * 30, // 30 minutes
        ...options,
    });
}
