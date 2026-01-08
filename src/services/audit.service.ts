import type { SupabaseClient } from '@supabase/supabase-js';

export interface AuditLog {
    id: string;
    created_at: string;
    user_id: string;
    action: string;
    entity_type: string;
    entity_id?: string;
    details: Record<string, unknown>;
    profiles?: {
        email: string;
    };
}

export interface IAuditLogService {
    logAction(
        action: string,
        entityType: string,
        entityId?: string,
        details?: Record<string, unknown>
    ): Promise<void>;
    getLogs(limit?: number): Promise<AuditLog[]>;
}

export class AuditLogService implements IAuditLogService {
    private supabase: SupabaseClient;

    constructor(supabase: SupabaseClient) {
        this.supabase = supabase;
    }

    async logAction(
        action: string,
        entityType: string,
        entityId?: string,
        details: Record<string, unknown> = {}
    ): Promise<void> {
        const { data: { user } } = await this.supabase.auth.getUser();
        if (!user) return;

        const { error } = await this.supabase
            .from('audit_logs')
            .insert({
                user_id: user.id,
                action,
                entity_type: entityType,
                entity_id: entityId,
                details
            });

        if (error) console.error('Failed to log action:', error);
    }

    async getLogs(limit = 50): Promise<AuditLog[]> {
        const { data, error } = await this.supabase
            .from('audit_logs')
            .select(`
                *,
                profiles:user_id (email)
            `)
            .order('created_at', { ascending: false })
            .limit(limit);

        if (error) throw error;
        return data || [];
    }
}
