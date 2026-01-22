import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { dashboardKeys } from './useCalculations';
import type { CalculationStatus } from '../dashboard.types';
import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { useServices } from '@/app/di/ServiceContainer';
import { toast } from 'sonner';
import { type FilterPreset } from '../manager/manager.types';

export interface PaginationState {
    page: number;
    pageSize: number;
    search: string;
    sortBy: 'created_at' | 'updated_at' | 'organization_name' | 'total_cost_value';
    sortOrder: 'asc' | 'desc';
    status?: CalculationStatus;
    tab: 'my' | 'unassigned' | 'all';
    hideArchived: boolean; // Hide closed projects by default
}

const DEFAULT_PAGE_SIZE = 20;
const SEARCH_DEBOUNCE_MS = 300;

/**
 * Hook for server-side paginated calculations
 * Replaces client-side filtering in ManagerCalculationsList
 */
export function usePaginatedCalculations(
    userId?: string,
    initialPageSize: number = DEFAULT_PAGE_SIZE
) {
    const { calculationService, filterPresetService } = useServices();
    const queryClient = useQueryClient();
    const [pagination, setPagination] = useState<PaginationState>(() => {
        // Initial load from localStorage cache if possible (Sync load)
        const cached = userId ? filterPresetService.getCachedPresets(userId) : [];
        const def = cached.find((p) => p.is_default);
        if (def) {
            return {
                page: 1,
                pageSize: initialPageSize,
                search: '',
                sortBy: 'created_at',
                sortOrder: 'desc',
                tab: 'all',
                hideArchived: false,
                ...def.query_params,
            };
        }
        return {
            page: 1,
            pageSize: initialPageSize,
            search: '',
            sortBy: 'created_at',
            sortOrder: 'desc',
            tab: 'all',
            hideArchived: false, // Show archived by default for Kanban
        };
    });

    // Debounced search value
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const debounceTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Debounce search input
    useEffect(() => {
        if (debounceTimeoutRef.current) {
            clearTimeout(debounceTimeoutRef.current);
        }
        debounceTimeoutRef.current = setTimeout(() => {
            setDebouncedSearch(pagination.search);
        }, SEARCH_DEBOUNCE_MS);

        return () => {
            if (debounceTimeoutRef.current) {
                clearTimeout(debounceTimeoutRef.current);
            }
        };
    }, [pagination.search]);

    // Derive managerId from tab
    const managerId = useMemo(() => {
        if (pagination.tab === 'my') return userId || null;
        if (pagination.tab === 'unassigned') return null;
        return undefined; // 'all' - no filter
    }, [pagination.tab, userId]);

    const queryKey = dashboardKeys.paginated({ ...pagination, search: debouncedSearch, managerId });

    const { data, isLoading, error, isFetching } = useQuery({
        queryKey,
        queryFn: async () => {
            const result = await calculationService.getPaginated({
                page: pagination.page,
                pageSize: pagination.pageSize,
                search: debouncedSearch, // Use debounced value
                sortBy: pagination.sortBy,
                sortOrder: pagination.sortOrder,
                status: pagination.status,
                excludeStatus: pagination.hideArchived && !pagination.status ? 'closed' : undefined,
                managerId:
                    pagination.tab === 'unassigned'
                        ? null
                        : pagination.tab === 'my'
                          ? userId
                          : undefined,
            });

            if (!result.success) {
                throw new Error(result.error?.message || 'Failed to fetch paginated calculations');
            }
            return result.data;
        },
        enabled: !!userId || pagination.tab === 'unassigned',
        staleTime: 0, // Always refetch on invalidation for real-time updates
        placeholderData: keepPreviousData, // Keep previous data while fetching new page
    });

    // Actions
    const setPage = useCallback((page: number) => {
        setPagination((prev) => ({ ...prev, page }));
    }, []);

    const setSearch = useCallback((search: string) => {
        setPagination((prev) => ({ ...prev, search, page: 1 })); // Reset to page 1 on search
    }, []);

    const setSort = useCallback(
        (sortBy: PaginationState['sortBy'], sortOrder: PaginationState['sortOrder']) => {
            setPagination((prev) => ({ ...prev, sortBy, sortOrder, page: 1 }));
        },
        []
    );

    const setTab = useCallback((tab: PaginationState['tab']) => {
        setPagination((prev) => ({ ...prev, tab, page: 1 }));
    }, []);

    const setStatus = useCallback((status?: CalculationStatus) => {
        setPagination((prev) => ({ ...prev, status, page: 1 }));
    }, []);

    const setHideArchived = useCallback((hideArchived: boolean) => {
        setPagination((prev) => ({ ...prev, hideArchived, page: 1 }));
    }, []);

    // Presets Management
    const { data: presets = [], isLoading: isLoadingPresets } = useQuery({
        queryKey: ['filter_presets', userId],
        queryFn: () => filterPresetService.getPresets(userId!),
        enabled: !!userId,
        select: (res) => (res.success ? res.data : []),
    });

    const savePreset = useMutation({
        mutationFn: async ({ name, isDefault }: { name: string; isDefault?: boolean }) => {
            const params = { ...pagination } as Record<string, unknown>;
            delete params.page;
            delete params.pageSize;

            const result = await filterPresetService.savePreset({
                user_id: userId!,
                name,
                query_params: params,
                is_default: isDefault,
            });
            if (!result.success) throw new Error('Ошибка сохранения пресета');
            return result.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['filter_presets', userId] });
            toast.success('Пресет успешно сохранен');
        },
    });

    const applyPreset = useCallback((preset: FilterPreset) => {
        setPagination((prev) => ({
            ...prev,
            ...preset.query_params,
            page: 1, // Reset to first page
        }));
    }, []);

    const deletePreset = useMutation({
        mutationFn: (id: string) => filterPresetService.deletePreset(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['filter_presets', userId] });
            toast.success('Пресет удален');
        },
    });

    return {
        // Data
        calculations: data?.data || [],
        total: data?.pagination?.total || 0,
        totalPages: data?.pagination?.totalPages || 0,
        currentPage: pagination.page,
        pageSize: pagination.pageSize,
        presets,

        // State
        isLoading,
        isFetching,
        isLoadingPresets,
        error,
        pagination,

        // Actions
        setPage,
        setSearch,
        setSort,
        setTab,
        setStatus,
        setHideArchived,
        applyPreset,
        savePreset,
        deletePreset,
    };
}
