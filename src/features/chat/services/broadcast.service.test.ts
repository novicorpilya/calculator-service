/**
 * Broadcast Service Tests
 * Note: These are simplified tests that don't use fake timers
 * due to complexity of async timer interactions.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { broadcastService } from '@/features/chat/services/broadcast.service';
import { supabase } from '@/services/supabase';

// Mock supabase
vi.mock('@/services/supabase', () => ({
    supabase: {
        channel: vi.fn(),
        removeChannel: vi.fn(),
    },
}));

const mockSupabase = supabase as unknown as {
    channel: ReturnType<typeof vi.fn>;
    removeChannel: ReturnType<typeof vi.fn>;
};

describe('BroadcastService', () => {
    let mockChannel: {
        subscribe: ReturnType<typeof vi.fn>;
        send: ReturnType<typeof vi.fn>;
    };

    beforeEach(() => {
        vi.clearAllMocks();

        mockChannel = {
            subscribe: vi.fn(),
            send: vi.fn(),
        };
        mockSupabase.channel.mockReturnValue(mockChannel);
    });

    describe('send', () => {
        it('should send broadcast successfully', async () => {
            mockChannel.subscribe.mockImplementation((callback) => {
                // Simulate async subscription
                setTimeout(() => callback('SUBSCRIBED'), 0);
                return mockChannel;
            });
            mockChannel.send.mockResolvedValue({ status: 'ok' });

            const result = await broadcastService.send({
                channelName: 'test-channel',
                event: 'test-event',
                payload: { test: 'data' },
            });

            expect(result).toBe(true);
            expect(mockChannel.send).toHaveBeenCalledWith({
                type: 'broadcast',
                event: 'test-event',
                payload: { test: 'data' },
            });
        });

        it('should cleanup channel after send', async () => {
            mockChannel.subscribe.mockImplementation((callback) => {
                setTimeout(() => callback('SUBSCRIBED'), 0);
                return mockChannel;
            });
            mockChannel.send.mockResolvedValue({ status: 'ok' });

            await broadcastService.send({
                channelName: 'cleanup-test',
                event: 'test',
                payload: {},
            });

            expect(mockSupabase.removeChannel).toHaveBeenCalled();
        });
    });

    describe('helper methods', () => {
        beforeEach(() => {
            mockChannel.subscribe.mockImplementation((callback) => {
                setTimeout(() => callback('SUBSCRIBED'), 0);
                return mockChannel;
            });
            mockChannel.send.mockResolvedValue({ status: 'ok' });
        });

        it('broadcastNewMessage should use correct channel', async () => {
            const result = await broadcastService.broadcastNewMessage({ id: '123' }, 'calc-1');

            expect(result).toBe(true);
            expect(mockChannel.send).toHaveBeenCalledWith(
                expect.objectContaining({ event: 'new_message' })
            );
        });

        it('broadcastMessageUpdate should send update event', async () => {
            const result = await broadcastService.broadcastMessageUpdate({ id: '123', content: 'updated' });

            expect(result).toBe(true);
            expect(mockChannel.send).toHaveBeenCalledWith(
                expect.objectContaining({ event: 'message_updated' })
            );
        });

        it('broadcastMessageDelete should send delete event', async () => {
            const result = await broadcastService.broadcastMessageDelete('msg-123');

            expect(result).toBe(true);
            expect(mockChannel.send).toHaveBeenCalledWith(
                expect.objectContaining({
                    event: 'message_deleted',
                    payload: { id: 'msg-123' },
                })
            );
        });

        it('broadcastMessagesRead should send read event', async () => {
            const result = await broadcastService.broadcastMessagesRead('sender-1', 'receiver-1');

            expect(result).toBe(true);
            expect(mockChannel.send).toHaveBeenCalledWith(
                expect.objectContaining({
                    event: 'messages_read',
                    payload: expect.objectContaining({
                        senderId: 'sender-1',
                        receiverId: 'receiver-1',
                    }),
                })
            );
        });
    });
});
