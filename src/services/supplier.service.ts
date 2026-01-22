import { z } from 'zod';
import type { SupabaseClient } from '@supabase/supabase-js';
import { type Supplier } from '../features/dashboard/dashboard.types';
import type { ActionResult, VoidResult } from '@/core/types/results';
import { wrapError } from '@/core/utils/errors';
import type { IAuditLogService } from './audit.service';

/**
 * Zod schema for Supplier validation
 */
export const SupplierSchema = z.object({
    id: z.string().uuid(),
    name: z.string().min(1, 'Name is required'),
    description: z.string().optional().nullable(),
    logo: z.string().optional().nullable(),
    rating: z.number().optional().nullable(),
    contacts: z
        .object({
            phone: z.string().optional(),
            email: z.string().optional(),
            website: z.string().optional(),
            address: z.string().optional(),
        })
        .optional()
        .nullable(),
    integration_type: z.enum(['internal', 'api_1c', 'api_custom']),
    status: z.enum(['active', 'inactive']),
    created_at: z.string().optional(),
    updated_at: z.string().optional(),
});

export type SupplierInput = z.infer<typeof SupplierSchema>;

export interface ISupplierService {
    getSuppliers(): Promise<ActionResult<Supplier[]>>;
    getSupplierById(id: string): Promise<ActionResult<Supplier | null>>;
    createSupplier(
        data: Omit<SupplierInput, 'id' | 'created_at' | 'updated_at'>
    ): Promise<ActionResult<Supplier>>;
    updateSupplier(id: string, data: Partial<SupplierInput>): Promise<VoidResult>;
    deleteSupplier(id: string): Promise<VoidResult>;
}

/**
 * Service for managing suppliers and their integrations.
 */
export class SupplierService implements ISupplierService {
    private supabase: SupabaseClient;
    private auditService: IAuditLogService;

    constructor(supabase: SupabaseClient, auditService: IAuditLogService) {
        this.supabase = supabase;
        this.auditService = auditService;
    }

    /**
     * Fetches all registered suppliers.
     */
    async getSuppliers(): Promise<ActionResult<Supplier[]>> {
        try {
            const { data, error } = await this.supabase
                .from('suppliers')
                .select('*')
                .order('name', { ascending: true });

            if (error) {
                return { success: false, error: wrapError(error) };
            }

            // Using safeParse for array to allow partial data if schema is strict,
            // but ideally we want to ensure DB matches schema.
            // For now, we cast to Supplier[] to be permissive with existing data
            const suppliers = (data as Supplier[]).map((s) => {
                const mappings: Record<string, string> = {
                    'https://www.tork.ru/static/logo-tork.png': '/assets/suppliers/tork-logo.png',
                    'https://pro-brite.com/assets/images/logo.png':
                        '/assets/suppliers/pro-brite-logo.png',
                    'https://www.vileda-professional.com/media/Logo_Vileda_Professional.svg':
                        '/assets/suppliers/vileda-logo.svg',
                };

                if (s.logo && mappings[s.logo]) {
                    return { ...s, logo: mappings[s.logo] };
                }
                return s;
            });
            return { success: true, data: suppliers };
        } catch (error) {
            return { success: false, error: wrapError(error) };
        }
    }

    /**
     * Gets a specific supplier by ID.
     */
    async getSupplierById(id: string): Promise<ActionResult<Supplier | null>> {
        try {
            const { data, error } = await this.supabase
                .from('suppliers')
                .select('*')
                .eq('id', id)
                .single();

            if (error) return { success: true, data: null };

            const supplier = data as Supplier;
            const mappings: Record<string, string> = {
                'https://www.tork.ru/static/logo-tork.png': '/assets/suppliers/tork-logo.png',
                'https://pro-brite.com/assets/images/logo.png':
                    '/assets/suppliers/pro-brite-logo.png',
                'https://www.vileda-professional.com/media/Logo_Vileda_Professional.svg':
                    '/assets/suppliers/vileda-logo.svg',
            };

            if (supplier.logo && mappings[supplier.logo]) {
                supplier.logo = mappings[supplier.logo];
            }

            return { success: true, data: supplier };
        } catch (error) {
            return { success: false, error: wrapError(error) };
        }
    }

    /**
     * Creates a new supplier
     */
    async createSupplier(
        data: Omit<SupplierInput, 'id' | 'created_at' | 'updated_at'>
    ): Promise<ActionResult<Supplier>> {
        try {
            const { data: created, error } = await this.supabase
                .from('suppliers')
                .insert(data)
                .select()
                .single();

            if (error) return { success: false, error: wrapError(error) };

            await this.auditService.logAction('supplier_created', 'supplier', created.id, {
                name: created.name,
            });

            return { success: true, data: created as Supplier };
        } catch (error) {
            return { success: false, error: wrapError(error) };
        }
    }

    /**
     * Updates an existing supplier
     */
    async updateSupplier(id: string, updates: Partial<SupplierInput>): Promise<VoidResult> {
        try {
            // Remove readonly fields
            const updateData = { ...updates } as Record<string, unknown>;
            delete updateData.id;
            delete updateData.created_at;
            delete updateData.updated_at;

            const { error } = await this.supabase
                .from('suppliers')
                .update({ ...updateData, updated_at: new Date().toISOString() })
                .eq('id', id);

            if (error) return { success: false, error: wrapError(error) };

            await this.auditService.logAction('supplier_updated', 'supplier', id, {
                updates: updateData,
            });

            return { success: true };
        } catch (error) {
            return { success: false, error: wrapError(error) };
        }
    }

    /**
     * Deletes a supplier
     */
    async deleteSupplier(id: string): Promise<VoidResult> {
        try {
            const { error } = await this.supabase.from('suppliers').delete().eq('id', id);

            if (error) return { success: false, error: wrapError(error) };

            await this.auditService.logAction('supplier_deleted', 'supplier', id);

            return { success: true };
        } catch (error) {
            return { success: false, error: wrapError(error) };
        }
    }
}
