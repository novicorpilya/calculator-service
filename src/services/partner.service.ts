import { type SupabaseClient } from '@supabase/supabase-js';
import type { ActionResult, VoidResult } from '@/core/types/results';

// ============================================================
// Partner Types
// ============================================================

export interface Partner {
    id: string;
    name: string;
    api_key_hash: string;
    is_active: boolean;
    rate_limit_quota: number;
    allowed_domains: string[];
    request_count: number;
    last_request_at: string | null;
    created_at: string;
    updated_at: string;
}

export interface PartnerLead {
    id: string;
    partner_id: string | null;
    facility_type: string | null;
    area: number | null;
    estimated_total: number | null;
    client_email: string | null;
    client_phone: string | null;
    full_data: Record<string, unknown> | null;
    created_at: string;
    partner?: Partner;
}

export interface CreatePartnerResult {
    partner: Partner;
    apiKey: string; // Plain-text key, shown only once
}

// ============================================================
// Partner Service Interface
// ============================================================

export interface IPartnerService {
    getPartners(): Promise<ActionResult<Partner[]>>;
    createPartner(name: string): Promise<ActionResult<CreatePartnerResult>>;
    updatePartner(
        id: string,
        updates: Partial<
            Pick<Partner, 'name' | 'is_active' | 'rate_limit_quota' | 'allowed_domains'>
        >
    ): Promise<ActionResult<Partner>>;
    deletePartner(id: string): Promise<VoidResult>;
    getPartnerLeads(partnerId?: string): Promise<ActionResult<PartnerLead[]>>;
}

// ============================================================
// Partner Service Implementation
// ============================================================

export class PartnerService implements IPartnerService {
    private supabase: SupabaseClient;

    constructor(supabase: SupabaseClient) {
        this.supabase = supabase;
    }

    private wrapError(error: unknown): { message: string } {
        return { message: error instanceof Error ? error.message : String(error) };
    }

    /**
     * Generates a cryptographically secure API key and its SHA-256 hash.
     */
    private async generateApiKey(): Promise<{ plainKey: string; hash: string }> {
        // Generate 32 random bytes -> 64 hex characters
        const array = new Uint8Array(32);
        crypto.getRandomValues(array);
        const plainKey = Array.from(array, (byte) => byte.toString(16).padStart(2, '0')).join('');

        // Hash the key using SubtleCrypto
        const encoder = new TextEncoder();
        const data = encoder.encode(plainKey);
        const hashBuffer = await crypto.subtle.digest('SHA-256', data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        const hash = hashArray.map((byte) => byte.toString(16).padStart(2, '0')).join('');

        return { plainKey, hash };
    }

    async getPartners(): Promise<ActionResult<Partner[]>> {
        try {
            const { data, error } = await this.supabase
                .from('partners')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) {
                return { success: false, error: this.wrapError(error) };
            }

            return { success: true, data: data as Partner[] };
        } catch (error) {
            return { success: false, error: this.wrapError(error) };
        }
    }

    async createPartner(name: string): Promise<ActionResult<CreatePartnerResult>> {
        try {
            const { plainKey, hash } = await this.generateApiKey();

            const { data, error } = await this.supabase
                .from('partners')
                .insert({ name, api_key_hash: hash })
                .select()
                .single();

            if (error) {
                return { success: false, error: this.wrapError(error) };
            }

            return {
                success: true,
                data: {
                    partner: data as Partner,
                    apiKey: plainKey,
                },
            };
        } catch (error) {
            return { success: false, error: this.wrapError(error) };
        }
    }

    async updatePartner(
        id: string,
        updates: Partial<
            Pick<Partner, 'name' | 'is_active' | 'rate_limit_quota' | 'allowed_domains'>
        >
    ): Promise<ActionResult<Partner>> {
        try {
            const { data, error } = await this.supabase
                .from('partners')
                .update({ ...updates, updated_at: new Date().toISOString() })
                .eq('id', id)
                .select()
                .single();

            if (error) {
                return { success: false, error: this.wrapError(error) };
            }

            return { success: true, data: data as Partner };
        } catch (error) {
            return { success: false, error: this.wrapError(error) };
        }
    }

    async deletePartner(id: string): Promise<VoidResult> {
        try {
            const { error } = await this.supabase.from('partners').delete().eq('id', id);

            if (error) {
                return { success: false, error: this.wrapError(error) };
            }

            return { success: true };
        } catch (error) {
            return { success: false, error: this.wrapError(error) };
        }
    }

    async getPartnerLeads(partnerId?: string): Promise<ActionResult<PartnerLead[]>> {
        try {
            let query = this.supabase
                .from('partner_leads')
                .select(
                    `
                    *,
                    partner:partners(id, name)
                `
                )
                .order('created_at', { ascending: false })
                .limit(100);

            if (partnerId) {
                query = query.eq('partner_id', partnerId);
            }

            const { data, error } = await query;

            if (error) {
                return { success: false, error: this.wrapError(error) };
            }

            return { success: true, data: data as PartnerLead[] };
        } catch (error) {
            return { success: false, error: this.wrapError(error) };
        }
    }
}
