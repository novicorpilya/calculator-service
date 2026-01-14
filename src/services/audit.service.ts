import type { SupabaseClient } from '@supabase/supabase-js';
import { z } from 'zod';
import { logger } from '@/core/logging';
import type { ActionResult, VoidResult } from '@/core/types/results';

export const AuditLogSchema = z.object({
    id: z.string().uuid(),
    created_at: z.string(),
    user_id: z.string().uuid(),
    action: z.string(),
    entity_type: z.string(),
    entity_id: z.string().optional().nullable(),
    details: z.record(z.string(), z.unknown()),
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
    getLogs(limit?: number): Promise<ActionResult<AuditLog[]>>;
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

    async getLogs(limit = 50): Promise<ActionResult<AuditLog[]>> {
        try {
            const { data, error } = await this.supabase
                .from('audit_logs')
                .select(
                    `
                    *,
                    profiles:user_id (email)
                `
                )
                .order('created_at', { ascending: false })
                .limit(limit);

            if (error) return { success: false, error: this.wrapError(error) };

            const validated = z.array(AuditLogSchema).safeParse(data);
            if (!validated.success) {
                logger.error('[AuditLogService:Validation:Error]', { error: validated.error });
                return { success: false, error: { message: 'Data format error in audit logs' } };
            }

            return { success: true, data: validated.data };
        } catch (error) {
            return { success: false, error: this.wrapError(error) };
        }
    }
}
