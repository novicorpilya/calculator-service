import {
    type SupabaseClient,
    type RealtimeChannel,
} from '@supabase/supabase-js';
import {
    CHAT_CHANNELS,
    type Message,
    type MessageEventType,
    type ReadEventPayload,
    type TypingEventPayload,
    type ChatEventPayload,
    type HistoryClearedPayload,
    type MessageAckPayload,
} from '../types';

export interface IBroadcastService {
    broadcastNewMessage(message: Message): Promise<boolean>;
    broadcastMessageUpdate(message: Message): Promise<boolean>;
    broadcastMessageDelete(message: Message): Promise<boolean>;
    broadcastMessagesRead(
        receiverId: string,
        calculationId?: string,
        readerId?: string
    ): Promise<boolean>;
    broadcastClearHistory(userId: string, contactId: string): Promise<boolean>;
    broadcastMessageAck(ack: MessageAckPayload): Promise<boolean>;
    broadcastNewMessageWithRetry(message: Message): Promise<boolean>;
    subscribeToMessages(
        callback: (payload: ChatEventPayload, eventType: MessageEventType) => void,
        calculationId?: string,
        userId?: string
    ): () => void;
    broadcastProjectPulse(calcId: string | number, type: string): Promise<boolean>;
    subscribeToProjects(
        callback: (payload: { id: string; type: string; ts: number; isSignal?: boolean }) => void
    ): () => void;
    releaseChannel(channelName: string): void;
}

/**
 * BroadcastService 2.1 - Unified Channel Management & Reliable Delivery
 */
export class BroadcastService implements IBroadcastService {
    private client: SupabaseClient;
    // Unified cache for all channel objects
    private channelCache: Map<string, { channel: RealtimeChannel; refCount: number }> = new Map();
    private pendingSubscriptions: Map<string, Promise<RealtimeChannel>> = new Map();
    private ackHandlers: Map<string, (payload: MessageAckPayload) => void> = new Map();

    constructor(client: SupabaseClient) {
        this.client = client;
    }

    private async getOrCreateChannel(channelName: string, attempt = 1): Promise<RealtimeChannel> {
        const existing = this.channelCache.get(channelName);
        if (existing) {
            if (['joined', 'joining'].includes(existing.channel.state)) {
                return existing.channel;
            }
            // If closed/errored, cleanup and restart
            if (['closed', 'errored'].includes(existing.channel.state)) {
                this.cleanupChannel(channelName);
            }
        }

        if (this.pendingSubscriptions.has(channelName)) {
            return this.pendingSubscriptions.get(channelName)!;
        }

        const connectionPromise = new Promise<RealtimeChannel>((resolve, reject) => {
            // Optimize: Disable presence for all broadcast channels.
            // Presence is handled by PresenceService (global_presence) separately.
            const channel = this.client.channel(channelName, {
                config: {
                    broadcast: { self: false },
                }
            });

            // Setup basic listeners
            channel.on(
                'broadcast',
                { event: 'delivery_ack' },
                ({ payload }: { payload: MessageAckPayload }) => {
                    const handler = this.ackHandlers.get(payload.messageId);
                    if (handler) {
                        handler(payload);
                    }
                }
            );

            const timeout = setTimeout(() => {
                this.pendingSubscriptions.delete(channelName);
                this.client.removeChannel(channel);
                reject(new Error(`Subscription TIMED_OUT for ${channelName} after 15s`));
            }, 15000);

            channel.subscribe(async (status) => {
                if (status === 'SUBSCRIBED') {
                    clearTimeout(timeout);
                    this.pendingSubscriptions.delete(channelName);
                    this.channelCache.set(channelName, { channel, refCount: (existing?.refCount || 0) });
                    resolve(channel);
                } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
                    clearTimeout(timeout);
                    this.pendingSubscriptions.delete(channelName);
                    this.client.removeChannel(channel);
                    
                    if (attempt < 4) {
                        const delay = attempt * 1500;
                        console.warn(`[Broadcast] Re-trying subscription for ${channelName} (attempt ${attempt + 1}) in ${delay}ms...`);
                        setTimeout(() => {
                            this.getOrCreateChannel(channelName, attempt + 1).then(resolve).catch(reject);
                        }, delay);
                    } else {
                        reject(new Error(`Channel ${status} on ${channelName}`));
                    }
                }
            });
        });

