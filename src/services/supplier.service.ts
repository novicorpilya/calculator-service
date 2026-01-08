import { type SupabaseClient } from '@supabase/supabase-js';
import { type Supplier } from '../features/dashboard/dashboard.types';

export interface ISupplierService {
    getSuppliers(): Promise<Supplier[]>;
    getSupplierById(id: string): Promise<Supplier | null>;
}

/**
 * Service for managing suppliers and their integrations.
 */
export class SupplierService implements ISupplierService {
    private supabase: SupabaseClient;

    constructor(supabase: SupabaseClient) {
        this.supabase = supabase;
    }

    /**
     * Fetches all registered suppliers.
     */
    async getSuppliers(): Promise<Supplier[]> {
        const { data, error } = await this.supabase
            .from('suppliers')
            .select('*')
            .order('name', { ascending: true });

        if (error) {
            console.warn('Suppliers table might not exist, returning mock data for development');
            return [
                {
                    id: '33333333-3333-3333-3333-333333333333',
                    name: 'Pro-Brite',
                    description: 'Российский эксперт в производстве промышленной химии для HoReCa и пищевых производств.',
                    logo: 'https://pro-brite.com/assets/images/logo.png',
                    rating: 4.8,
                    integration_type: 'internal',
                    status: 'active'
                },
                {
                    id: '44444444-4444-4444-4444-444444444444',
                    name: 'Vileda Professional',
                    description: 'Мировой лидер в производстве эргономичного уборочного инвентаря для профессионалов.',
                    logo: 'https://www.vileda-professional.com/media/Logo_Vileda_Professional.svg',
                    rating: 5.0,
                    integration_type: 'api_custom',
                    status: 'active'
                },
                {
                    id: '55555555-5555-5555-5555-555555555555',
                    name: 'Tork (Essity)',
                    description: 'Ведущий бренд гигиенических решений: бумажные полотенца, мыло и системы дозирования.',
                    logo: 'https://www.tork.ru/static/logo-tork.png',
                    rating: 4.9,
                    integration_type: 'api_1c',
                    status: 'active'
                }
            ];
        }
        return data || [];
    }

    /**
     * Gets a specific supplier by ID.
     */
    async getSupplierById(id: string): Promise<Supplier | null> {
        const { data, error } = await this.supabase
            .from('suppliers')
            .select('*')
            .eq('id', id)
            .single();

        if (error) return null;
        return data;
    }
}
