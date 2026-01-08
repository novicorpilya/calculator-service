import type { SupabaseClient } from '@supabase/supabase-js';

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
    created_at?: string;
    updated_at?: string;
}

export type CreateInventoryItemData = Omit<InventoryItemMaster, 'id' | 'created_at' | 'updated_at'>;

export interface IInventoryService {
    getGlobalItems(): Promise<InventoryItemMaster[]>;
    upsertItem(item: Partial<InventoryItemMaster> & { name: string }): Promise<InventoryItemMaster>;
    deleteItem(id: string): Promise<void>;
}

/**
 * Service for managing global inventory catalog and item norms.
 */
export class InventoryService implements IInventoryService {
    private supabase: SupabaseClient;

    constructor(supabase: SupabaseClient) {
        this.supabase = supabase;
    }

    /**
     * Fetches all inventory items from the master catalog.
     */
    async getGlobalItems(): Promise<InventoryItemMaster[]> {
        const { data, error } = await this.supabase
            .from('inventory_items')
            .select('*')
            .order('name', { ascending: true });

        if (error) {
            console.warn('Inventory table might not exist or empty, returning specialized HoReCa mock data');
            return [
                // PRO-BRITE: Specialized Chemicals
                {
                    id: 'pb_1',
                    name: 'Средство для гриля "GRILL-CLEANER" (5л)',
                    sku: 'PB-GRIL-05',
                    color: '#22c55e',
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
                    color: '#3b82f6',
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
                    color: '#ef4444',
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
                    id: 'tk_1',
                    name: 'Диспенсер полотенец Tork Matic (H1)',
                    sku: 'TK-H1-DISP',
                    color: '#6b7280',
                    price: 8500,
                    stock: 60,
                    supplier_id: '55555555-5555-5555-5555-555555555555',
                    norm_area: 1.0,
                    norm_personnel: 0.1,
                    norm_intensity: 0.05,
                    replacement_cycle_days: 3650
                },
                {
                    id: 'tk_2',
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
        }
        return data || [];
    }

    /**
     * Creates or updates an inventory item in the catalog.
     */
    async upsertItem(item: Partial<InventoryItemMaster> & { name: string }): Promise<InventoryItemMaster> {
        const { data, error } = await this.supabase
            .from('inventory_items')
            .upsert({
                ...item,
                updated_at: new Date().toISOString()
            })
            .select()
            .single();

        if (error) throw error;
        return data;
    }

    /**
     * Deletes an inventory item from the catalog by ID.
     */
    async deleteItem(id: string): Promise<void> {
        const { error } = await this.supabase
            .from('inventory_items')
            .delete()
            .eq('id', id);

        if (error) throw error;
    }
}
