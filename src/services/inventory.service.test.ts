import { describe, it, test, expect, vi, beforeEach } from 'vitest';
import { type SupabaseClient } from '@supabase/supabase-js';
import { InventoryService, type InventoryItemMaster } from './inventory.service';

const mockSupabase = {
    from: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    upsert: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    single: vi.fn().mockReturnThis(),
    range: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    mocks: {
        from: vi.fn(),
        select: vi.fn(),
        insert: vi.fn(),
        update: vi.fn(),
        upsert: vi.fn(),
        delete: vi.fn(),
        eq: vi.fn(),
        single: vi.fn(),
        range: vi.fn(),
        order: vi.fn(),
    },
};

// Setup method chaining mocks
mockSupabase.from = mockSupabase.mocks.from.mockReturnThis();
mockSupabase.select = mockSupabase.mocks.select.mockReturnThis();
mockSupabase.insert = mockSupabase.mocks.insert.mockReturnThis();
mockSupabase.update = mockSupabase.mocks.update.mockReturnThis();
mockSupabase.upsert = mockSupabase.mocks.upsert.mockReturnThis();
mockSupabase.delete = mockSupabase.mocks.delete.mockReturnThis();
mockSupabase.eq = mockSupabase.mocks.eq.mockReturnThis();
mockSupabase.single = mockSupabase.mocks.single.mockReturnThis();
mockSupabase.range = mockSupabase.mocks.range.mockReturnThis();
mockSupabase.order = mockSupabase.mocks.order.mockReturnThis();

describe('InventoryService', () => {
    let service: InventoryService;

    beforeEach(() => {
        vi.clearAllMocks();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        service = new InventoryService(mockSupabase as any as SupabaseClient);
    });

    describe('getGlobalItems', () => {
        it('should return paginated data', async () => {
            const mockData = [{ id: '1', name: 'Item 1' }] as InventoryItemMaster[];
            mockSupabase.mocks.select.mockReturnThis();
            mockSupabase.mocks.order.mockReturnThis();
            mockSupabase.mocks.range.mockResolvedValue({
                data: mockData,
                error: null,
                count: 1,
            });

            const result = await service.getGlobalItems({ page: 1, pageSize: 10 });

            expect(result.success).toBe(true);
            if (result.success && result.data) {
                expect(result.data.data).toEqual(mockData);
                expect(result.data.count).toBe(1);
            }
        });
    });

    describe('upsertItem', () => {
        test('should upsert item and return it', async () => {
            const newItem = { name: 'New Item', sku: 'SKU1' };
            const returnedItem = { id: '123', ...newItem } as InventoryItemMaster;

            mockSupabase.mocks.upsert.mockReturnThis();
            mockSupabase.mocks.select.mockReturnThis();
            mockSupabase.mocks.single.mockResolvedValue({ data: returnedItem, error: null });

            const result = await service.upsertItem(newItem as InventoryItemMaster);

            expect(result.success).toBe(true);
            if (result.success && result.data) {
                expect(result.data).toEqual(returnedItem);
            }
        });
    });
});
