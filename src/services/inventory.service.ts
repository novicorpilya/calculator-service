import type { SupabaseClient } from '@supabase/supabase-js';
import { logger } from '@/core/logging';
import type { ActionResult, VoidResult } from '@/core/types/results';

export interface Supplier {
    id: string;
    name: string;
    description?: string;
    logo?: string;
    rating?: number;
    status: string;
}

export interface InventoryItemMaster {
    id: string;
    name: string;
    sku: string;
    color: string;
    price: number;
    stock: number;
    norm_area: number;
    norm_personnel: number;
    norm_intensity: number;
    replacement_cycle_days: number;
    supplier_id?: string;
    category?: string;
    tier?: number; // 1: Эконом, 2: Стандарт, 3: Премиум
    durability?: number; // Ресурс (циклы/дни)
    series?: string; // Для Bundle Logic
    compliance_level?: string; // Для Sanitary Level
    created_at?: string;
    updated_at?: string;
    supplier?: Supplier; // Joined supplier data
}

export type CreateInventoryItemData = Omit<InventoryItemMaster, 'id' | 'created_at' | 'updated_at'>;

export interface InventoryPaginatedResult<T> {
    data: T[];
    count: number;
    page: number;
    pageSize: number;
    totalPages: number;
}

export interface InventoryFilterOptions {
    search?: string;
    supplierId?: string;
    category?: string;
    page?: number;
    pageSize?: number;
}

export interface IInventoryService {
    getGlobalItems(
        options?: InventoryFilterOptions
    ): Promise<ActionResult<InventoryPaginatedResult<InventoryItemMaster>>>;
    getSuppliers(): Promise<ActionResult<Supplier[]>>;
    upsertItem(
        item: Partial<InventoryItemMaster> & { name: string }
    ): Promise<ActionResult<InventoryItemMaster>>;
    deleteItem(id: string): Promise<VoidResult>;
}

/**
 * Service for managing global inventory catalog and item norms.
 */
export class InventoryService implements IInventoryService {
    private supabase: SupabaseClient;

    constructor(supabase: SupabaseClient) {
        this.supabase = supabase;
    }

    private wrapError(error: unknown): { message: string } {
        if (error instanceof Error) return { message: error.message };
        if (typeof error === 'object' && error !== null && 'message' in error) {
            return { message: String((error as { message: unknown }).message) };
        }
        return { message: String(error) };
    }

    /**
     * Fetches paginated inventory items from the master catalog with optional filters.
     */
    async getGlobalItems(
        options: InventoryFilterOptions = {}
    ): Promise<ActionResult<InventoryPaginatedResult<InventoryItemMaster>>> {
        try {
            const { page = 1, pageSize = 10, search = '', supplierId, category } = options;

            let query = this.supabase
                .from('inventory_items')
                .select('*, supplier:suppliers(*)', { count: 'exact' });

            if (search) {
                query = query.or(`name.ilike.%${search}%,sku.ilike.%${search}%`);
            }

            if (supplierId) {
                query = query.eq('supplier_id', supplierId);
            }

            if (category) {
                query = query.eq('category', category);
            }

            const from = (page - 1) * pageSize;
            const to = from + pageSize - 1;

            // 1. First, check if there are ANY items in the database at all to decide on mock fallback
            const { count: totalInDb } = await this.supabase
                .from('inventory_items')
                .select('*', { count: 'exact', head: true });

            const isDbEmpty = !totalInDb || totalInDb === 0;

            if (isDbEmpty) {
                // Return rich STABLE mock data for development
                const mockSuppliers: Supplier[] = [
                    { id: '33333333-3333-3333-3333-333333333333', name: 'Pro-Brite', description: 'Российский эксперт в химии.', status: 'active', rating: 4.8 },
                    { id: '44444444-4444-4444-4444-444444444444', name: 'Vileda Professional', description: 'Мировой лидер в инвентаре.', status: 'active', rating: 5.0 },
                    { id: '55555555-5555-5555-5555-555555555555', name: 'Tork (Essity)', description: 'Гигиенические решения.', status: 'active', rating: 4.9 },
                    { id: '88888888-8888-8888-8888-888888888888', name: 'Karcher', description: 'Уборочная техника.', status: 'active', rating: 4.9 },
                    { id: '99999999-9999-9999-9999-999999999999', name: 'Kimberly-Clark', description: 'Продукция для гигиены.', status: 'active', rating: 4.7 },
                ];

                const zones = ['#ef4444', '#22c55e', '#3b82f6', '#facc15', '#ec4899', '#f97316', '#78350f', '#f8fafc'];
                const cats = ['Кухонная химия', 'Общая химия', 'Санитария', 'Оборудование', 'Инвентарь', 'Расходные материалы', 'Системы', 'Бумага', 'Гигиена'];
                
                const mockItems: InventoryItemMaster[] = Array.from({ length: 500 }).map((_, i) => {
                    const sId = mockSuppliers[i % 5].id;
                    return {
                        id: `m${i}`,
                        name: `Товар ${i % 2 === 0 ? 'Premium' : 'Standard'} #${i + 1}`,
                        sku: `AUTO-${i + 1}`,
                        color: zones[i % 8],
                        price: 1000 + ((i * 17) % 5000), // Stable price
                        stock: 10 + ((i * 3) % 100),    // Stable stock
                        norm_area: 0.05,
                        norm_personnel: 0.1,
                        norm_intensity: 1.2,
                        replacement_cycle_days: 30,
                        supplier_id: sId,
                        category: cats[i % 9],
                        supplier: mockSuppliers.find(s => s.id === sId)
                    };
                });

                const filteredMock = mockItems.filter((item) => {
                    if (search && !item.name.toLowerCase().includes(search.toLowerCase()) && !item.sku.toLowerCase().includes(search.toLowerCase()))
                        return false;
                    if (supplierId && item.supplier_id !== supplierId) return false;
                    if (category && item.category !== category) return false;
                    return true;
                });

                const totalFiltered = filteredMock.length;
                const totalPgs = Math.ceil(totalFiltered / pageSize);
                const startIndex = (page - 1) * pageSize;
                const paginatedData = filteredMock.slice(startIndex, startIndex + pageSize);

                return {
                    success: true,
                    data: {
                        data: paginatedData,
                        count: totalFiltered,
                        page,
                        pageSize,
                        totalPages: totalPgs,
                    },
                };
            }

            // 2. Real DB Logic (only if not empty)
            const { data, error, count } = await query
                .order('name', { ascending: true })
                .range(from, to);

            if (error) {
                logger.error('[InventoryService:getGlobalItems] Error', { error });
                return { success: false, error: this.wrapError(error) };
            }

            const totalCount = count || 0;
            return {
                success: true,
                data: {
                    data: data || [],
                    count: totalCount,
                    page,
                    pageSize,
                    totalPages: Math.ceil(totalCount / pageSize),
                },
            };
        } catch (error) {
            return { success: false, error: this.wrapError(error) };
        }
    }

