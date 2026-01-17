import { z } from 'zod';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { ActionResult, VoidResult } from '@/core/types/results';
import { wrapError } from '@/core/utils/errors';
import type { IAuditLogService } from './audit.service';

export interface AdminInventoryItem {
    id: string;
    name: string;
    sku: string;
    description: string;
    category?: string;
    price: number;
    stock: number;
    supplier_id?: string;
    supplier?: { name: string };
    norm_area?: number;
    norm_personnel?: number;
    norm_intensity?: number;
    replacement_cycle_days?: number;
    series?: string;
    tier?: number;
    updated_at: string;
}

export const InventoryItemSchema = z.object({
    id: z.string().uuid(),
    name: z.string().min(1, 'Name is required'),
    sku: z.string().min(1, 'SKU is required'),
    description: z.string().optional(),
    category: z.string().optional(),
    price: z.number().nonnegative(),
    stock: z.number().int().nonnegative(),
    supplier_id: z.string().uuid().optional().nullable(),
    supplier: z.object({ name: z.string() }).optional().nullable(),
    norm_area: z.number().optional().nullable(),
    norm_personnel: z.number().optional().nullable(),
    norm_intensity: z.number().optional().nullable(),
    replacement_cycle_days: z.number().int().optional().nullable(),
    series: z.string().optional().nullable(),
    tier: z.number().int().optional().nullable(),
    updated_at: z.string()
});

export type AdminInventoryItemType = z.infer<typeof InventoryItemSchema>;

export interface IInventoryAdminService {
    getInventory(page?: number, pageSize?: number, search?: string): Promise<ActionResult<{ data: AdminInventoryItem[], total: number }>>;
    updateItem(id: string, data: Partial<AdminInventoryItem>): Promise<VoidResult>;
    createItem(data: Omit<AdminInventoryItem, 'id' | 'updated_at' | 'supplier'>): Promise<ActionResult<AdminInventoryItem>>;
    deleteItem(id: string): Promise<VoidResult>;
}

export class InventoryAdminService implements IInventoryAdminService {
    private supabase: SupabaseClient;
    private auditService: IAuditLogService;

    constructor(
        supabase: SupabaseClient,
        auditService: IAuditLogService
    ) {
        this.supabase = supabase;
        this.auditService = auditService;
    }

    async getInventory(
        page = 1, 
        pageSize = 20, 
        search = ''
    ): Promise<ActionResult<{ data: AdminInventoryItem[], total: number }>> {
        try {
            const from = (page - 1) * pageSize;
            const to = from + pageSize - 1;

            let query = this.supabase
                .from('inventory_items')
                .select(`
                    *,
                    supplier:supplier_id (name)
                `, { count: 'exact' })
                .order('created_at', { ascending: false })
                .range(from, to);

            if (search) {
                query = query.or(`name.ilike.%${search}%,sku.ilike.%${search}%`);
            }

            const { data, error, count } = await query;

            if (error) return { success: false, error: wrapError(error) };

            return { 
                success: true, 
                data: {
                    data: data as AdminInventoryItem[],
                    total: count || 0
                } 
            };
        } catch (error) {
            return { success: false, error: wrapError(error) };
        }
    }

    async updateItem(id: string, updates: Partial<AdminInventoryItem>): Promise<VoidResult> {
        try {
            // Remove readonly fields
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const { supplier, id: _id, updated_at, ...updateData } = updates as Record<string, unknown>;

            const { error } = await this.supabase
                .from('inventory_items')
                .update({ ...updateData, updated_at: new Date().toISOString() })
                .eq('id', id);

            if (error) return { success: false, error: wrapError(error) };

            await this.auditService.logAction(
                'inventory_item_updated',
                'inventory_item',
                id,
                { updates: updateData }
            );

            return { success: true };
        } catch (error) {
            return { success: false, error: wrapError(error) };
        }
    }

    async createItem(data: Omit<AdminInventoryItem, 'id' | 'updated_at' | 'supplier'>): Promise<ActionResult<AdminInventoryItem>> {
        try {
            const { data: created, error } = await this.supabase
                .from('inventory_items')
                .insert(data)
                .select()
                .single();

            if (error) return { success: false, error: wrapError(error) };

            await this.auditService.logAction(
                'inventory_item_created',
                'inventory_item',
                created.id,
                { sku: created.sku, name: created.name }
            );

            return { success: true, data: created };
        } catch (error) {
            return { success: false, error: wrapError(error) };
        }
    }

    async deleteItem(id: string): Promise<VoidResult> {
        try {
            const { error } = await this.supabase
                .from('inventory_items')
                .delete()
                .eq('id', id);

            if (error) return { success: false, error: wrapError(error) };

            await this.auditService.logAction(
                'inventory_item_deleted',
                'inventory_item',
                id
            );

            return { success: true };
        } catch (error) {
            return { success: false, error: wrapError(error) };
        }
    }
}
