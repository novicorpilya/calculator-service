import { z } from 'zod';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { IAuditLogService } from './audit.service';
import { generateSecureToken } from '@/core/utils/crypto';
import type { User } from '@/features/auth/auth.types';
import { userSchema } from '@/features/auth/auth.validation';
import type { ActionResult, VoidResult } from '@/core/types/results';
import { logger } from '@/core/logging';
import { wrapError } from '@/core/utils/errors';

export const InvitationSchema = z.object({
    id: z.string().uuid(),
    email: z.string().email(),
    role: z.enum(['client', 'manager', 'admin']),
    token: z.string(),
    expires_at: z.string(),
    status: z.enum(['pending', 'used', 'expired']),
});

export type Invitation = z.infer<typeof InvitationSchema>;

export const AdminCalculationSchema = z.object({
    id: z
        .string()
        .uuid()
        .or(z.number().transform((n) => String(n))),
    organization_name: z.string(),
    status: z.string(),
    total_area: z.number().nonnegative(),
    results: z
        .object({
            summary: z.array(z.unknown()).optional(),
            totalAnnualBudget: z.number().optional(),
        })
        .nullable()
        .optional(),
    created_at: z.string(),
});

export type AdminCalculation = z.infer<typeof AdminCalculationSchema>;

export const SystemStatsSchema = z.object({
    totalGlobalBudget: z.number(),
    revenuePipeline: z.number(),
    activeProjects: z.number().int(),
    totalProjects: z.number().int(),
    stages: z.record(z.string(), z.number()),
});

export type SystemStats = z.infer<typeof SystemStatsSchema>;

export interface IAdminService {
    getInvitations(): Promise<ActionResult<Invitation[]>>;
    getUsers(): Promise<ActionResult<User[]>>;
    createInvitation(
        email: string,
        role: 'client' | 'manager' | 'admin'
    ): Promise<ActionResult<Invitation>>;
    deleteInvitation(id: string): Promise<VoidResult>;
    updateUserRole(userId: string, newRole: 'client' | 'manager' | 'admin'): Promise<VoidResult>;
    getAllCalculations(): Promise<ActionResult<AdminCalculation[]>>;
    getSystemStats(): Promise<ActionResult<SystemStats>>;
    deleteUser(userId: string): Promise<VoidResult>;
    setUserStatus(userId: string, status: 'active' | 'blocked'): Promise<VoidResult>;
    adminDeleteCalculation(id: string | number): Promise<VoidResult>;
    adminUpdateCalculationStatus(id: string | number, status: string): Promise<VoidResult>;
}

export class AdminService implements IAdminService {
    private supabase: SupabaseClient;
    private auditService: IAuditLogService;

    constructor(supabase: SupabaseClient, auditService: IAuditLogService) {
        this.supabase = supabase;
        this.auditService = auditService;
    }


