import { z } from 'zod';
import type { SupabaseClient } from '@supabase/supabase-js';
import { wrapError } from '@/core/utils/errors';
import type { ActionResult, VoidResult } from '@/core/types/results';

export const NotificationSchema = z.object({
    id: z.string().uuid(),
    user_id: z.string().uuid(),
    title: z.string(),
    message: z.string(),
    type: z.string().default('info'),
    link: z.string().nullable().optional(),
    is_read: z.boolean().default(false),
    metadata: z.record(z.string(), z.unknown()).nullable().optional(),
    created_at: z.string(),
});

export type Notification = z.infer<typeof NotificationSchema>;

export interface INotificationService {
    getNotifications(): Promise<ActionResult<Notification[]>>;
    markAsRead(id: string): Promise<VoidResult>;
    markAllAsRead(): Promise<VoidResult>;
    deleteNotification(id: string): Promise<VoidResult>;
    clearAll(): Promise<VoidResult>;
    notify(userId: string, title: string, message: string, params?: Partial<Notification>): Promise<VoidResult>;
    subscribe(userId: string, callback: (payload: { eventType: string; new: Notification; old: Notification }) => void): () => void;
}

export class NotificationService implements INotificationService {
    private supabase: SupabaseClient;
    constructor(supabase: SupabaseClient) {
        this.supabase = supabase;
    }

    async getNotifications(): Promise<ActionResult<Notification[]>> {
        try {
            const { data, error } = await this.supabase
                .from('notifications')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(50);

            if (error) return { success: false, error: wrapError(error) };

            return { success: true, data: data as Notification[] };
        } catch (error) {
            return { success: false, error: wrapError(error) };
        }
    }

    async markAsRead(id: string): Promise<VoidResult> {
        try {
            const { error } = await this.supabase
                .from('notifications')
                .update({ is_read: true })
                .eq('id', id);

            if (error) return { success: false, error: wrapError(error) };

            return { success: true };
        } catch (error) {
            return { success: false, error: wrapError(error) };
        }
    }

    async markAllAsRead(): Promise<VoidResult> {
        try {
            const { data: { user } } = await this.supabase.auth.getUser();
            if (!user) return { success: false, error: { message: 'Not authenticated' } };

            const { error } = await this.supabase
                .from('notifications')
                .update({ is_read: true })
                .eq('user_id', user.id)
                .eq('is_read', false);

            if (error) return { success: false, error: wrapError(error) };

            return { success: true };
        } catch (error) {
            return { success: false, error: wrapError(error) };
        }
    }

    async deleteNotification(id: string): Promise<VoidResult> {
        try {
            const { error } = await this.supabase
                .from('notifications')
                .delete()
                .eq('id', id);

            if (error) return { success: false, error: wrapError(error) };
            return { success: true };
        } catch (error) {
            return { success: false, error: wrapError(error) };
        }
    }

    async clearAll(): Promise<VoidResult> {
        try {
            const { data: { user } } = await this.supabase.auth.getUser();
            if (!user) return { success: false, error: { message: 'Not authenticated' } };

            const { error } = await this.supabase
                .from('notifications')
                .delete()
                .eq('user_id', user.id);

            if (error) return { success: false, error: wrapError(error) };
            return { success: true };
        } catch (error) {
            return { success: false, error: wrapError(error) };
        }
    }

    async notify(
        userId: string,
        title: string,
        message: string,
        params: Partial<Notification> = {}
    ): Promise<VoidResult> {
        try {
            const { error } = await this.supabase
                .from('notifications')
                .insert({
                    user_id: userId,
                    title,
                    message,
                    ...params,
                });

            if (error) return { success: false, error: wrapError(error) };

            return { success: true };
        } catch (error) {
            return { success: false, error: wrapError(error) };
        }
    }

    subscribe(userId: string, callback: (payload: { eventType: string; new: Notification; old: Notification }) => void): () => void {
        const channel = this.supabase
            .channel(`public:notifications:user_id=eq.${userId}`)
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'notifications',
                    filter: `user_id=eq.${userId}`
                },
                (payload) => {
                    callback({
                        eventType: payload.eventType,
                        new: payload.new as Notification,
                        old: payload.old as Notification
                    });
                }
            )
            .subscribe();

        return () => {
            channel.unsubscribe();
        };
    }
}
