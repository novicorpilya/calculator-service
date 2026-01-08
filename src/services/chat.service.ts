import { supabase } from './supabase';
import type { SyncPayload, SyncEventType } from '@/features/dashboard/dashboard.types';

export interface Message {
    id: string;
    sender_id: string;
    receiver_id: string;
    calculation_id?: string;
    content: string;
    image_url?: string;
    voice_url?: string;
    voice_duration?: number;
    created_at: string;
    is_read?: boolean;
    is_edited?: boolean;
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
     * Fetch ALL messages between two users (including those from projects)
     */
    async getAllMessagesWithUser(userA: string, userB: string): Promise<Message[]> {
        const { data, error } = await supabase
            .from('messages')
            .select('*')
            .or(`and(sender_id.eq.${userA},receiver_id.eq.${userB}),and(sender_id.eq.${userB},receiver_id.eq.${userA})`)
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
     * Update an existing message (e.g., mark as edited or read)
     */
    async updateMessage(messageId: string, payload: Partial<Message>): Promise<Message> {
        const { data, error } = await supabase
            .from('messages')
            .update({ ...payload, is_edited: payload.content ? true : payload.is_edited })
            .eq('id', messageId)
            .select()
            .single();

        if (error) throw error;

        // Broadcast update
        const channel = supabase.channel(this.CHANNELS.GLOBAL_SYNC);
        await channel.subscribe(async (status) => {
            if (status === 'SUBSCRIBED') {
                await channel.send({
                    type: 'broadcast',
                    event: 'message_updated',
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
    subscribeToMessages(callback: (msg: Message, eventType?: 'INSERT' | 'UPDATE' | 'DELETE') => void, calculationId?: string) {
        const channelName = calculationId
            ? `${this.CHANNELS.CHAT_PREFIX}${calculationId}`
            : this.CHANNELS.GLOBAL_SYNC;

        const channel = supabase.channel(`sub_${channelName}_${Date.now()}`)
            .on(
                'broadcast',
                { event: 'new_message' },
                ({ payload }: { payload: Message }) => {
                    if (!calculationId || payload.calculation_id === calculationId) {
                        callback(payload, 'INSERT');
                    }
                }
            )
            .on(
                'broadcast',
                { event: 'message_updated' },
                ({ payload }: { payload: Message }) => {
                    if (!calculationId || payload.calculation_id === calculationId) {
                        callback(payload, 'UPDATE');
                    }
                }
            )
            .on(
                'broadcast',
                { event: 'message_deleted' },
                ({ payload }: { payload: { messageId: string } }) => {
                    // Create a dummy message object for deletion if needed, or refine callback
                    callback({ id: payload.messageId } as Message, 'DELETE');
                }
            )
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'messages',
                    filter: calculationId ? `calculation_id=eq.${calculationId}` : undefined
                },
                (payload) => {
                    if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
                        callback(payload.new as Message, payload.eventType);
                    } else if (payload.eventType === 'DELETE') {
                        callback(payload.old as Message, 'DELETE');
                    }
                }
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

    /**
     * Voice Message Uploading Service
     */
    async uploadVoiceMessage(audioBlob: Blob): Promise<string> {
        const fileName = `${crypto.randomUUID()}.webm`;
        const filePath = `voice/${fileName}`;

        const { error: uploadError } = await supabase.storage
            .from('voice-messages')
            .upload(filePath, audioBlob, {
                contentType: 'audio/webm',
                cacheControl: '3600'
            });

        if (uploadError) throw uploadError;

        const { data } = supabase.storage
            .from('voice-messages')
            .getPublicUrl(filePath);

        return data.publicUrl;
    },

    async getRecipients(userId: string) {
        try {
            // 1. Get ONLY calculations linked to THIS user (Privacy & Performance fix)
            const { data: linkedCalculations } = await supabase
                .from('calculations')
                .select('user_id, manager_id')
                .or(`user_id.eq.${userId},manager_id.eq.${userId}`);

            const { data: allMsgs } = await supabase
                .from('messages')
                .select('sender_id, receiver_id')
                .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`);

            const linkedIds = new Set<string>();
            linkedCalculations?.forEach(c => {
                if (c.user_id && c.user_id !== userId) linkedIds.add(c.user_id);
                if (c.manager_id && c.manager_id !== userId) linkedIds.add(c.manager_id);
            });
            allMsgs?.forEach(m => {
                if (m.sender_id !== userId) linkedIds.add(m.sender_id);
                if (m.receiver_id !== userId) linkedIds.add(m.receiver_id);
            });

            if (linkedIds.size === 0) return [];

            // 3. EFFECTIVE BATCHING: Fetch all profiles AND all last messages in just 2 queries total
            const { data: profiles } = await supabase
                .from('profiles')
                .select('id, organization_name, role, first_name, last_name')
                .in('id', Array.from(linkedIds)) as {
                    data: {
                        id: string;
                        organization_name: string | null;
                        role: string;
                        first_name: string | null;
                        last_name: string | null;
                    }[] | null
                };

            if (!profiles) return [];

            // Fetch the last message for EACH linked user in ONE query
            // Using a specialized filter to get only messages involving current user
            const { data: lastMessages } = await supabase
                .from('messages')
                .select('content, created_at, sender_id, receiver_id, image_url, voice_url')
                .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
                .order('created_at', { ascending: false });

            // Group by contact ID to find the newest for each
            const lastMsgMap = new Map<string, {
                content: string | null;
                created_at: string;
                sender_id: string;
                receiver_id: string;
                image_url: string | null;
                voice_url: string | null;
            }>();
            lastMessages?.forEach(m => {
                const contactId = m.sender_id === userId ? m.receiver_id : m.sender_id;
                if (!lastMsgMap.has(contactId)) {
                    lastMsgMap.set(contactId, m);
                }
            });

            const result = profiles.map(p => {
                const lastMsg = lastMsgMap.get(p.id);
                let contentSnippet = lastMsg?.content || '';
                if (lastMsg?.image_url) contentSnippet = '📷 Фотография';
                if (lastMsg?.voice_url) contentSnippet = '🎤 Голосовое сообщение';

                return {
                    ...p,
                    lastMessage: lastMsg ? {
                        content: contentSnippet,
                        created_at: lastMsg.created_at,
                        sender_id: lastMsg.sender_id
                    } : undefined
                };
            });

            // Final Sort: Most recent interaction first
            return result.sort((a, b) => {
                const dateA = a.lastMessage?.created_at || '0';
                const dateB = b.lastMessage?.created_at || '0';
                return dateB.localeCompare(dateA);
            });
        } catch (error) {
            console.error('Error fetching recipients:', error);
            return [];
        }
    },

    /**
     * Permanent clearance of chat history (including storage).
     */
    async clearChatHistory(userA: string, userB: string): Promise<void> {
        // 1. Get messages with attachments before deletion
        const { data: messages, error: fetchError } = await supabase
            .from('messages')
            .select('image_url, voice_url')
            .or(`and(sender_id.eq.${userA},receiver_id.eq.${userB}),and(sender_id.eq.${userB},receiver_id.eq.${userA})`);

        if (fetchError) throw fetchError;

        // 2. Delete messages from table
        const { error: deleteError } = await supabase
            .from('messages')
            .delete()
            .or(`and(sender_id.eq.${userA},receiver_id.eq.${userB}),and(sender_id.eq.${userB},receiver_id.eq.${userA})`);

        if (deleteError) throw deleteError;

        // 3. Collect ALL media files (images and voices)
        const mediaUrls = messages?.flatMap(m => [m.image_url, m.voice_url]).filter(Boolean) as string[];

        const filesToDelete = mediaUrls
            .filter(url => url.includes('/attachments/'))
            .map(url => url.split('/attachments/').pop())
            .filter(Boolean) as string[];

        if (filesToDelete.length > 0) {
            await supabase.storage.from('attachments').remove(filesToDelete).catch(console.error);
        }

        const voiceToDelete = mediaUrls
            .filter(url => url.includes('/voice-messages/'))
            .map(url => url.split('/voice-messages/').pop())
            .filter(Boolean) as string[];

        if (voiceToDelete.length > 0) {
            await supabase.storage.from('voice-messages').remove(voiceToDelete).catch(console.error);
        }
    },

    /**
     * Clear all revision messages for a specific project.
     */
    async clearProjectHistory(calculationId: string): Promise<void> {
        // 1. Get messages with attachments
        const { data: messages, error: fetchError } = await supabase
            .from('messages')
            .select('image_url, voice_url')
            .eq('calculation_id', calculationId);

        if (fetchError) throw fetchError;

        // 2. Delete messages
        const { error: deleteError } = await supabase
            .from('messages')
            .delete()
            .eq('calculation_id', calculationId);

        if (deleteError) throw deleteError;

        // 3. Cleanup storage
        const mediaUrls = messages?.flatMap(m => [m.image_url, m.voice_url]).filter(Boolean) as string[];

        const filesToDelete = mediaUrls
            .filter(url => url.includes('/attachments/'))
            .map(url => url.split('/attachments/').pop())
            .filter(Boolean) as string[];

        if (filesToDelete.length > 0) {
            await supabase.storage.from('attachments').remove(filesToDelete).catch(console.error);
        }

        const voiceToDelete = mediaUrls
            .filter(url => url.includes('/voice-messages/'))
            .map(url => url.split('/voice-messages/').pop())
            .filter(Boolean) as string[];

        if (voiceToDelete.length > 0) {
            await supabase.storage.from('voice-messages').remove(voiceToDelete).catch(console.error);
        }
    },

    /**
     * Delete a single message and its associated media
     */
    async deleteMessage(messageId: string): Promise<void> {
        // 1. Get message data for media cleanup
        const { data: message, error: fetchError } = await supabase
            .from('messages')
            .select('image_url, voice_url')
            .eq('id', messageId)
            .single();

        if (fetchError) throw fetchError;

        // 2. Delete from database
        const { error: deleteError } = await supabase
            .from('messages')
            .delete()
            .eq('id', messageId);

        if (deleteError) throw deleteError;

        // 3. Cleanup media
        if (message.image_url) {
            const fileName = message.image_url.split('/attachments/').pop();
            if (fileName) await supabase.storage.from('attachments').remove([fileName]).catch(console.error);
        }
        if (message.voice_url) {
            const fileName = message.voice_url.split('/voice-messages/').pop();
            if (fileName) await supabase.storage.from('voice-messages').remove([fileName]).catch(console.error);
        }

        // Broadcast deletion
        const channel = supabase.channel(this.CHANNELS.GLOBAL_SYNC);
        await channel.subscribe(async (status) => {
            if (status === 'SUBSCRIBED') {
                await channel.send({
                    type: 'broadcast',
                    event: 'message_deleted',
                    payload: { messageId }
                });
                supabase.removeChannel(channel);
            }
        });
    },

    /**
     * Mark all messages from a specific sender to the current user as read.
     */
    async markAsRead(senderId: string, receiverId: string, calculationId?: string): Promise<void> {
        let query = supabase
            .from('messages')
            .update({ is_read: true })
            .eq('sender_id', senderId)
            .eq('receiver_id', receiverId)
            .eq('is_read', false);

        if (calculationId) {
            query = query.eq('calculation_id', calculationId);
        }

        const { error } = await query;
        if (error) {
            console.error('Error marking messages as read:', error);
            throw error;
        }

        // Broadcast that messages were read to update UI everywhere
        const channel = supabase.channel('chat_notifications');
        await channel.subscribe(async (status) => {
            if (status === 'SUBSCRIBED') {
                await channel.send({
                    type: 'broadcast',
                    event: 'messages_read',
                    payload: { senderId, receiverId, calculationId }
                });
                supabase.removeChannel(channel);
            }
        });
    },

    /**
     * Get unread messages count for a specific user
     */
    async getUnreadCount(userId: string): Promise<{ [key: string]: number }> {
        const { data, error } = await supabase
            .from('messages')
            .select('sender_id, calculation_id')
            .eq('receiver_id', userId)
            .eq('is_read', false);

        if (error) {
            console.error('Error fetching unread count:', error);
            return {};
        }

        const counts: { [key: string]: number } = {};
        data?.forEach(msg => {
            const key = msg.calculation_id || msg.sender_id;
            counts[key] = (counts[key] || 0) + 1;
        });

        return counts;
    }
};
