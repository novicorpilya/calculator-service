import { type SupabaseClient, type RealtimeChannel } from '@supabase/supabase-js';
import { CHAT_CHANNELS, type Message, type MessageEventType } from '../types';

export interface IBroadcastService {

    broadcastMessagesRead(receiverId: string, calculationId?: string): Promise<boolean>;
    broadcastClearHistory(userId: string, contactId: string): Promise<boolean>;
    subscribeToMessages(
        callback: (payload: Message, eventType: MessageEventType) => void,
        calculationId?: string,
        userId?: string
    ): () => void;

    // Sync Signals (Master Projects Stream)
    broadcastProjectPulse(calcId: string | number, type: string): Promise<boolean>;
    subscribeToProjects(callback: (payload: { id: string; type: string; ts: number; isSignal?: boolean }) => void): () => void;
}

/**
 * BroadcastService - High Efficiency Implementation
 * 
 * Performance Optimizations:
 * 1. Persistent Channel Cache: Reuses established channels instead of connect-destroy cycles.
 * 2. Rapid Delivery: Doesn't block on subscription status if the channel is already open.
 * 3. Connection Resilience: Automatically handles re-subscriptions.
 */
export class BroadcastService implements IBroadcastService {
    private client: SupabaseClient;
    private channelCache: Map<string, RealtimeChannel> = new Map();
    private pendingSubscriptions: Map<string, Promise<RealtimeChannel>> = new Map();

    constructor(client: SupabaseClient) {
        this.client = client;
    }

    private async getOrCreateChannel(channelName: string): Promise<RealtimeChannel> {
        // 1. Check if we already have a healthy channel
        if (this.channelCache.has(channelName)) {
            const cached = this.channelCache.get(channelName)!;
            if (cached.state === 'joined') return cached;

            // If it's dead, clean it up
            if (cached.state === 'closed' || cached.state === 'errored') {
                this.channelCache.delete(channelName);
                this.client.removeChannel(cached);
            }
        }

        // 2. Check if a connection is already in progress
        if (this.pendingSubscriptions.has(channelName)) {
            return this.pendingSubscriptions.get(channelName)!;
        }

        // 3. Create a new connection promise
        const connectionPromise = new Promise<RealtimeChannel>((resolve, reject) => {
            const channel = this.client.channel(channelName);

            const timeout = setTimeout(() => {
                cleanup();
                reject(new Error(`Subscription TIMED_OUT for ${channelName}`));
            }, 5000);

            const cleanup = () => {
                clearTimeout(timeout);
                this.pendingSubscriptions.delete(channelName);
            };

            channel.subscribe(async (status) => {
                if (status === 'SUBSCRIBED') {
                    cleanup();
                    this.channelCache.set(channelName, channel);
                    resolve(channel);
                } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
                    cleanup();
                    this.client.removeChannel(channel);
                    reject(new Error(`Channel ${status} on ${channelName}`));
                }
            });
        });

