import { supabase } from './supabase'

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
    category?: string;
    created_at?: string;
    updated_at?: string;
}

export type CreateInventoryItemData = Omit<InventoryItemMaster, 'id' | 'created_at' | 'updated_at'>;

/**
 * Service for managing global inventory catalog and item norms.
 */
export const inventoryService = {
    /**
     * Fetches all inventory items from the master catalog.
     */
    async getGlobalItems(): Promise<InventoryItemMaster[]> {
        const { data, error } = await supabase
            .from('inventory_items')
            .select('*')
            .order('name', { ascending: true });

        if (error) throw error;
        return data || [];
    },

    /**
     * Creates or updates an inventory item in the catalog.
     */
    async upsertItem(item: Partial<InventoryItemMaster> & { name: string }): Promise<InventoryItemMaster> {
        const { data, error } = await supabase
            .from('inventory_items')
            .upsert({
                ...item,
                updated_at: new Date().toISOString()
            })
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    /**
     * Deletes an inventory item from the catalog by ID.
     */
    async deleteItem(id: string): Promise<void> {
        const { error } = await supabase
            .from('inventory_items')
            .delete()
            .eq('id', id);

        if (error) throw error;
    }
}
