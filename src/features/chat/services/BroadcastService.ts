import {
    type SupabaseClient,
    type RealtimeChannel,
    type RealtimePostgresChangesPayload,
} from '@supabase/supabase-js';
import {
    CHAT_CHANNELS,
    type Message,
    type MessageEventType,
    type ReadEventPayload,
    type TypingEventPayload,
    type ChatEventPayload,
    type HistoryClearedPayload,
} from '../types';

export interface IBroadcastService {
    broadcastNewMessage(message: Message): Promise<boolean>;
    broadcastMessagesRead(
        receiverId: string,
        calculationId?: string,
        readerId?: string
    ): Promise<boolean>;
    broadcastClearHistory(userId: string, contactId: string): Promise<boolean>;
    subscribeToMessages(
        callback: (payload: ChatEventPayload, eventType: MessageEventType) => void,
        calculationId?: string,
        userId?: string
    ): () => void;

    // Sync Signals (Master Projects Stream)
    broadcastProjectPulse(calcId: string | number, type: string): Promise<boolean>;
    subscribeToProjects(
        callback: (payload: { id: string; type: string; ts: number; isSignal?: boolean }) => void
    ): () => void;
}

/**
 * BroadcastService - High Efficiency Implementation
 */
export class BroadcastService implements IBroadcastService {
    private client: SupabaseClient;
    private channelCache: Map<string, RealtimeChannel> = new Map();
    private pendingSubscriptions: Map<string, Promise<RealtimeChannel>> = new Map();

    constructor(client: SupabaseClient) {
        this.client = client;
    }

    private async getOrCreateChannel(channelName: string): Promise<RealtimeChannel> {
        if (this.channelCache.has(channelName)) {
            const cached = this.channelCache.get(channelName)!;
            if (cached.state === 'joined') return cached;

            if (cached.state === 'closed' || cached.state === 'errored') {
                this.channelCache.delete(channelName);
                this.client.removeChannel(cached);
            }
        }

        if (this.pendingSubscriptions.has(channelName)) {
            return this.pendingSubscriptions.get(channelName)!;
        }

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

    private async sendBroadcast(
        channelName: string,
        event: string,
        payload: unknown
    ): Promise<boolean> {
        try {
            const channel = await this.getOrCreateChannel(channelName);
            channel.send({
                type: 'broadcast',
                event,
                payload,
            });
            return true;
        } catch {
            return false;
        }
    }

    async broadcastNewMessage(message: Message): Promise<boolean> {
        const channelName = message.calculation_id
            ? `${CHAT_CHANNELS.CHAT_PREFIX}${message.calculation_id}`
            : `user_updates_${message.receiver_id}`;

        if (!message.calculation_id && message.sender_id) {
            this.sendBroadcast(`user_updates_${message.sender_id}`, 'new_message', message);
        }

        return this.sendBroadcast(channelName, 'new_message', message);
    }

    async broadcastMessagesRead(
        receiverId: string,
        calculationId?: string,
        readerId?: string
    ): Promise<boolean> {
        const channelName = calculationId
            ? `${CHAT_CHANNELS.CHAT_PREFIX}${calculationId}`
            : `user_updates_${receiverId}`;
        return this.sendBroadcast(channelName, 'messages_read', {
            readerId,
            calculationId,
            receiverId,
        });
    }

    async broadcastClearHistory(userId: string, contactId: string): Promise<boolean> {
        return this.sendBroadcast(`user_updates_${contactId}`, 'history_cleared', {
            sender_id: userId,
            receiver_id: contactId,
        });
    }

    private subscriptionCache: Map<string, { channel: RealtimeChannel; count: number }> = new Map();

    subscribeToMessages(
        callback: (payload: ChatEventPayload, eventType: MessageEventType) => void,
        calculationId?: string,
        userId?: string
    ): () => void {
        let channelName: string = CHAT_CHANNELS.GLOBAL_SYNC;
        if (calculationId) {
            channelName = `${CHAT_CHANNELS.CHAT_PREFIX}${calculationId}`;
        } else if (userId) {
            channelName = `user_updates_${userId}`;
        }

        let cacheEntry = this.subscriptionCache.get(channelName);

        if (!cacheEntry) {
            let isInitialJoin = true;
            const channel = this.client.channel(channelName);

            channel
                .on('broadcast', { event: 'new_message' }, ({ payload }: { payload: Message }) =>
                    callback(payload, 'INSERT')
                )
                .on(
                    'broadcast',
                    { event: 'message_updated' },
                    ({ payload }: { payload: Message }) => callback(payload, 'UPDATE')
                )
                .on(
                    'broadcast',
                    { event: 'message_deleted' },
                    ({ payload }: { payload: Message }) => callback(payload, 'DELETE')
                )
                .on(
                    'broadcast',
                    { event: 'history_cleared' },
                    ({ payload }: { payload: HistoryClearedPayload }) =>
                        callback(payload as unknown as Message, 'DELETE')
                )
                .on(
                    'broadcast',
                    { event: 'messages_read' },
                    ({ payload }: { payload: ReadEventPayload }) => callback(payload, 'READ')
                )
                .on(
                    'broadcast',
                    { event: 'typing' },
                    ({ payload }: { payload: TypingEventPayload }) =>
                        callback({ id: 'typing-signal', ...payload } as ChatEventPayload, 'TYPING')
                );

            channel.on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'chat_read_markers',
                },
                (payload: RealtimePostgresChangesPayload<Record<string, unknown>>) => {
                    if (payload.new) {
                        callback(
                            { id: 'marker-update', ...payload.new } as ChatEventPayload,
                            'UPDATE'
                        );
                    }
                }
            );

            channel.subscribe((status) => {
                if (status === 'SUBSCRIBED') {
                    if (!isInitialJoin)
                        callback({ id: 'reconnect-signal' } as ChatEventPayload, 'RECONNECT');
                    isInitialJoin = false;
                }
            });

            cacheEntry = { channel, count: 0 };
            this.subscriptionCache.set(channelName, cacheEntry);
        }

        cacheEntry.count++;

        return () => {
            const currentEntry = this.subscriptionCache.get(channelName);
            if (!currentEntry) return;

            currentEntry.count--;
            if (currentEntry.count <= 0) {
                this.client.removeChannel(currentEntry.channel);
                this.subscriptionCache.delete(channelName);
            }
        };
    }

    async broadcastProjectPulse(
        calcId: string | number,
        type: string = 'UPDATE'
    ): Promise<boolean> {
        return this.sendBroadcast(CHAT_CHANNELS.GLOBAL_SYNC, 'project_pulse', {
            id: String(calcId),
            type,
            ts: Date.now(),
        });
    }

    subscribeToProjects(
        callback: (payload: { id: string; type: string; ts: number; isSignal?: boolean }) => void
    ): () => void {
        const channelName = `sync_stream_${Date.now()}`;

        const subscriptionChannel = this.client
            .channel(channelName)
            .on('broadcast', { event: 'project_pulse' }, ({ payload }) => {
                callback({
                    ...(payload as { id: string; type: string; ts: number }),
                    isSignal: true,
                });
            })
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'calculations',
                },
                (payload: RealtimePostgresChangesPayload<Record<string, unknown>>) => {
                    const newRecord = payload.new as { id?: string | number };
                    const oldRecord = payload.old as { id?: string | number };
                    const id = newRecord?.id || oldRecord?.id;
                    if (id) {
                        callback({
                            id: String(id),
                            type: payload.eventType,
                            ts: Date.now(),
                        });
                    }
                }
            )
            .subscribe();

        return () => {
            this.client.removeChannel(subscriptionChannel);
        };
    }
}
