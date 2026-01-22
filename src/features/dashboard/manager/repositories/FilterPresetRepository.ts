import { SupabaseClient } from '@supabase/supabase-js';
import { type FilterPreset } from '../manager.types';
import { type ActionResult, type VoidResult } from '@/core/types/results';

export interface IFilterPresetRepository {
    getPresets(userId: string): Promise<ActionResult<FilterPreset[]>>;
    createPreset(preset: Partial<FilterPreset>): Promise<ActionResult<FilterPreset>>;
    updatePreset(id: string, updates: Partial<FilterPreset>): Promise<ActionResult<FilterPreset>>;
    deletePreset(id: string): Promise<VoidResult>;
}

export class FilterPresetRepository implements IFilterPresetRepository {
    private client: SupabaseClient;

    constructor(client: SupabaseClient) {
        this.client = client;
    }

    async getPresets(userId: string): Promise<ActionResult<FilterPreset[]>> {
        try {
            const { data, error } = await this.client
                .from('manager_filter_presets')
                .select('*')
                .eq('user_id', userId)
                .order('created_at', { ascending: false });

            if (error) return { success: false, error };
            return { success: true, data: data || [] };
        } catch (error) {
            return { success: false, error: { message: (error as Error).message } };
        }
    }

    async createPreset(preset: Partial<FilterPreset>): Promise<ActionResult<FilterPreset>> {
        try {
            const { data, error } = await this.client
                .from('manager_filter_presets')
                .insert(preset)
                .select()
                .single();

            if (error) return { success: false, error };
            return { success: true, data };
        } catch (error) {
            return { success: false, error: { message: (error as Error).message } };
        }
    }

    async updatePreset(
        id: string,
        updates: Partial<FilterPreset>
    ): Promise<ActionResult<FilterPreset>> {
        try {
            const { data, error } = await this.client
                .from('manager_filter_presets')
                .update(updates)
                .eq('id', id)
                .select()
                .single();

            if (error) return { success: false, error };
            return { success: true, data };
        } catch (error) {
            return { success: false, error: { message: (error as Error).message } };
        }
    }

    async deletePreset(id: string): Promise<VoidResult> {
        try {
            const { error } = await this.client
                .from('manager_filter_presets')
                .delete()
                .eq('id', id);

            if (error) return { success: false, error };
            return { success: true };
        } catch (error) {
            return { success: false, error: { message: (error as Error).message } };
        }
    }
}
