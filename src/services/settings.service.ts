import { supabase } from '@/services/supabase/client';
import type { CalculatorConfig } from '@/features/calculator/calculator-config.types'; // Type-only import
import { DEFAULT_CALCULATOR_CONFIG } from '@/features/calculator/calculator-config.types';

const SETTINGS_KEY = 'calculator_main';

export const SettingsService = {
    /**
     * Fetch the current calculator configuration from the server.
     * Returns default config if not found or on error.
     */
    async getCalculatorConfig(): Promise<CalculatorConfig> {
        try {
            const { data, error } = await supabase
                .from('system_settings')
                .select('value')
                .eq('key', SETTINGS_KEY)
                .single();

            if (error) {
                if (error.code === 'PGRST116') { // Not found
                    // Initialize if missing
                    await this.saveCalculatorConfig(DEFAULT_CALCULATOR_CONFIG);
                    return DEFAULT_CALCULATOR_CONFIG;
                }
                console.error('Error fetching settings:', error);
                return DEFAULT_CALCULATOR_CONFIG;
            }

            // Merge with default to ensure new fields are present
            return { ...DEFAULT_CALCULATOR_CONFIG, ...data.value };
        } catch (err) {
            console.error('Unexpected error fetching settings:', err);
            return DEFAULT_CALCULATOR_CONFIG;
        }
    },

    /**
     * Save the new configuration to the server.
     */
    async saveCalculatorConfig(config: CalculatorConfig): Promise<void> {
        const { error } = await supabase
            .from('system_settings')
            .upsert({ 
                key: SETTINGS_KEY, 
                value: config,
                updated_at: new Date().toISOString()
            }, { onConflict: 'key' });

        if (error) throw error;

        // Fire & Forget Audit Log
        this.logConfigChange(config);
    },

    async logConfigChange(newConfig: CalculatorConfig) {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            await supabase.from('audit_logs').insert({
                action: 'CONFIG_UPDATE',
                entity_type: 'calculator_config', // Updated from entity
                entity_id: SETTINGS_KEY,
                user_id: user.id,                 // Updated from performed_by
                details: {
                    formula_mode: newConfig.formula.isAdvanced ? 'advanced' : 'visual',
                    base_method: newConfig.formula.baseMethod
                }
            });
        } catch (err) {
            console.error('Failed to write audit log', err);
        }
    },

    async getAuditLogs(limit = 50) {
        const { data, error } = await supabase
            .from('audit_logs')
            .select('*, profiles:user_id (email)') // Added profile join for better UI
            .eq('entity_type', 'calculator_config') // Updated from entity
            .order('created_at', { ascending: false })
            .limit(limit);
        
        if (error) throw error;
        return data || [];
    },

    /**
     * Subscribe to changes in configuration functionality
     */
    subscribeToConfigChanges(callback: (newConfig: CalculatorConfig) => void) {
        return supabase
            .channel('system_settings_changes')
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'system_settings',
                    filter: `key=eq.${SETTINGS_KEY}`
                },
                (payload) => {
                    if (payload.new && payload.new.value) {
                         // Merge with default to ensure structural integrity
                        callback({ ...DEFAULT_CALCULATOR_CONFIG, ...payload.new.value });
                    }
                }
            )
            .subscribe();
    }
};