        this.pendingSubscriptions.set(channelName, connectionPromise);
        return connectionPromise;
    }

    /**
     * Release a channel reference. When refCount drops to 0, the channel is cleaned up.
     * Should be called by unsubscribe callbacks.
     */
    releaseChannel(channelName: string): void {
        const entry = this.channelCache.get(channelName);
        if (!entry) return;

        entry.refCount = Math.max(0, entry.refCount - 1);
        
        if (entry.refCount === 0) {
            console.debug(`[Broadcast] Releasing channel ${channelName} (no more refs)`);
            this.cleanupChannel(channelName);
        }
    }

    private cleanupChannel(channelName: string) {
        const entry = this.channelCache.get(channelName);
        if (entry) {
            this.client.removeChannel(entry.channel);
            this.channelCache.delete(channelName);
        }
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
        } catch (err) {
            console.error(`[Broadcast] Failed to send ${event} to ${channelName}`, err);
            return false;
        }
    }

    async broadcastNewMessage(message: Message): Promise<boolean> {
        if (message.calculation_id) {
            // 1. Send to the project room (for those who have it open)
            this.sendBroadcast(`${CHAT_CHANNELS.CHAT_PREFIX}${message.calculation_id}`, 'new_message', message);
            
            // 2. Trigger global pulse (for generic list updates)
            this.broadcastProjectPulse(message.calculation_id, 'NEW_MESSAGE');

            // 3. IMPORTANT: If there is a specific receiver, send to their private channel too!
            // This makes the notification "Mgnovenno" (Instant) just like in Direct Chat.
            if (message.receiver_id) {
                this.sendBroadcast(`user_updates_${message.receiver_id}`, 'new_message', message);
            }
            return true;
        }

        // Direct message sync
        if (message.sender_id) {
            this.sendBroadcast(`user_updates_${message.sender_id}`, 'new_message', message);
        }

        return this.sendBroadcast(`user_updates_${message.receiver_id}`, 'new_message', message);
    }

    async broadcastMessageUpdate(message: Message): Promise<boolean> {
        const channelName = message.calculation_id
            ? `${CHAT_CHANNELS.CHAT_PREFIX}${message.calculation_id}`
            : `user_updates_${message.receiver_id}`;

        if (message.sender_id) {
            this.sendBroadcast(`user_updates_${message.sender_id}`, 'message_updated', message);
        }

        return this.sendBroadcast(channelName, 'message_updated', message);
    }

    async broadcastMessageDelete(message: Message): Promise<boolean> {
        const channelName = message.calculation_id
            ? `${CHAT_CHANNELS.CHAT_PREFIX}${message.calculation_id}`
            : `user_updates_${message.receiver_id}`;

        if (message.sender_id) {
            this.sendBroadcast(`user_updates_${message.sender_id}`, 'message_deleted', message);
        }

        return this.sendBroadcast(channelName, 'message_deleted', message);
    }

    async broadcastMessageAck(ack: MessageAckPayload): Promise<boolean> {
        const channelName = `user_updates_${ack.senderId}`;
        console.debug(`[Broadcast] Sending ACK to ${channelName} for ${ack.messageId}`);
        return this.sendBroadcast(channelName, 'delivery_ack', ack);
    }

    async broadcastNewMessageWithRetry(message: Message, maxRetries = 2): Promise<boolean> {
        const attempt = async (retryCount: number): Promise<boolean> => {
            let acknowledged = false;
            const ackPromise = new Promise<void>((resolve) => {
                const handler = (payload: MessageAckPayload) => {
                    if (payload.messageId === message.id) {
                        acknowledged = true;
                        resolve();
                    }
                };
                this.ackHandlers.set(message.id, handler);
                // 5s wait for ACK
                setTimeout(() => resolve(), 5000);
            });

            const sent = await this.broadcastNewMessage(message);
            if (!sent) return false;

            await ackPromise;
            this.ackHandlers.delete(message.id);

            if (acknowledged) {
                console.debug(`[Broadcast] Message ${message.id} delivered successfully.`);
                return true;
            }

            if (retryCount < maxRetries) {
                console.warn(`[Broadcast] No ACK for ${message.id}. Retrying (${retryCount + 1}/${maxRetries})...`);
                return attempt(retryCount + 1);
            }

            console.error(`[Broadcast] Message ${message.id} failed after ${maxRetries} retries.`);
            return false;
        };

        return attempt(0);
    }

    async broadcastMessagesRead(
        receiverId: string,
        calculationId?: string,
        readerId?: string
    ): Promise<boolean> {
        if (calculationId) {
            // 1. Notify the project room
            this.sendBroadcast(`${CHAT_CHANNELS.CHAT_PREFIX}${calculationId}`, 'messages_read', {
                readerId,
                calculationId,
                receiverId,
            });
            
            // 2. Identify the other participant to notify their personal channel (for count sync)
            if (readerId) {
                // Signal to the reader's other tabs
                this.sendBroadcast(`user_updates_${readerId}`, 'messages_read', {
                    readerId,
                    calculationId,
                    receiverId,
                });
            }
            
            // 3. Signal to the receiver (the one whose messages were read) for instant double-ticks
            if (receiverId && receiverId !== readerId) {
                this.sendBroadcast(`user_updates_${receiverId}`, 'messages_read', {
                    readerId,
                    calculationId,
                    receiverId,
                });
            }
            return true;
        }

        return this.sendBroadcast(`user_updates_${receiverId}`, 'messages_read', {
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

    subscribeToMessages(
        callback: (payload: ChatEventPayload, eventType: MessageEventType) => void,
        calculationId?: string,
        userId?: string
    ): () => void {
        const channelName = calculationId
            ? `${CHAT_CHANNELS.CHAT_PREFIX}${calculationId}`
            : userId
            ? `user_updates_${userId}`
            : CHAT_CHANNELS.GLOBAL_SYNC;

        // If a specific user is specified, also subscribe to Global Sync for project-wide events
        if (userId && channelName !== CHAT_CHANNELS.GLOBAL_SYNC) {
            this.subscribeToMessages(callback, undefined, undefined); // Recursive call for Global Sync
        }

        let isInitialJoin = true;

        this.getOrCreateChannel(channelName).then((channel) => {
            const entry = this.channelCache.get(channelName);
            if (entry) {
                entry.refCount++;
            }

            channel
                .on('broadcast', { event: 'new_message' }, ({ payload }: { payload: Message }) =>
                    callback(payload, 'INSERT')
                )
                .on('broadcast', { event: 'message_updated' }, ({ payload }: { payload: Message }) =>
                    callback(payload, 'UPDATE')
                )
                .on('broadcast', { event: 'message_deleted' }, ({ payload }: { payload: Message }) =>
                    callback(payload, 'DELETE')
                )
                .on('broadcast', { event: 'history_cleared' }, ({ payload }: { payload: HistoryClearedPayload }) =>
                    callback(payload as unknown as Message, 'DELETE')
                )
                .on('broadcast', { event: 'messages_read' }, ({ payload }: { payload: ReadEventPayload }) =>
                    callback(payload, 'READ')
                )
                .on('broadcast', { event: 'typing' }, ({ payload }: { payload: TypingEventPayload }) =>
                    callback({ id: 'typing-signal', ...payload } as ChatEventPayload, 'TYPING')
                )
                .on('broadcast', { event: 'delivery_ack' }, ({ payload }: { payload: MessageAckPayload }) => {
                    // This is also handled in getOrCreateChannel for the retry logic, 
                    // but we pass it to the UI here to show "Delivered" status.
                    callback(payload, 'ACK');
                });

            if (isInitialJoin && channel.state === 'joined') {
                // Already joined, trigger initial signal if needed
                isInitialJoin = false;
            }
        });

        return () => {
            const entry = this.channelCache.get(channelName);
            if (entry) {
                entry.refCount--;
                if (entry.refCount <= 0) {
                    this.cleanupChannel(channelName);
                }
            }
        };
    }

    async broadcastProjectPulse(calcId: string | number, type: string = 'UPDATE'): Promise<boolean> {
        return this.sendBroadcast(CHAT_CHANNELS.GLOBAL_SYNC, 'project_pulse', {
            id: String(calcId),
            type,
            ts: Date.now(),
        });
    }

    subscribeToProjects(
        callback: (payload: { id: string; type: string; ts: number; isSignal?: boolean }) => void
    ): () => void {
        const channelName = CHAT_CHANNELS.GLOBAL_SYNC;
        
        this.getOrCreateChannel(channelName).then(channel => {
            const entry = this.channelCache.get(channelName);
            if (entry) {
                entry.refCount++;
            }

            channel
                .on('broadcast', { event: 'project_pulse' }, ({ payload }) => {
                    callback({ ...(payload as { id: string; type: string; ts: number }), isSignal: true });
                })
                .on('postgres_changes', { event: '*', schema: 'public', table: 'calculations' }, (payload) => {
                    const id = (payload.new as { id?: string | number })?.id || (payload.old as { id?: string | number })?.id;
                    if (id) callback({ id: String(id), type: payload.eventType, ts: Date.now() });
                });
        });

        return () => this.releaseChannel(channelName);
    }
}