        this.pendingSubscriptions.set(channelName, connectionPromise);
        return connectionPromise;
    }

    private async sendBroadcast(channelName: string, event: string, payload: unknown): Promise<boolean> {
        try {
            const channel = await this.getOrCreateChannel(channelName);

            // Channel is guaranteed to be in 'joined' state if getOrCreateChannel resolved
            channel.send({
                type: 'broadcast',
                event,
                payload,
            });

            return true;
        } catch {
            // Silently handle transient errors to avoid console spam, but return false
            return false;
        }
    }



    async broadcastMessagesRead(receiverId: string, calculationId?: string): Promise<boolean> {
        const channelName = calculationId
            ? `${CHAT_CHANNELS.CHAT_PREFIX}${calculationId}`
            : `user_updates_${receiverId}`;
        return this.sendBroadcast(channelName, 'messages_read', { receiverId, calculationId });
    }

    async broadcastClearHistory(userId: string, contactId: string): Promise<boolean> {
        // Notify the OTHER participant that history was cleared
        return this.sendBroadcast(`user_updates_${contactId}`, 'history_cleared', {
            sender_id: userId,
            receiver_id: contactId
        });
    }

    subscribeToMessages(
        callback: (payload: Message, eventType: MessageEventType) => void,
        calculationId?: string,
        userId?: string
    ): () => void {
        let channelName: string = CHAT_CHANNELS.GLOBAL_SYNC;

        if (calculationId) {
            channelName = `${CHAT_CHANNELS.CHAT_PREFIX}${calculationId}`;
        } else if (userId) {
            channelName = `user_updates_${userId}`;
        }

        // Note: For subscriptions we use a separate channel instance to avoid sharing state with generic broadcast channel
        // but we still benefit from using the library's channel management
        let isInitialJoin = true;
        const subscriptionChannel = this.client.channel(`sub_${channelName}_${Date.now()}`)
            .on('broadcast', { event: 'message_updated' }, ({ payload }) => callback(payload, 'UPDATE'))
            .on('broadcast', { event: 'message_deleted' }, ({ payload }) => callback(payload, 'DELETE'))
            .on('broadcast', { event: 'messages_read' }, ({ payload }) => callback(payload as any as Message, 'READ'))
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'messages',
                filter: calculationId ? `calculation_id=eq.${calculationId}` : undefined
            }, (payload) => {
                const eventType = payload.eventType as 'INSERT' | 'UPDATE' | 'DELETE';
                if (eventType === 'INSERT' || eventType === 'UPDATE') {
                    // For Direct Messages (legacy), marking as read is an UPDATE on 'is_read'.
                    // We must pass this through so useUnreadCount invalidates queries.
                    callback(payload.new as Message, eventType);
                } else if (eventType === 'DELETE') {
                    callback(payload.old as Message, 'DELETE');
                }
            })
            // CRITICAL FIX: Listen for READ MARKER updates to refresh Unread Counts
            // When a user reads a chat in another tab, this triggers an UPDATE event here
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'chat_read_markers'
            }, (payload) => {
                // We send a dummy 'UPDATE' event to force the subscriber (useUnreadCount) to invalidate cache
                const dummyMsg = { id: 'marker-update', ...payload.new } as unknown as Message;
                callback(dummyMsg, 'UPDATE');
            })
            .subscribe((status) => {
                if (status === 'SUBSCRIBED') {
                    if (!isInitialJoin) {
                        // This is a reconnection gap. Signal to consumer to refetch.
                        // We use a dummy message with a custom event type or specialized handler.
                        callback({ id: 'reconnect-signal' } as any, 'RECONNECT');
                    }
                    isInitialJoin = false;
                }
            });

        return () => {
            this.client.removeChannel(subscriptionChannel);
        };
    }
    async broadcastProjectPulse(calcId: string | number, type: string = 'UPDATE'): Promise<boolean> {
        return this.sendBroadcast(CHAT_CHANNELS.GLOBAL_SYNC, 'project_pulse', {
            id: String(calcId),
            type,
            ts: Date.now()
        });
    }

    subscribeToProjects(callback: (payload: { id: string; type: string; ts: number; isSignal?: boolean }) => void): () => void {
        const channelName = `sync_stream_${Date.now()}`;

        const subscriptionChannel = this.client.channel(channelName)
            .on('broadcast', { event: 'project_pulse' }, ({ payload }) => {
                callback({ ...payload, isSignal: true });
            })
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'calculations'
            }, (payload) => {
                const newRecord = payload.new as { id?: string | number };
                const oldRecord = payload.old as { id?: string | number };
                const id = newRecord?.id || oldRecord?.id;
                if (id) {
                    callback({
                        id: String(id),
                        type: payload.eventType,
                        ts: Date.now()
                    });
                }
            })
            .subscribe();

        return () => {
            this.client.removeChannel(subscriptionChannel);
        };
    }
}
