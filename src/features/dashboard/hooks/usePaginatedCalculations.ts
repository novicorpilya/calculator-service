import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { dashboardKeys } from './useCalculations';
import type { CalculationStatus } from '../dashboard.types';
import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { useServices } from '@/core/di/ServiceContainer';

export interface PaginationState {
    page: number;
    pageSize: number;
    search: string;
    sortBy: 'created_at' | 'updated_at' | 'organization_name' | 'total_cost_value';
    sortOrder: 'asc' | 'desc';
    status?: CalculationStatus;
    tab: 'my' | 'unassigned' | 'all';
}

const DEFAULT_PAGE_SIZE = 20;
const SEARCH_DEBOUNCE_MS = 300;

/**
 * Hook for server-side paginated calculations
 * Replaces client-side filtering in ManagerCalculationsList
 */
export function usePaginatedCalculations(userId?: string) {
    const { calculationService } = useServices();
    const [pagination, setPagination] = useState<PaginationState>({
        page: 1,
        pageSize: DEFAULT_PAGE_SIZE,
        search: '',
        sortBy: 'created_at',
        sortOrder: 'desc',
        tab: 'my',
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
        staleTime: 1000 * 30, // 30 seconds
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

    return {
        // Data
        calculations: data?.data || [],
        total: data?.total || 0,
        totalPages: data?.totalPages || 0,
        currentPage: pagination.page,
        pageSize: pagination.pageSize,

        // State
        isLoading,
        isFetching,
        error,
        pagination,

        // Actions
        setPage,
        setSearch,
        setSort,
        setTab,
        setStatus,
    };
}
