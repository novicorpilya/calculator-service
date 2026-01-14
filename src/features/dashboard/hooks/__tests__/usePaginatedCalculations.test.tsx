import { describe, test, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { usePaginatedCalculations } from '../usePaginatedCalculations';
import type { ReactNode } from 'react';
import type { Calculation } from '@/features/dashboard/dashboard.types';

// Mock the DI container
const mockCalculationService = {
    getPaginated: vi.fn(),
};

vi.mock('@/core/di/ServiceContainer', () => ({
    useServices: () => ({
        calculationService: mockCalculationService,
    }),
}));

// Wrapper with QueryClient
const createWrapper = () => {
    const queryClient = new QueryClient({
        defaultOptions: {
            queries: {
                retry: false,
            },
        },
    });
    return ({ children }: { children: ReactNode }) => (
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
};

describe('usePaginatedCalculations', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    test('should initialize with default state', () => {
        const { result } = renderHook(() => usePaginatedCalculations('user123'), {
            wrapper: createWrapper(),
        });

        expect(result.current.currentPage).toBe(1);
        expect(result.current.pageSize).toBe(20);
        expect(result.current.pagination.search).toBe('');
        expect(result.current.pagination.sortBy).toBe('created_at');
        expect(result.current.pagination.sortOrder).toBe('desc');
        expect(result.current.pagination.tab).toBe('my');
    });

    test('should fetch paginated data on mount', async () => {
        mockCalculationService.getPaginated.mockResolvedValue({
            success: true,
            data: {
                data: [
                    { id: 1, status: 'draft', organizationName: 'Test' },
                ] as unknown as Calculation[],
                total: 1,
                page: 1,
                pageSize: 20,
                totalPages: 1,
            },
        });

        const { result } = renderHook(() => usePaginatedCalculations('user123'), {
            wrapper: createWrapper(),
        });

        await waitFor(() => {
            expect(result.current.calculations.length).toBe(1);
        });

        expect(mockCalculationService.getPaginated).toHaveBeenCalledWith(
            expect.objectContaining({
                page: 1,
                pageSize: 20,
                managerId: 'user123',
            })
        );
    });

    test('should change page correctly', async () => {
        mockCalculationService.getPaginated.mockResolvedValue({
            success: true,
            data: {
                data: [],
                total: 100,
                page: 2,
                pageSize: 20,
                totalPages: 5,
            },
        });

        const { result } = renderHook(() => usePaginatedCalculations('user123'), {
            wrapper: createWrapper(),
        });

        act(() => {
            result.current.setPage(2);
        });

        await waitFor(() => {
            expect(result.current.currentPage).toBe(2);
        });
    });

    test('should reset to page 1 when search changes', async () => {
        mockCalculationService.getPaginated.mockResolvedValue({
            success: true,
            data: {
                data: [],
                total: 0,
                page: 1,
                pageSize: 20,
                totalPages: 0,
            },
        });

        const { result } = renderHook(() => usePaginatedCalculations('user123'), {
            wrapper: createWrapper(),
        });

        // Set page to 2
        act(() => {
            result.current.setPage(2);
        });

        // Then search - should reset to page 1
        act(() => {
            result.current.setSearch('test');
        });

        expect(result.current.currentPage).toBe(1);
        expect(result.current.pagination.search).toBe('test');
    });

    test('should change tab and reset page', async () => {
        mockCalculationService.getPaginated.mockResolvedValue({
            success: true,
            data: {
                data: [],
                total: 0,
                page: 1,
                pageSize: 20,
                totalPages: 0,
            },
        });

        const { result } = renderHook(() => usePaginatedCalculations('user123'), {
            wrapper: createWrapper(),
        });

        act(() => {
            result.current.setTab('unassigned');
        });

        expect(result.current.pagination.tab).toBe('unassigned');
        expect(result.current.currentPage).toBe(1);
    });

    test('should change sort and reset page', async () => {
        mockCalculationService.getPaginated.mockResolvedValue({
            success: true,
            data: {
                data: [],
                total: 0,
                page: 1,
                pageSize: 20,
                totalPages: 0,
            },
        });

        const { result } = renderHook(() => usePaginatedCalculations('user123'), {
            wrapper: createWrapper(),
        });

        act(() => {
            result.current.setSort('total_cost_value', 'asc');
        });

        expect(result.current.pagination.sortBy).toBe('total_cost_value');
        expect(result.current.pagination.sortOrder).toBe('asc');
    });

    test('should derive correct managerId for tabs', async () => {
        mockCalculationService.getPaginated.mockResolvedValue({
            success: true,
            data: {
                data: [],
                total: 0,
                page: 1,
                pageSize: 20,
                totalPages: 0,
            },
        });

        const { result } = renderHook(() => usePaginatedCalculations('user123'), {
            wrapper: createWrapper(),
        });

        // 'my' tab -> managerId = userId
        await waitFor(() => {
            expect(mockCalculationService.getPaginated).toHaveBeenCalledWith(
                expect.objectContaining({ managerId: 'user123' })
            );
        });

        // Change to 'unassigned' tab -> managerId = null
        act(() => {
            result.current.setTab('unassigned');
        });

        await waitFor(() => {
            expect(mockCalculationService.getPaginated).toHaveBeenCalledWith(
                expect.objectContaining({ managerId: null })
            );
        });

        // Change to 'all' tab -> managerId = undefined
        act(() => {
            result.current.setTab('all');
        });

        await waitFor(() => {
            expect(mockCalculationService.getPaginated).toHaveBeenCalledWith(
                expect.objectContaining({ managerId: undefined })
            );
        });
    });
});
