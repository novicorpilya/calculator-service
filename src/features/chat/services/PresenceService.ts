import { type SupabaseClient, type RealtimeChannel } from '@supabase/supabase-js';
import { logger } from '@/core/logging';

export interface IPresenceService {
    trackUser(userId: string): Promise<void>;
    untrackUser(): Promise<void>;
    subscribeToOnlineUsers(callback: (users: Set<string>) => void): () => void;
}

export class PresenceService implements IPresenceService {
    private channel: RealtimeChannel | null = null;
    private client: SupabaseClient;
    private userId: string | null = null;
    private onlineUsers: Set<string> = new Set();
    private listeners: Set<(users: Set<string>) => void> = new Set();
    private heartbeatInterval: number | null = null;
    private reconnectTimeout: number | null = null;
    private retryCount: number = 0;

    constructor(client: SupabaseClient) {
        this.client = client;
    }

    /**
     * Initialize the presence channel and start tracking.
     */
    private initChannel() {
        if (this.channel) {
            if (this.channel.state === 'closed' || this.channel.state === 'errored') {
                this.teardown();
            } else {
                return;
            }
        }

        // Cancel any pending reconnect
        if (this.reconnectTimeout) {
            window.clearTimeout(this.reconnectTimeout);
            this.reconnectTimeout = null;
        }

        this.channel = this.client.channel('global_presence', {
            config: {
                presence: {
                    key: 'user_id',
                },
            },
        });

        this.channel
            .on('presence', { event: 'sync' }, () => {
                this.updateState();
            })
            .on('presence', { event: 'join' }, () => {
                this.updateState();
            })
            .on('presence', { event: 'leave' }, () => {
                this.updateState();
            })
            .subscribe(async (status) => {
                if (status === 'SUBSCRIBED') {
                    this.retryCount = 0; // Reset on success
                    if (this.userId) {
                        await this.trackUser(this.userId);
                    }
                } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
                    // Exponential backoff for reconnections
                    const delay = Math.min(1000 * Math.pow(2, this.retryCount), 30000);
                    this.retryCount++;

                    logger.warn(`[PresenceService] ${status}. Retrying in ${delay}ms...`);

                    this.teardown().then(() => {
                        if (this.userId) {
                            this.reconnectTimeout = window.setTimeout(() => {
                                if (this.userId) this.trackUser(this.userId);
                            }, delay);
                        }
                    });
                }
            });

        this.startHeartbeat();
    }

    private startHeartbeat() {
        if (this.heartbeatInterval) window.clearInterval(this.heartbeatInterval);
        this.heartbeatInterval = window.setInterval(async () => {
            if (this.channel?.state === 'joined' && this.userId) {
                await this.channel
                    .track({
                        user_id: this.userId,
                        online_at: new Date().toISOString(),
                    })
                    .catch(() => {});
            } else if (this.userId) {
                this.initChannel();
            }
        }, 30000); // 30s heartbeat
    }

    private updateState() {
        if (!this.channel) return;

        const state = this.channel.presenceState();
        const newOnlineUsers = new Set<string>();

        // Supabase Realtime presence state structure:
        // { "user_id": [ { user_id: "...", online_at: "..." } ] }
        Object.values(state).forEach((presences) => {
            (presences as unknown as { user_id: string }[]).forEach((p) => {
                if (p.user_id) newOnlineUsers.add(p.user_id);
            });
        });

        this.onlineUsers = newOnlineUsers;
        this.notifyListeners();
    }

    private notifyListeners() {
        this.listeners.forEach((listener) => listener(new Set(this.onlineUsers)));
    }

    /**
     * Start tracking a user's presence.
     */
    async trackUser(userId: string): Promise<void> {
        this.userId = userId;

        if (!this.channel || this.channel.state !== 'joined') {
            this.initChannel();
            return;
        }

        await this.channel
            .track({
                user_id: userId,
                online_at: new Date().toISOString(),
                device_id: window.crypto.randomUUID(),
            })
            .catch((err) => {
                logger.error('[PresenceService] Track error', { err });
            });
    }

    /**
     * Stop tracking (cleanup).
     */
    async untrackUser(): Promise<void> {
        if (this.channel) {
            await this.channel.untrack().catch(() => {});
        }
        if (this.heartbeatInterval) {
            window.clearInterval(this.heartbeatInterval);
            this.heartbeatInterval = null;
        }
        this.userId = null;
    }

    async teardown(): Promise<void> {
        if (this.heartbeatInterval) {
            window.clearInterval(this.heartbeatInterval);
            this.heartbeatInterval = null;
        }
        if (this.channel) {
            await this.channel.unsubscribe().catch(() => {});
            this.channel = null;
        }
        this.onlineUsers.clear();
        this.notifyListeners();
    }

    /**
     * Subscribe to updates (for UI).
     */
    subscribeToOnlineUsers(callback: (users: Set<string>) => void): () => void {
        this.listeners.add(callback);
        // Initial value
        callback(new Set(this.onlineUsers));

        return () => {
            this.listeners.delete(callback);
        };
    }
}
