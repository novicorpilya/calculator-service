import { supabase } from './supabase'
import { auditService } from './audit.service'
import type { User } from '@/features/auth/auth.types'

export interface Invitation {
    id: string;
    email: string;
    role: 'client' | 'manager' | 'admin';
    token: string;
    expires_at: string;
    status: 'pending' | 'used' | 'expired';
}

/**
 * Service for administrative tasks, user management and invitations.
 */
export const adminService = {
    async getInvitations(): Promise<Invitation[]> {
        const { data, error } = await supabase
            .from('invitations')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data || [];
    },

    async getUsers(): Promise<User[]> {
        const { data, error } = await supabase
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
    },

    async createInvitation(email: string, role: 'client' | 'manager' | 'admin'): Promise<Invitation> {
        const token = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
        const { data: { user } } = await supabase.auth.getUser();

        const { data, error } = await supabase
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
        await auditService.logAction('invitation_created', 'invitation', data.id, { email, role });

        return data;
    },

    async deleteInvitation(id: string): Promise<void> {
        const { error } = await supabase
            .from('invitations')
            .delete()
            .eq('id', id);
        if (error) throw error;

        // Логируем удаление
        await auditService.logAction('invitation_deleted', 'invitation', id);
    },

    async updateUserRole(userId: string, newRole: 'client' | 'manager' | 'admin'): Promise<void> {
        const { error } = await supabase
            .from('profiles')
            .update({ role: newRole })
            .eq('id', userId);

        if (error) throw error;

        // Логируем смену роли
        await auditService.logAction('role_updated', 'profile', userId, { new_role: newRole });
    }
}
