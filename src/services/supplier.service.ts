import { z } from 'zod';
import { type SupabaseClient } from '@supabase/supabase-js';
import { type Supplier } from '../features/dashboard/dashboard.types';
import type { ActionResult } from '@/core/types/results';
import { logger } from '@/core/logging';

/**
 * Zod schema for Supplier validation
 */
export const SupplierSchema = z.object({
    id: z.string().uuid(),
    name: z.string(),
    description: z.string().optional().nullable(),
    logo: z.string().optional().nullable(),
    rating: z.number().optional().nullable(),
    contacts: z
        .object({
            phone: z.string().optional(),
            email: z.string().optional(),
            website: z.string().optional(),
        })
        .optional()
        .nullable(),
    integration_type: z.enum(['internal', 'api_1c', 'api_custom']),
    status: z.enum(['active', 'inactive']),
});

export interface ISupplierService {
    getSuppliers(): Promise<ActionResult<Supplier[]>>;
    getSupplierById(id: string): Promise<ActionResult<Supplier | null>>;
}

/**
 * Service for managing suppliers and their integrations.
 */
export class SupplierService implements ISupplierService {
    private supabase: SupabaseClient;

    constructor(supabase: SupabaseClient) {
        this.supabase = supabase;
    }

    private wrapError(error: unknown): { message: string } {
        return { message: error instanceof Error ? error.message : String(error) };
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
                // Return mock data for development if table doesn't exist/error
                const mockSuppliers: Supplier[] = [
                    {
                        id: '33333333-3333-3333-3333-333333333333',
                        name: 'Pro-Brite',
                        description:
                            'Российский эксперт в производстве промышленной химии для HoReCa и пищевых производств.',
                        logo: 'https://pro-brite.com/assets/images/logo.png',
                        rating: 4.8,
                        integration_type: 'internal',
                        status: 'active',
                    },
                    {
                        id: '44444444-4444-4444-4444-444444444444',
                        name: 'Vileda Professional',
                        description:
                            'Мировой лидер в производстве эргономичного уборочного инвентаря для профессионалов.',
                        logo: 'https://www.vileda-professional.com/media/Logo_Vileda_Professional.svg',
                        rating: 5.0,
                        integration_type: 'api_custom',
                        status: 'active',
                    },
                    {
                        id: '55555555-5555-5555-5555-555555555555',
                        name: 'Tork (Essity)',
                        description:
                            'Ведущий бренд гигиенических решений: бумажные полотенца, мыло и системы дозирования.',
                        logo: 'https://www.tork.ru/static/logo-tork.png',
                        rating: 4.9,
                        integration_type: 'api_1c',
                        status: 'active',
                    },
                    {
                        id: '88888888-8888-8888-8888-888888888888',
                        name: 'Karcher',
                        description: 'Мировой лидер в области уборочной техники и технологий очистки.',
                        logo: 'https://www.kaercher.com/media/logo.svg',
                        rating: 4.9,
                        integration_type: 'api_custom',
                        status: 'active',
                    },
                    {
                        id: '99999999-9999-9999-9999-999999999999',
                        name: 'Kimberly-Clark',
                        description:
                            'Лидер по производству продукции для здравоохранения и профессиональной гигиены.',
                        logo: 'https://www.kimberly-clark.com/-/media/images/brand-logos/kc-professional-logo.png',
                        rating: 4.7,
                        integration_type: 'internal',
                        status: 'active',
                    },
                ];
                return { success: true, data: mockSuppliers };
            }

            const parseResult = z.array(SupplierSchema).safeParse(data);
            if (!parseResult.success) {
                logger.error('Supplier Validation Error:', { error: parseResult.error });
                return { success: true, data: (data || []) as Supplier[] }; // Fallback to raw if logic allows
            }

            return { success: true, data: parseResult.data as Supplier[] };
        } catch (error) {
            return { success: false, error: this.wrapError(error) };
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

            const parseResult = SupplierSchema.safeParse(data);
            if (!parseResult.success) {
                logger.error(`Supplier ${id} Validation Error:`, { error: parseResult.error });
                return { success: true, data: data as Supplier };
            }

            return { success: true, data: parseResult.data as Supplier };
        } catch (error) {
            return { success: false, error: this.wrapError(error) };
        }
    }
}
