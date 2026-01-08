
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { InventoryService } from './inventory.service';
import type { SupabaseClient } from '@supabase/supabase-js';

// Mock Supabase Client Factory
const createMockSupabase = () => {
    const fromMock = vi.fn();
    const selectMock = vi.fn();
    const orderMock = vi.fn();
    const upsertMock = vi.fn();
    const deleteMock = vi.fn();
    const eqMock = vi.fn();
    const singleMock = vi.fn();

    const client = {
        from: fromMock.mockReturnValue({
            select: selectMock.mockReturnValue({
                order: orderMock,
                // Handle different query chains
                single: singleMock,
            }),
            upsert: upsertMock.mockReturnValue({
                select: vi.fn().mockReturnValue({
                    single: singleMock,
                }),
            }),
            delete: deleteMock.mockReturnValue({
                eq: eqMock,
            }),
        }),
    } as unknown as SupabaseClient;

    return {
        client,
        mocks: {
            from: fromMock,
            select: selectMock,
            order: orderMock,
            upsert: upsertMock,
            delete: deleteMock,
            eq: eqMock,
            single: singleMock,
        },
    };
};

describe('InventoryService', () => {
    let service: InventoryService;
    let mockSupabase: ReturnType<typeof createMockSupabase>;

    beforeEach(() => {
        mockSupabase = createMockSupabase();
        service = new InventoryService(mockSupabase.client);
    });

    describe('getGlobalItems', () => {
        it('should return items from supabase on success', async () => {
            const mockItems = [
                { id: '1', name: 'Item 1' },
                { id: '2', name: 'Item 2' },
            ];

            // Setup mock chain: from -> select -> order -> { data, error }
            mockSupabase.mocks.order.mockResolvedValue({ data: mockItems, error: null });

            // Note: In implementation: from('inventory_items').select('*').order('name', { ascending: true })
            const result = await service.getGlobalItems();

            expect(mockSupabase.mocks.from).toHaveBeenCalledWith('inventory_items');
            expect(mockSupabase.mocks.select).toHaveBeenCalledWith('*');
            expect(mockSupabase.mocks.order).toHaveBeenCalledWith('name', { ascending: true });
            expect(result).toEqual(mockItems);
        });

        it('should return specialized mock data on error', async () => {
            // Setup mock chain to fail
            mockSupabase.mocks.order.mockResolvedValue({ data: null, error: { message: 'Table not found' } });

            const logs = vi.spyOn(console, 'warn').mockImplementation(() => { });

            const result = await service.getGlobalItems();

            expect(result.length).toBeGreaterThan(0);
            expect(result[0].name).toContain('GRILL-CLEANER'); // Check one of the hardcoded mock items
            expect(logs).toHaveBeenCalled();

            logs.mockRestore();
        });

        it('should return empty array if data is null but no error (edge case)', async () => {
            mockSupabase.mocks.order.mockResolvedValue({ data: null, error: null });
            const result = await service.getGlobalItems();
            expect(result).toEqual([]);
        });
    });

    describe('upsertItem', () => {
        it('should upsert item and return result on success', async () => {
            const newItem = { name: 'New Item' };
            const returnedItem = { id: '1', ...newItem, created_at: 'now' };

            // Chain: from -> upsert -> select -> single -> { data, error }
            mockSupabase.mocks.single.mockResolvedValue({ data: returnedItem, error: null });

            const result = await service.upsertItem(newItem as any);

            expect(mockSupabase.mocks.from).toHaveBeenCalledWith('inventory_items');
            expect(mockSupabase.mocks.upsert).toHaveBeenCalledWith(expect.objectContaining({
                ...newItem,
                updated_at: expect.any(String),
            }));
            expect(result).toEqual(returnedItem);
        });

        it('should throw error on upsert failure', async () => {
            const newItem = { name: 'Fail Item' };
            const error = { message: 'DB Error' };

            mockSupabase.mocks.single.mockResolvedValue({ data: null, error });

            await expect(service.upsertItem(newItem as any)).rejects.toEqual(error);
        });
    });

    describe('deleteItem', () => {
        it('should delete item by id', async () => {
            const id = '123';

            // Chain: from -> delete -> eq -> { error }
            mockSupabase.mocks.eq.mockResolvedValue({ error: null });

            await service.deleteItem(id);

            expect(mockSupabase.mocks.from).toHaveBeenCalledWith('inventory_items');
            expect(mockSupabase.mocks.delete).toHaveBeenCalled();
            expect(mockSupabase.mocks.eq).toHaveBeenCalledWith('id', id);
        });

        it('should throw error on delete failure', async () => {
            const id = '123';
            const error = { message: 'Delete Error' };

            mockSupabase.mocks.eq.mockResolvedValue({ error });

            await expect(service.deleteItem(id)).rejects.toEqual(error);
        });
    });
});
