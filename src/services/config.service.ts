import { type SupabaseClient } from '@supabase/supabase-js';
import { DEFAULT_BUSINESS_RULES, type BusinessRules } from '@/core/config/business.config';

export interface IConfigService {
    getBusinessRules(): Promise<BusinessRules>;
}

export class ConfigService implements IConfigService {
    private client: SupabaseClient;
    private static cache: BusinessRules | null = null;

    constructor(client: SupabaseClient) {
        this.client = client;
    }

    async getBusinessRules(): Promise<BusinessRules> {
        if (ConfigService.cache) return ConfigService.cache;

        try {
            const { data, error } = await this.client
                .from('system_settings')
                .select('value')
                .eq('key', 'business_rules')
                .maybeSingle();

            if (error || !data) {
                return DEFAULT_BUSINESS_RULES;
            }

            ConfigService.cache = { ...DEFAULT_BUSINESS_RULES, ...data.value };
            return ConfigService.cache!;
        } catch {
            return DEFAULT_BUSINESS_RULES;
        }
    }

    static clearCache() {
        this.cache = null;
    }
}
