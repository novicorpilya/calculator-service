import { supabase } from '@/services/supabase.service';
import type { RealtimePostgresChangesPayload } from '@supabase/supabase-js';
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
            // 1. Check if we have a session first to avoid 406/401 network errors
            const {
                data: { session },
            } = await supabase.auth.getSession();
            if (!session) {
                return DEFAULT_CALCULATOR_CONFIG;
            }

            // Using maybeSingle() instead of single() to avoid 406 Not Acceptable when row is missing
            const { data, error } = await supabase
                .from('system_settings')
                .select('value')
                .eq('key', SETTINGS_KEY)
                .maybeSingle();

            if (error) {
                // PGRST116 = JSON object not found (row missing)
                // 42501 = RLS violation (not authorized)
                // 401 = Network/Auth issues
                if (['PGRST116', '42501', '401'].includes(error.code)) {
                    // Fail gracefully to defaults
                    return DEFAULT_CALCULATOR_CONFIG;
                }
                console.warn('Error fetching settings:', error);
                return DEFAULT_CALCULATOR_CONFIG;
            }

            if (!data || !data.value) {
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
        const { error } = await supabase.from('system_settings').upsert(
            {
                key: SETTINGS_KEY,
                value: config,
                updated_at: new Date().toISOString(),
            },
            { onConflict: 'key' }
        );

        if (error) throw error;

        // Fire & Forget Audit Log
        this.logConfigChange(config);
    },

    async logConfigChange(newConfig: CalculatorConfig) {
        try {
            const {
                data: { user },
            } = await supabase.auth.getUser();
            if (!user) return;

            await supabase.from('audit_logs').insert({
                action: 'CONFIG_UPDATE',
                entity_type: 'calculator_config',
                entity_id: SETTINGS_KEY,
                user_id: user.id,
                details: {
                    formula_mode: newConfig.formula.isAdvanced ? 'advanced' : 'visual',
                    base_method: newConfig.formula.baseMethod,
                },
            });
        } catch (err) {
            console.error('Failed to write audit log', err);
        }
    },

    async getAuditLogs(limit = 50) {
        const { data, error } = await supabase
            .from('audit_logs')
            .select('*, profiles:user_id (email)')
            .eq('entity_type', 'calculator_config')
            .order('created_at', { ascending: false })
            .limit(limit);

        if (error) throw error;
        return data || [];
    },

    /**
     * Subscribe to changes in configuration
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
                    filter: `key=eq.${SETTINGS_KEY}`,
                },
                (payload: RealtimePostgresChangesPayload<Record<string, unknown>>) => {
                    const newRecord = payload.new as { value?: CalculatorConfig };
                    if (newRecord && newRecord.value) {
                        // Merge with default to ensure structural integrity
                        callback({ ...DEFAULT_CALCULATOR_CONFIG, ...newRecord.value });
                    }
                }
            )
            .subscribe();
    },
};
