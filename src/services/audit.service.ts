import { supabase } from './supabase';

export interface AuditLog {
    id: string;
    created_at: string;
    user_id: string;
    action: string;
    entity_type: string;
    entity_id?: string;
    details: any;
    // Helper property from join
    profiles?: {
        email: string;
    };
}

export const auditService = {
    async logAction(
        action: string,
        entityType: string,
        entityId?: string,
        details: any = {}
    ) {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { error } = await supabase
            .from('audit_logs')
            .insert({
                user_id: user.id,
                action,
                entity_type: entityType,
                entity_id: entityId,
                details
            });

        if (error) console.error('Failed to log action:', error);
    },

    async getLogs(limit = 50): Promise<AuditLog[]> {
        const { data, error } = await supabase
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
};
