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

            if (error) {
                logger.error('[InventoryService:getSuppliers] Error', { error });
                return { success: false, error: this.wrapError(error) };
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