    async getInvitations(): Promise<ActionResult<Invitation[]>> {
        try {
            const { data, error } = await this.supabase
                .from('invitations')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) return { success: false, error: wrapError(error) };

            const validated = z.array(InvitationSchema).safeParse(data);
            if (!validated.success) {
                logger.error('[AdminService:Invitations:Validation]', { error: validated.error });
                return {
                    success: false,
                    error: { message: 'Data format error in invitations list' },
                };
            }

            return { success: true, data: validated.data };
        } catch (error) {
            return { success: false, error: wrapError(error) };
        }
    }

    async getUsers(): Promise<ActionResult<User[]>> {
        try {
            const { data, error } = await this.supabase
                .from('profiles')
                .select('id, email, role, organization_name, phone, address, created_at, status')
                .order('created_at', { ascending: false });

            if (error) return { success: false, error: wrapError(error) };

            const rawUsers = (data || []).map((p) => ({
                id: p.id,
                email: p.email,
                role: p.role,
                organizationName: p.organization_name,
                phone: p.phone,
                address: p.address,
                createdAt: p.created_at,
                status: p.status || 'active',
            }));

            const validated = z.array(userSchema).safeParse(rawUsers);
            if (!validated.success) {
                logger.error('[AdminService:Users:Validation]', { error: validated.error });
                return { success: false, error: { message: 'Data format error in users list' } };
            }

            return { success: true, data: validated.data };
        } catch (error) {
            return { success: false, error: wrapError(error) };
        }
    }

    async createInvitation(
        email: string,
        role: 'client' | 'manager' | 'admin'
    ): Promise<ActionResult<Invitation>> {
        try {
            const token = generateSecureToken();
            const {
                data: { user },
            } = await this.supabase.auth.getUser();

            const { data, error } = await this.supabase
                .from('invitations')
                .insert({
                    email,
                    role,
                    token,
                    created_by: user?.id,
                    expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
                })
                .select()
                .single();

            if (error) return { success: false, error: wrapError(error) };

            const validated = InvitationSchema.safeParse(data);
            if (!validated.success) {
                logger.error('[AdminService:CreateInvitation:Validation]', { error: validated.error });
                return {
                    success: false,
                    error: { message: 'Format error after invitation creation' },
                };
            }

            await this.auditService.logAction(
                'invitation_created',
                'invitation',
                validated.data.id,
                { email, role }
            );
            return { success: true, data: validated.data };
        } catch (error) {
            return { success: false, error: wrapError(error) };
        }
    }

    async deleteInvitation(id: string): Promise<VoidResult> {
        try {
            const { error } = await this.supabase.from('invitations').delete().eq('id', id);

            if (error) return { success: false, error: wrapError(error) };

            await this.auditService.logAction('invitation_deleted', 'invitation', id);
            return { success: true };
        } catch (error) {
            return { success: false, error: wrapError(error) };
        }
    }

    async updateUserRole(
        userId: string,
        newRole: 'client' | 'manager' | 'admin'
    ): Promise<VoidResult> {
        try {
            const { error } = await this.supabase
                .from('profiles')
                .update({ role: newRole })
                .eq('id', userId);

            if (error) return { success: false, error: wrapError(error) };

            await this.auditService.logAction('role_updated', 'profile', userId, {
                new_role: newRole,
            });
            return { success: true };
        } catch (error) {
            return { success: false, error: wrapError(error) };
        }
    }

    async getAllCalculations(): Promise<ActionResult<AdminCalculation[]>> {
        try {
            const { data, error } = await this.supabase
                .from('calculations')
                .select('id, organization_name, status, total_area, results, created_at')
                .order('created_at', { ascending: false });

            if (error) return { success: false, error: wrapError(error) };

            const validated = z.array(AdminCalculationSchema).safeParse(data);
            if (!validated.success) {
                logger.error('[AdminService:Calculations:Validation]', { error: validated.error });
                return {
                    success: false,
                    error: { message: 'Data format error in administrative calculation view' },
                };
            }

            return { success: true, data: validated.data };
        } catch (error) {
            return { success: false, error: wrapError(error) };
        }
    }

    async getSystemStats(): Promise<ActionResult<SystemStats>> {
        try {
            const { data: calculations, error: calcError } = await this.supabase
                .from('calculations')
                .select('status, results');

            if (calcError) return { success: false, error: wrapError(calcError) };

            const stats: SystemStats = {
                totalProjects: calculations?.length || 0,
                activeProjects: calculations?.filter((c) => c.status !== 'draft').length || 0,
                totalGlobalBudget: 0,
                revenuePipeline: 0,
                stages: {
                    draft: 0,
                    pending: 0,
                    expert: 0,
                    suppliers: 0,
                    invoice: 0,
                    completed: 0,
                },
            };

            calculations?.forEach((calc) => {
                if (stats.stages[calc.status] !== undefined) {
                    stats.stages[calc.status]++;
                }

                const annualBudget = calc.results?.totalAnnualBudget || 0;
                stats.totalGlobalBudget += annualBudget;

                if (calc.status === 'invoice' || calc.status === 'completed') {
                    stats.revenuePipeline += annualBudget;
                }
            });

            const validated = SystemStatsSchema.safeParse(stats);
            if (!validated.success) {
                logger.error('[AdminService:Stats:Validation]', { error: validated.error });
                return {
                    success: false,
                    error: { message: 'Logic error in system stats calculation' },
                };
            }

            return { success: true, data: validated.data };
        } catch (error) {
            return { success: false, error: wrapError(error) };
        }
    }

    async deleteUser(userId: string): Promise<VoidResult> {
        try {
            const { error } = await this.supabase.rpc('delete_user_v1', {
                user_id_param: userId,
            });

            if (error) return { success: false, error: wrapError(error) };

            await this.auditService.logAction('user_deleted_permanently', 'profile', userId);
            return { success: true };
        } catch (error) {
            return { success: false, error: wrapError(error) };
        }
    }

    async setUserStatus(userId: string, status: 'active' | 'blocked'): Promise<VoidResult> {
        try {
            const { error } = await this.supabase.rpc('set_user_status', {
                user_id_param: userId,
                new_status: status,
            });

            if (error) return { success: false, error: wrapError(error) };

            await this.auditService.logAction(
                status === 'blocked' ? 'user_blocked' : 'user_unblocked',
                'profile',
                userId
            );
            return { success: true };
        } catch (error) {
            return { success: false, error: wrapError(error) };
        }
    }

    async adminDeleteCalculation(id: string | number): Promise<VoidResult> {
        try {
            const { error } = await this.supabase.from('calculations').delete().eq('id', id);

            if (error) return { success: false, error: wrapError(error) };

            await this.auditService.logAction(
                'calculation_deleted_by_admin',
                'calculation',
                id.toString()
            );
            return { success: true };
        } catch (error) {
            return { success: false, error: wrapError(error) };
        }
    }

    async adminUpdateCalculationStatus(id: string | number, status: string): Promise<VoidResult> {
        try {
            const { error } = await this.supabase
                .from('calculations')
                .update({ status, updated_at: new Date().toISOString() })
                .eq('id', id);

            if (error) return { success: false, error: wrapError(error) };

            await this.auditService.logAction(
                'calculation_status_force_updated',
                'calculation',
                id.toString(),
                { new_status: status }
            );
            return { success: true };
        } catch (error) {
            return { success: false, error: wrapError(error) };
        }
    }
}
