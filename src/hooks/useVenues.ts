import { useQuery } from '@tanstack/react-query';
import { useServices } from '@/core/di/ServiceContainer';
import { type Venue } from '@/services/venue.service';

export function useVenues() {
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
    });
}
