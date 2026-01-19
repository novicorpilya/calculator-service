import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useServices } from '@/app/di/ServiceContainer';
import type { Calculation, CalculationStatus, CalculationResults } from '../dashboard.types';
import { CalculationEntity } from '@/core/domain/CalculationEntity';
import { toast } from 'sonner';

/**
 * Keys for React Query Cache
 */
export const dashboardKeys = {
    all: ['calculations'] as const,
    manager: (userId: string) => [...dashboardKeys.all, 'manager', userId] as const,
    unassigned: () => [...dashboardKeys.all, 'unassigned'] as const,
    detail: (id: string | number) => [...dashboardKeys.all, 'detail', id] as const,
    paginated: (params: Record<string, unknown>) =>
        [...dashboardKeys.all, 'paginated', params] as const,
};

/**
 * Hook to fetch Manager's Projects
 */
export function useManagerWorkload(userId?: string) {
    const { calculationService } = useServices();

    return useQuery({
        queryKey: dashboardKeys.manager(userId || ''),
        queryFn: async () => {
            const result = await calculationService.getManagerWorkload(userId!);
            if (!result.success) throw new Error(result.error?.message);
            return result.data;
        },
        enabled: !!userId,
        staleTime: 1000 * 60 * 2, // 2 minutes
    });
}

/**
 * Hook to fetch Unassigned Leads
 */
export function useUnassignedLeads() {
    const { calculationService } = useServices();

    return useQuery({
        queryKey: dashboardKeys.unassigned(),
        queryFn: async () => {
            const result = await calculationService.getUnassigned();
            if (!result.success) throw new Error(result.error?.message);
            return result.data;
        },
        staleTime: 1000 * 30, // 30 seconds
    });
}

/**
 * Hook to fetch a single calculation by ID
 */
export function useCalculation(id: string | number | null) {
    const { calculationService } = useServices();

    return useQuery({
        queryKey: dashboardKeys.detail(id!),
        queryFn: async () => {
            const result = await calculationService.getCalculation(id!);
            if (!result.success) throw new Error(result.error?.message);
            return result.data;
        },
        enabled: !!id,
    });
}

/**
 * Hook for Calculation Actions
 */
export function useCalculationActions() {
    const { calculationService, chatService } = useServices();
    const queryClient = useQueryClient();

    const updateStatus = useMutation({
        mutationFn: async ({
            id,
            status,
            updates,
        }: {
            id: string | number;
            status: CalculationStatus;
            updates?: Partial<Calculation>;
        }) => {
            // Business Logic Validation
            const currentResult = await calculationService.getCalculation(id);
            if (!currentResult.success) throw new Error(currentResult.error?.message);
            const current = currentResult.data!;

            const entity = new CalculationEntity(current);

            if (current.status !== status && !entity.canTransitionTo(status)) {
                throw new Error(`Невозможно перевести статус из "${current.status}" в "${status}"`);
            }

            const result = await calculationService.update(id, { status, ...updates });
            if (!result.success) throw new Error(result.error?.message);

            // Side Effects
            const syncRes = await chatService.sendSyncSignal(id, 'UPDATE');
            if (!syncRes.success) {
                // Log but don't fail the whole operation if sync fails
                console.warn('Real-time sync signal failed', syncRes.error);
            }

            return { result: result.data, id, status };
        },
        onSuccess: ({ result, id }) => {
            // Invalidate and update cache to ensure UI gets fresh data
            queryClient.invalidateQueries({ queryKey: dashboardKeys.all });
            queryClient.setQueryData(dashboardKeys.detail(id), result);
        },
        onError: (err: unknown) => {
            // ... (keep error handling as is) ...
            toast.error(err instanceof Error ? err.message : 'Ошибка обновления статуса');
        },
    });

    const assignToMe = useMutation({
        mutationFn: async ({ id, managerId }: { id: string | number; managerId: string }) => {
            const result = await calculationService.assignToMe(id, managerId);
            if (!result.success) throw new Error(result.error?.message);
            const syncRes = await chatService.sendSyncSignal(id, 'UPDATE');
            if (!syncRes.success) console.warn('Real-time sync signal failed', syncRes.error);
            return result.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: dashboardKeys.all });
        },
        onError: (err: unknown) => {
            toast.error(err instanceof Error ? err.message : 'Ошибка назначения');
        },
    });

    const adjustExpert = useMutation({
        mutationFn: async ({
            id,
            results,
            adjustments,
            version,
        }: {
            id: string | number;
            results: CalculationResults;
            adjustments: Record<string, unknown>;
            version: number;
        }) => {
            const result = await calculationService.adjustExpert(id, results, adjustments, version);
            if (!result.success) throw new Error(result.error?.message);
            const syncRes = await chatService.sendSyncSignal(id, 'UPDATE');
            if (!syncRes.success) console.warn('Real-time sync signal failed', syncRes.error);
            return result.data;
        },
        onSuccess: (result, variables) => {
            // Invalidate and update cache to ensure UI gets fresh data
            queryClient.invalidateQueries({ queryKey: dashboardKeys.detail(variables.id) });
            queryClient.setQueryData(dashboardKeys.detail(variables.id), result);
        },
        onError: (err: unknown) => {
            const error = err as { message?: string };
            if (error?.message?.includes('CONCURRENCY_CONFLICT')) {
                toast.error(
                    'Конфликт версий: расчет был изменен другим менеджером. Пожалуйста, обновите страницу.'
                );
            } else {
                toast.error(err instanceof Error ? err.message : 'Ошибка при сохранении правок');
            }
        },
    });

    return {
        updateStatus,
        assignToMe,
        adjustExpert,
    };
}
