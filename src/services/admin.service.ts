import type { SupabaseClient } from '@supabase/supabase-js';
import type { IAuditLogService } from './audit.service';
import { generateSecureToken } from '@/core/utils/crypto';
import type { User } from '@/features/auth/auth.types';

export interface Invitation {
    id: string;
    email: string;
    role: 'client' | 'manager' | 'admin';
    token: string;
    expires_at: string;
    status: 'pending' | 'used' | 'expired';
}

export interface AdminCalculation {
    id: string;
    organization_name: string;
    status: string;
    total_area: number;
    results: {
        summary?: unknown[];
        totalAnnualBudget?: number;
    } | null;
    created_at: string;
}

export interface SystemStats {
    totalGlobalBudget: number;
    revenuePipeline: number;
    activeProjects: number;
    totalProjects: number;
    stages: Record<string, number>;
}

export interface IAdminService {
    getInvitations(): Promise<Invitation[]>;
    getUsers(): Promise<User[]>;
    createInvitation(email: string, role: 'client' | 'manager' | 'admin'): Promise<Invitation>;
    deleteInvitation(id: string): Promise<void>;
    updateUserRole(userId: string, newRole: 'client' | 'manager' | 'admin'): Promise<void>;
    getAllCalculations(): Promise<AdminCalculation[]>;
    getSystemStats(): Promise<SystemStats>;
    deleteUser(userId: string): Promise<void>;
    setUserStatus(userId: string, status: 'active' | 'blocked'): Promise<void>;
    adminDeleteCalculation(id: string | number): Promise<void>;
    adminUpdateCalculationStatus(id: string | number, status: string): Promise<void>;
}

export class AdminService implements IAdminService {
    private supabase: SupabaseClient;
    private auditService: IAuditLogService;

    constructor(
        supabase: SupabaseClient,
        auditService: IAuditLogService
    ) {
        this.supabase = supabase;
        this.auditService = auditService;
    }

    async getInvitations(): Promise<Invitation[]> {
        const { data, error } = await this.supabase
            .from('invitations')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data || [];
    }

    async getUsers(): Promise<User[]> {
        const { data, error } = await this.supabase
            .from('profiles')
            .select('id, email, role, organization_name, phone, address, created_at')
            .order('created_at', { ascending: false });

        if (error) throw error;
        return (data || []).map(p => ({
            id: p.id,
            email: p.email,
            role: p.role as 'client' | 'manager' | 'admin',
            organizationName: p.organization_name,
            phone: p.phone,
            address: p.address,
            createdAt: p.created_at
        }));
    }

    async createInvitation(email: string, role: 'client' | 'manager' | 'admin'): Promise<Invitation> {
        const token = generateSecureToken();
        const { data: { user } } = await this.supabase.auth.getUser();

        const { data, error } = await this.supabase
            .from('invitations')
            .insert({
                email,
                role,
                token,
                created_by: user?.id,
                expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
            })
            .select()
            .single();

        if (error) throw error;

        // Логируем создание приглашения
        await this.auditService.logAction('invitation_created', 'invitation', data.id, { email, role });

        return data;
    }

    async deleteInvitation(id: string): Promise<void> {
        const { error } = await this.supabase
            .from('invitations')
            .delete()
            .eq('id', id);
        if (error) throw error;

        // Логируем удаление
        await this.auditService.logAction('invitation_deleted', 'invitation', id);
    }

    async updateUserRole(userId: string, newRole: 'client' | 'manager' | 'admin'): Promise<void> {
        const { error } = await this.supabase
            .from('profiles')
            .update({ role: newRole })
            .eq('id', userId);

        if (error) throw error;

        // Логируем смену роли
        await this.auditService.logAction('role_updated', 'profile', userId, { new_role: newRole });
    }

    async getAllCalculations(): Promise<AdminCalculation[]> {
        const { data, error } = await this.supabase
            .from('calculations')
            .select('id, organization_name, status, total_area, results, created_at')
            .order('created_at', { ascending: false });

        if (error) throw error;
        return (data || []) as AdminCalculation[];
    }

    async getSystemStats(): Promise<SystemStats> {
        const { data: calculations, error: calcError } = await this.supabase
            .from('calculations')
            .select('status, results');

        if (calcError) throw calcError;

        const stats: SystemStats = {
            totalProjects: calculations?.length || 0,
            activeProjects: calculations?.filter(c => c.status !== 'draft').length || 0,
            totalGlobalBudget: 0,
            revenuePipeline: 0,
            stages: {
                draft: 0,
                pending: 0,
                expert: 0,
                suppliers: 0,
                invoice: 0,
                completed: 0
            }
        };

        calculations?.forEach(calc => {
            // Count stages
            if (stats.stages[calc.status] !== undefined) {
                stats.stages[calc.status]++;
            }

            // Calculate budgets
            const annualBudget = calc.results?.totalAnnualBudget || 0;
            stats.totalGlobalBudget += annualBudget;

            if (calc.status === 'invoice' || calc.status === 'completed') {
                stats.revenuePipeline += annualBudget;
            }
        });

        return stats;
    }

    async deleteUser(userId: string): Promise<void> {
        const { error } = await this.supabase.rpc('delete_user_v1', {
            user_id_param: userId
        });

        if (error) throw error;

        await this.auditService.logAction('user_deleted_permanently', 'profile', userId);
    }

    async setUserStatus(userId: string, status: 'active' | 'blocked'): Promise<void> {
        const { error } = await this.supabase.rpc('set_user_status', {
            user_id_param: userId,
            new_status: status
        });

        if (error) throw error;

        await this.auditService.logAction(status === 'blocked' ? 'user_blocked' : 'user_unblocked', 'profile', userId);
    }

    async adminDeleteCalculation(id: string | number): Promise<void> {
        const { error } = await this.supabase
            .from('calculations')
            .delete()
            .eq('id', id);

        if (error) throw error;

        await this.auditService.logAction('calculation_deleted_by_admin', 'calculation', id.toString());
    }

    async adminUpdateCalculationStatus(id: string | number, status: string): Promise<void> {
        const { error } = await this.supabase
            .from('calculations')
            .update({ status, updated_at: new Date().toISOString() })
            .eq('id', id);

        if (error) throw error;

        await this.auditService.logAction('calculation_status_force_updated', 'calculation', id.toString(), { new_status: status });
    }
}
