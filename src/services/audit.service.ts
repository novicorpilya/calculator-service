import type { SupabaseClient } from '@supabase/supabase-js';
import { z } from 'zod';
import { logger } from '@/core/logging';
import type { ActionResult, VoidResult } from '@/core/types/results';

export const AuditLogSchema = z.object({
    id: z.string().uuid(),
    created_at: z.string(),
    user_id: z.string().uuid().nullable().optional(),
    action: z.string(),
    entity_type: z.string(),
    entity_id: z.string().optional().nullable(),
    details: z.record(z.string(), z.unknown()).nullable().optional(),
    profiles: z
        .object({
            email: z.string().email(),
        })
        .optional()
        .nullable(),
});

export type AuditLog = z.infer<typeof AuditLogSchema>;

export interface IAuditLogService {
    logAction(
        action: string,
        entityType: string,
        entityId?: string,
        details?: Record<string, unknown>
    ): Promise<VoidResult>;
    getLogs(params?: {
        page?: number;
        pageSize?: number;
        actionFilter?: string;
        userIdFilter?: string;
    }): Promise<ActionResult<{ data: AuditLog[]; total: number }>>;
}

export class AuditLogService implements IAuditLogService {
    private supabase: SupabaseClient;

    constructor(supabase: SupabaseClient) {
        this.supabase = supabase;
    }

    private wrapError(error: unknown): { message: string } {
        return { message: error instanceof Error ? error.message : String(error) };
    }

    async logAction(
        action: string,
        entityType: string,
        entityId?: string,
        details: Record<string, unknown> = {}
    ): Promise<VoidResult> {
        try {
            const {
                data: { user },
            } = await this.supabase.auth.getUser();
            if (!user) return { success: false, error: { message: 'Not authenticated' } };

            const { error } = await this.supabase.from('audit_logs').insert({
                user_id: user.id,
                action,
                entity_type: entityType,
                entity_id: entityId,
                details,
            });

            if (error) {
                logger.error('Failed to log action', { error });
                return { success: false, error: this.wrapError(error) };
            }
            return { success: true };
        } catch (error) {
            return { success: false, error: this.wrapError(error) };
        }
    }

    async getLogs(params?: {
        page?: number;
        pageSize?: number;
        actionFilter?: string;
        userIdFilter?: string;
    }): Promise<ActionResult<{ data: AuditLog[]; total: number }>> {
        try {
            const page = params?.page || 1;
            const pageSize = params?.pageSize || 20;
            const from = (page - 1) * pageSize;
            const to = from + pageSize - 1;

            let query = this.supabase
                .from('audit_logs')
                .select(
                    `*, profiles:user_id (email)`,
                    { count: 'exact' }
                )
                .order('created_at', { ascending: false })
                .range(from, to);

            if (params?.actionFilter && params.actionFilter !== 'all') {
                query = query.eq('action', params.actionFilter);
            }

            if (params?.userIdFilter && params.userIdFilter !== 'all') {
                query = query.eq('user_id', params.userIdFilter);
            }

            const { data, error, count } = await query;

            if (error) {
                console.error('[AuditLogService] Fetch error:', error);
                return { success: false, error: this.wrapError(error) };
            }

            const validated = z.array(AuditLogSchema).safeParse(data);
            if (!validated.success) {
                console.error('[AuditLogService] Validation error:', validated.error);
                if (data && data.length > 0) return { success: true, data: { data: data as AuditLog[], total: count || 0 } };
                
                return { success: false, error: { message: 'Data format error in audit logs' } };
            }

            return { 
                success: true, 
                data: {
                    data: validated.data,
                    total: count || 0
                } 
            };
        } catch (error) {
            console.error('[AuditLogService] Catch error:', error);
            return { success: false, error: this.wrapError(error) };
        }
    }
}
