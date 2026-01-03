import { supabase } from './supabase';
import type { SyncPayload, SyncEventType } from '@/features/dashboard/dashboard.types';

export interface Message {
    id: string;
    sender_id: string;
    receiver_id: string;
    calculation_id?: string;
    content: string;
    image_url?: string;
    created_at: string;
}

/**
 * Enterprise-grade Communication Service.
 * Implements persistent connection patterns and strict type safety.
 */
export const chatService = {
    // Channel naming constants
    CHANNELS: {
        GLOBAL_SYNC: 'system_global_sync',
        CHAT_PREFIX: 'chat_room_',
    },

    /**
     * Fetch direct messages not tied to a specific project
     */
    async getDirectMessages(userA: string, userB: string): Promise<Message[]> {
        const { data, error } = await supabase
            .from('messages')
            .select('*')
            .or(`and(sender_id.eq.${userA},receiver_id.eq.${userB}),and(sender_id.eq.${userB},receiver_id.eq.${userA})`)
            .is('calculation_id', null)
            .order('created_at', { ascending: true });

        if (error) throw error;
        return data as Message[];
    },

    /**
     * Fetch revision history for a project
     */
    async getCalculationMessages(calculationId: string): Promise<Message[]> {
        const { data, error } = await supabase
            .from('messages')
            .select('*')
            .eq('calculation_id', calculationId)
            .order('created_at', { ascending: true });

        if (error) throw error;
        return data as Message[];
    },

    /**
     * Robust message sending with delivery broadcast
     */
    async sendMessage(payload: Partial<Message>): Promise<Message> {
        const { data, error } = await supabase
            .from('messages')
            .insert([payload])
            .select()
            .single();

        if (error) throw error;

        // Broadcast to specific project stream or global pool
        const channelName = payload.calculation_id
            ? `${this.CHANNELS.CHAT_PREFIX}${payload.calculation_id}`
            : this.CHANNELS.GLOBAL_SYNC;

        const channel = supabase.channel(channelName);
        await channel.subscribe(async (status) => {
            if (status === 'SUBSCRIBED') {
                await channel.send({
                    type: 'broadcast',
                    event: 'new_message',
                    payload: data
                });
                supabase.removeChannel(channel);
            }
        });

        return data as Message;
    },

    /**
     * Secure subscription to messages with automatic cleanup
     */
    subscribeToMessages(callback: (msg: Message) => void, calculationId?: string) {
        const channelName = calculationId
            ? `${this.CHANNELS.CHAT_PREFIX}${calculationId}`
            : this.CHANNELS.GLOBAL_SYNC;

        const channel = supabase.channel(`sub_${channelName}_${Date.now()}`)
            .on(
                'broadcast',
                { event: 'new_message' },
                ({ payload }: { payload: Message }) => {
                    if (!calculationId || payload.calculation_id === calculationId) {
                        callback(payload);
                    }
                }
            )
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'messages',
                    filter: calculationId ? `calculation_id=eq.${calculationId}` : undefined
                },
                (payload) => callback(payload.new as Message)
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    },

    /**
     * High-speed synchronization signal sender
     */
    async sendSyncSignal(calcId: string | number, type: SyncEventType = 'UPDATE') {
        const channel = supabase.channel(this.CHANNELS.GLOBAL_SYNC);
        await channel.subscribe(async (status) => {
            if (status === 'SUBSCRIBED') {
                await channel.send({
                    type: 'broadcast',
                    event: 'project_pulse',
                    payload: { id: String(calcId), type, ts: Date.now() }
                });
                supabase.removeChannel(channel);
            }
        });
    },

    /**
     * Master Project Synchronization Stream
     * Single point of truth for all project-level updates
     */
    subscribeToCalculations(callback: (payload: SyncPayload) => void) {
        const channel = supabase.channel(`sync_stream_${Date.now()}`)
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'calculations' },
                (payload) => {
                    const id = (payload.new as { id?: string | number })?.id || (payload.old as { id?: string | number })?.id;
                    if (id) {
                        callback({
                            id: String(id),
                            type: payload.eventType as SyncEventType,
                            ts: Date.now()
                        });
                    }
                }
            )
            .on(
                'broadcast',
                { event: 'project_pulse' },
                ({ payload }: { payload: SyncPayload }) => {
                    callback({
                        ...payload,
                        isSignal: true
                    });
                }
            )
            .subscribe((status) => {
                if (status === 'CHANNEL_ERROR') {
                    console.error('[Sync:Error] Realtime subscription failed. ACTION REQUIRED:');
                    console.error('1. Ensure "calculations" table is added to "supabase_realtime" publication.');
                    console.error('2. Run "scripts/fix-realtime-sync.sql" in Supabase SQL Editor.');
                } else if (status !== 'SUBSCRIBED' && status !== 'CLOSED') {
                    console.warn(`[Sync:Warn] Channel status: ${status}`);
                }
            });

        return () => {
            supabase.removeChannel(channel);
        };
    },

    /**
     * File Uploading Service
     */
    async uploadAttachment(file: File): Promise<string> {
        const fileExt = file.name.split('.').pop();
        const fileName = `${crypto.randomUUID()}.${fileExt}`;
        const filePath = `chat/${fileName}`;

        const { error: uploadError } = await supabase.storage
            .from('attachments')
            .upload(filePath, file);

        if (uploadError) throw uploadError;

        const { data } = supabase.storage
            .from('attachments')
            .getPublicUrl(filePath);

        return data.publicUrl;
    },

    async getRecipients(userId: string) {
        try {
            // 1. Get IDs from projects (calculations)
            const { data: calcs } = await supabase
                .from('calculations')
                .select('user_id, manager_id')
                .or(`user_id.eq.${userId},manager_id.eq.${userId}`);

            // 2. Get IDs from message history (any interaction)
            const { data: msgs } = await supabase
                .from('messages')
                .select('sender_id, receiver_id')
                .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`);

            const linkedIds = new Set<string>();
            calcs?.forEach(c => {
                if (c.user_id && c.user_id !== userId) linkedIds.add(c.user_id);
                if (c.manager_id && c.manager_id !== userId) linkedIds.add(c.manager_id);
            });
            msgs?.forEach(m => {
                if (m.sender_id !== userId) linkedIds.add(m.sender_id);
                if (m.receiver_id !== userId) linkedIds.add(m.receiver_id);
            });

            if (linkedIds.size === 0) return [];

            const { data: profiles } = await supabase
                .from('profiles')
                .select('id, organization_name, role, first_name, last_name')
                .in('id', Array.from(linkedIds));

            return profiles || [];
        } catch (error) {
            console.error('Error fetching recipients:', error);
            return [];
        }
    }
};
