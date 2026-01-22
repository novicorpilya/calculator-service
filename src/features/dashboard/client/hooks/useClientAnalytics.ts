import { useQuery } from '@tanstack/react-query';
import { useServices } from '@/app/di/ServiceContainer';

export const analyticsKeys = {
    all: ['analytics'] as const,
    dashboard: (userId: string, venueId?: string) =>
        [...analyticsKeys.all, 'dashboard', userId, venueId || 'all'] as const,
};

export function useClientAnalytics(userId?: string, venueId?: string) {
    const { calculationService } = useServices();

    return useQuery({
        queryKey: analyticsKeys.dashboard(userId || '', venueId),
        queryFn: async () => {
            const result = await calculationService.getDashboardStats(userId!, venueId);
            if (!result.success) throw new Error(result.error?.message);
            return result.data;
        },
        enabled: !!userId,
        staleTime: 1000 * 60 * 5, // 5 minutes
    });
}