    /**
     * Fetches all active suppliers.
     */
    async getSuppliers(): Promise<ActionResult<Supplier[]>> {
        try {
            const { data, error } = await this.supabase
                .from('suppliers')
                .select('*')
                .eq('status', 'active')
                .order('name');

            if (error || !data || data.length === 0) {
                const mockSuppliers: Supplier[] = [
                    {
                        id: '33333333-3333-3333-3333-333333333333',
                        name: 'Pro-Brite',
                        description: 'Российский эксперт в производстве промышленной химии.',
                        status: 'active',
                        rating: 4.8,
                    },
                    {
                        id: '44444444-4444-4444-4444-444444444444',
                        name: 'Vileda Professional',
                        description: 'Мировой лидер в инвентаре для уборки.',
                        status: 'active',
                        rating: 5.0,
                    },
                    {
                        id: '55555555-5555-5555-5555-555555555555',
                        name: 'Tork (Essity)',
                        description: 'Ведущий бренд гигиенических решений.',
                        status: 'active',
                        rating: 4.9,
                    },
                    {
                        id: '88888888-8888-8888-8888-888888888888',
                        name: 'Karcher',
                        description: 'Мировой лидер в области уборочной техники.',
                        status: 'active',
                        rating: 4.9,
                    },
                    {
                        id: '99999999-9999-9999-9999-999999999999',
                        name: 'Kimberly-Clark',
                        description: 'Лидер продукции для здравоохранения и гигиены.',
                        status: 'active',
                        rating: 4.7,
                    },
                ];
                return { success: true, data: mockSuppliers };
            }

            return { success: true, data: data || [] };
        } catch (error) {
            return { success: false, error: this.wrapError(error) };
        }
    }

    /**
     * Creates or updates an inventory item in the catalog.
     */
    async upsertItem(
        item: Partial<InventoryItemMaster> & { name: string }
    ): Promise<ActionResult<InventoryItemMaster>> {
        try {
            const { data, error } = await this.supabase
                .from('inventory_items')
                .upsert({
                    ...item,
                    updated_at: new Date().toISOString(),
                })
                .select()
                .single();

            if (error) return { success: false, error: this.wrapError(error) };
            return { success: true, data };
        } catch (error) {
            return { success: false, error: this.wrapError(error) };
        }
    }

    /**
     * Deletes an inventory item from the catalog by ID.
     */
    async deleteItem(id: string): Promise<VoidResult> {
        try {
            const { error } = await this.supabase.from('inventory_items').delete().eq('id', id);

            if (error) return { success: false, error: this.wrapError(error) };
            return { success: true };
        } catch (error) {
            return { success: false, error: this.wrapError(error) };
        }
    }
}
