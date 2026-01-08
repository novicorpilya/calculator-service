/**
 * Reliable Broadcast Service
 * Handles Supabase channel broadcasts with retry logic and proper cleanup.
 */

import { supabase } from '@/services/supabase';
import { CHAT_CHANNELS } from '../types';

const BROADCAST_TIMEOUT_MS = 5000;
const MAX_RETRIES = 3;

interface BroadcastOptions {
    channelName: string;
    event: string;
    payload: unknown;
    maxRetries?: number;
}

class BroadcastService {

    /**
     * Send a broadcast with retry logic and guaranteed cleanup.
     */
    async send(options: BroadcastOptions): Promise<boolean> {
        const { channelName, event, payload, maxRetries = MAX_RETRIES } = options;

        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            const uniqueChannelId = `${channelName}_broadcast_${Date.now()}_${attempt}`;
            const channel = supabase.channel(uniqueChannelId);

            try {
                // Wait for subscription with timeout
                await this.waitForSubscription(channel);

                // Send the broadcast
                await channel.send({
                    type: 'broadcast',
                    event,
                    payload,
                });

                return true;
            } catch (error) {
                console.warn(`[Broadcast] Attempt ${attempt}/${maxRetries} failed:`, error);

                if (attempt === maxRetries) {
                    console.error('[Broadcast] All attempts exhausted', { channelName, event });
                    return false;
                }

                // Exponential backoff
                await this.delay(Math.pow(2, attempt) * 100);
            } finally {
                // Always cleanup
                this.safeRemoveChannel(channel);
            }
        }

        return false;
    }

    /**
     * Wait for channel to be subscribed with timeout.
     */
    private waitForSubscription(
        channel: ReturnType<typeof supabase.channel>
    ): Promise<void> {
        return new Promise((resolve, reject) => {
            const timeout = setTimeout(() => {
                reject(new Error('Subscription timeout'));
            }, BROADCAST_TIMEOUT_MS);

            channel.subscribe((status: string) => {
                if (status === 'SUBSCRIBED') {
                    clearTimeout(timeout);
                    resolve();
                } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
                    clearTimeout(timeout);
                    reject(new Error(`Subscription failed: ${status}`));
                }
            });
        });
    }

    /**
     * Safely remove channel, ignoring errors.
     */
    private safeRemoveChannel(channel: ReturnType<typeof supabase.channel>): void {
        try {
            supabase.removeChannel(channel);
        } catch {
            // Ignore removal errors
        }
    }

    /**
     * Delay helper for retry backoff.
     */
    private delay(ms: number): Promise<void> {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }

    /**
     * Send message broadcast to appropriate channel.
     */
    async broadcastNewMessage(message: unknown, calculationId?: string): Promise<boolean> {
        const channelName = calculationId
            ? `${CHAT_CHANNELS.CHAT_PREFIX}${calculationId}`
            : CHAT_CHANNELS.GLOBAL_SYNC;

        return this.send({
            channelName,
            event: 'new_message',
            payload: message,
        });
    }

    /**
     * Broadcast message update.
     */
    async broadcastMessageUpdate(message: unknown): Promise<boolean> {
        return this.send({
            channelName: CHAT_CHANNELS.GLOBAL_SYNC,
            event: 'message_updated',
            payload: message,
        });
    }

    /**
     * Broadcast message deletion.
     */
    async broadcastMessageDelete(messageId: string): Promise<boolean> {
        return this.send({
            channelName: CHAT_CHANNELS.GLOBAL_SYNC,
            event: 'message_deleted',
            payload: { id: messageId },
        });
    }

    /**
     * Broadcast messages read event.
     */
    async broadcastMessagesRead(
        senderId: string,
        receiverId: string,
        calculationId?: string
    ): Promise<boolean> {
        return this.send({
            channelName: CHAT_CHANNELS.NOTIFICATIONS,
            event: 'messages_read',
            payload: { senderId, receiverId, calculationId },
        });
    }
}

// Export singleton
export const broadcastService = new BroadcastService();
