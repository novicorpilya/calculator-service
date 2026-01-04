import { supabase } from './supabase'
import { type Supplier } from '../features/dashboard/dashboard.types'

/**
 * Service for managing suppliers and their integrations.
 */
export const supplierService = {
    /**
     * Fetches all registered suppliers.
     */
    async getSuppliers(): Promise<Supplier[]> {
        const { data, error } = await supabase
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
    },

    /**
     * Gets a specific supplier by ID.
     */
    async getSupplierById(id: string): Promise<Supplier | null> {
        const { data, error } = await supabase
            .from('suppliers')
            .select('*')
            .eq('id', id)
            .single();

        if (error) return null;
        return data;
    }
}

// PRO-BRITE: Specialized Chemicals
export const mockInventoryItems = [
    {
        id: 'pb_1',
        name: 'Средство для гриля "GRILL-CLEANER" (5л)',
        sku: 'PB-GRIL-05',
        color: '#22c55e', // Green
        price: 1850,
        stock: 120,
        supplier_id: '33333333-3333-3333-3333-333333333333',
        norm_area: 0.1,
        norm_personnel: 0,
        norm_intensity: 0.5,
        replacement_cycle_days: 30
    },
    {
        id: 'pb_2',
        name: 'Концентрат для полов "PRO-FLOOR" (5л)',
        sku: 'PB-FLOOR-01',
        color: '#3b82f6', // Blue
        price: 1540,
        stock: 300,
        supplier_id: '33333333-3333-3333-3333-333333333333',
        norm_area: 0.5,
        norm_personnel: 0,
        norm_intensity: 0.2,
        replacement_cycle_days: 30
    },
    {
        id: 'pb_3',
        name: 'Дезинфектант "CLIN-DES" (санузлы)',
        sku: 'PB-DES-02',
        color: '#ef4444', // Red
        price: 1620,
        stock: 150,
        supplier_id: '33333333-3333-3333-3333-333333333333',
        norm_area: 0.8,
        norm_personnel: 0.5,
        norm_intensity: 0.4,
        replacement_cycle_days: 25
    },

    // VILEDA PROFESSIONAL: Expert Systems
    {
        id: 'vp_1',
        name: 'Система UltraSpeed Pro (Ведро+Отжим)',
        sku: 'VP-USP-KIT',
        color: '#3b82f6',
        price: 12800,
        stock: 40,
        supplier_id: '44444444-4444-4444-4444-444444444444',
        norm_area: 1.0,
        norm_personnel: 0.5,
        norm_intensity: 0,
        replacement_cycle_days: 730
    },
    {
        id: 'vp_2',
        name: 'МОП МикроСпид Плюс (Blue)',
        sku: 'VP-MSP-B',
        color: '#3b82f6',
        price: 1450,
        stock: 400,
        supplier_id: '44444444-4444-4444-4444-444444444444',
        norm_area: 3.0,
        norm_personnel: 2.0,
        norm_intensity: 0.1,
        replacement_cycle_days: 90
    },
    {
        id: 'vp_3',
        name: 'Салфетка ПВАмикро (Green/Kitchen)',
        sku: 'VP-PVA-G',
        color: '#22c55e',
        price: 480,
        stock: 800,
        supplier_id: '44444444-4444-4444-4444-444444444444',
        norm_area: 0.5,
        norm_personnel: 3.0,
        norm_intensity: 1.0,
        replacement_cycle_days: 45
    },

    // TORK: Hygiene Systems
    {
        id: 'ka_1',
        name: 'Диспенсер полотенец Tork Matic (H1)',
        sku: 'TK-H1-DISP',
        color: '#6b7280', // Gray
        price: 8500,
        stock: 60,
        supplier_id: '55555555-5555-5555-5555-555555555555',
        norm_area: 1.0,
        norm_personnel: 0.1,
        norm_intensity: 0.05,
        replacement_cycle_days: 3650
    },
    {
        id: 'ka_2',
        name: 'Полотенца в рулонах Tork Matic',
        sku: 'TK-H1-ROLL',
        color: '#6b7280',
        price: 1250,
        stock: 1000,
        supplier_id: '55555555-5555-5555-5555-555555555555',
        norm_area: 0,
        norm_personnel: 0.5,
        norm_intensity: 2.5,
        replacement_cycle_days: 7
    }
];
