import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { calculationService, chatService } from '@/app/services';
import type { Calculation, CalculationStatus } from '../dashboard.types';
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
    paginated: (params: Record<string, any>) => [...dashboardKeys.all, 'paginated', params] as const,
};

/**
 * Hook to fetch Manager's Projects
 */
export function useManagerWorkload(userId?: string) {
    return useQuery({
        queryKey: dashboardKeys.manager(userId || ''),
        queryFn: () => calculationService.getManagerWorkload(userId!),
        enabled: !!userId,
        staleTime: 1000 * 60 * 2, // 2 minutes
    });
}

/**
 * Hook to fetch Unassigned Leads
 */
export function useUnassignedLeads() {
    return useQuery({
        queryKey: dashboardKeys.unassigned(),
        queryFn: () => calculationService.getUnassigned(),
        staleTime: 1000 * 30, // 30 seconds
    });
}

/**
 * Hook to fetch a single calculation by ID
 */
export function useCalculation(id: string | number | null) {
    return useQuery({
        queryKey: dashboardKeys.detail(id!),
        queryFn: () => calculationService.getCalculation(id!),
        enabled: !!id,
    });
}

/**
 * Hook for Calculation Actions
 */
export function useCalculationActions() {
    const queryClient = useQueryClient();

    const updateStatus = useMutation({
        mutationFn: async ({ id, status, updates }: { id: string | number; status: CalculationStatus; updates?: Partial<Calculation> }) => {
            // Business Logic Validation
            const current = await calculationService.getCalculation(id);
            const entity = new CalculationEntity(current);

            if (current.status !== status && !entity.canTransitionTo(status)) {
                throw new Error(`Невозможно перевести статус из "${current.status}" в "${status}"`);
            }

            const result = await calculationService.update(id, { status, ...updates });

            // Side Effects
            await chatService.sendSyncSignal(id, 'UPDATE');

            return { result, id, status };
        },
        onSuccess: ({ result, id, status }) => {
            // Update Cache Optimistically or Refetch
            queryClient.invalidateQueries({ queryKey: dashboardKeys.all });
            queryClient.setQueryData(dashboardKeys.detail(id), result);
            toast.success(`Статус обновлен: ${status}`);
        },
        onError: (err: unknown) => {
            // Parse PostgreSQL errors from Supabase
            const error = err as { code?: string; message?: string; details?: string };

            // Check for constraint violation (from server-side triggers)
            if (error.code === '23514' || error.message?.includes('Invalid status transition')) {
                toast.error('Недопустимый переход статуса. Операция отклонена сервером.');
                return;
            }

            // Check for check constraint violation
            if (error.code === 'PGRST116' || error.code === '23503') {
                toast.error('Ошибка валидации данных на сервере.');
                return;
            }

            // Default error handling
            toast.error(err instanceof Error ? err.message : 'Ошибка обновления статуса');
        }
    });

    const assignToMe = useMutation({
        mutationFn: async ({ id, managerId }: { id: string | number; managerId: string }) => {
            const result = await calculationService.assignToMe(id, managerId);
            await chatService.sendSyncSignal(id, 'UPDATE');
            return result;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: dashboardKeys.all });
            toast.success('Проект взят в работу');
        },
        onError: (err: unknown) => {
            toast.error(err instanceof Error ? err.message : 'Ошибка назначения');
        }
    });

    const adjustExpert = useMutation({
        mutationFn: async ({ id, results, adjustments, version }: { id: string | number; results: any; adjustments: any; version: number }) => {
            const result = await calculationService.adjustExpert(id, results, adjustments, version);
            await chatService.sendSyncSignal(id, 'UPDATE');
            return result;
        },
        onSuccess: (result, variables) => {
            queryClient.setQueryData(dashboardKeys.detail(variables.id), result);
            toast.success('Расчет успешно скорректирован');
        },
        onError: (err: any) => {
            if (err?.code === 'CONCURRENCY_CONFLICT') {
                toast.error('Конфликт версий: расчет был изменен другим менеджером. Пожалуйста, обновите страницу.');
            } else {
                toast.error(err instanceof Error ? err.message : 'Ошибка при сохранении правок');
            }
        }
    });

    return {
        updateStatus,
        assignToMe,
        adjustExpert
    };
}
