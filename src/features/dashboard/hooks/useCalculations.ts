import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useServices } from '@/app/di/ServiceContainer';
import type { Calculation, CalculationStatus, CalculationResults } from '@/core/types/calculation';
import { toast } from 'sonner';

/**
 * Keys for React Query Cache
 */
export const dashboardKeys = {
    all: ['calculations'] as const,
    manager: (userId: string) => [...dashboardKeys.all, 'manager', userId] as const,
    unassigned: () => [...dashboardKeys.all, 'unassigned'] as const,
    detail: (id: string | number) => [...dashboardKeys.all, 'detail', id] as const,
    mine: (userId: string) => [...dashboardKeys.all, 'mine', userId] as const,
    paginated: (params: Record<string, unknown>) =>
        [...dashboardKeys.all, 'paginated', params] as const,
};

/**
 * Hook to fetch My Calculations (Client)
 */
export function useMyCalculations(userId?: string) {
    const { calculationService } = useServices();

    return useQuery({
        queryKey: dashboardKeys.mine(userId || ''),
        queryFn: async () => {
            const result = await calculationService.getMyCalculations(userId!);
            if (!result.success) throw new Error(result.error?.message);
            return result.data || [];
        },
        enabled: !!userId,
    });
}

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
 * Hook for Calculation Actions (Orchestration handled by Service)
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
            const result = await calculationService.update(id, { status, ...updates });
            if (!result.success) throw new Error(result.error?.message);

            // Signal other users via Realtime (Infrastructure concerns)
            await chatService.sendSyncSignal(id, 'UPDATE');
            return result.data;
        },
        onSuccess: (result, variables) => {
            // Precise cache update
            queryClient.setQueryData(dashboardKeys.detail(variables.id), result);
            queryClient.invalidateQueries({ queryKey: dashboardKeys.all });
            toast.success('Статус успешно обновлен');
        },
        onError: (err: Error) => {
            toast.error(err.message || 'Ошибка обновления статуса');
        },
    });

    const assignToMe = useMutation({
        mutationFn: async ({ id, managerId }: { id: string | number; managerId: string }) => {
            const result = await calculationService.assignToMe(id, managerId);
            if (!result.success) throw new Error(result.error?.message);
            await chatService.sendSyncSignal(id, 'UPDATE');
            return result.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: dashboardKeys.all });
            toast.success('Проект назначен вам');
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
            await chatService.sendSyncSignal(id, 'UPDATE');
            return result.data;
        },
        onSuccess: (result, variables) => {
            queryClient.setQueryData(dashboardKeys.detail(variables.id), result);
            toast.success('Изменения сохранены');
        },
        onError: (err: Error) => {
            toast.error(err.message || 'Ошибка сохранения правок');
        },
    });

    const smartReorder = useMutation({
        mutationFn: async ({ id }: { id: string | number }) => {
            const result = await calculationService.smartReorder(id);
            if (!result.success) throw new Error(result.error?.message);
            return result.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: dashboardKeys.all });
            toast.success('Заказ успешно повторен');
        },
    });

    const create = useMutation({
        mutationFn: async ({
            calculation,
            userId,
        }: {
            calculation: Partial<Calculation>;
            userId: string;
        }) => {
            const result = await calculationService.create(calculation, userId);
            if (!result.success) throw new Error(result.error?.message);
            return result.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: dashboardKeys.all });
            toast.success('Проект успешно создан');
        },
        onError: (err: Error) => {
            toast.error(err.message || 'Ошибка создания проекта');
        },
    });

    return {
        create,
        updateStatus,
        assignToMe,
        adjustExpert,
        smartReorder,
    };
}
