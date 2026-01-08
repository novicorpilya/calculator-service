import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ChatService } from './ChatService';
import { type IChatRepository } from '../repositories/ChatRepository';
import { type IBroadcastService } from './BroadcastService';
import { createMockMessage } from '@/test/utils.tsx';

describe('ChatService', () => {
    let chatService: ChatService;
    let mockRepository: IChatRepository;
    let mockBroadcast: IBroadcastService;

    beforeEach(() => {
        // Create manual mocks for dependencies
        mockRepository = {
            getMessages: vi.fn(),
            getCalculationMessages: vi.fn(),
            getMessagesPaginated: vi.fn(),
            sendMessage: vi.fn(),
            deleteMessage: vi.fn(),
            editMessage: vi.fn(),
            markAsRead: vi.fn(),
            getRecipients: vi.fn(),
            getUnreadCounts: vi.fn(),
            uploadFile: vi.fn(),
            clearHistory: vi.fn(),
            clearProjectHistory: vi.fn(),
        } as unknown as IChatRepository;

        mockBroadcast = {
            broadcastNewMessage: vi.fn().mockResolvedValue(true),
            broadcastMessageUpdate: vi.fn().mockResolvedValue(true),
            broadcastMessageDelete: vi.fn().mockResolvedValue(true),
            broadcastMessagesRead: vi.fn().mockResolvedValue(true),
            broadcastClearHistory: vi.fn().mockResolvedValue(true),
            subscribeToMessages: vi.fn(),
        } as unknown as IBroadcastService;

        chatService = new ChatService(mockRepository, mockBroadcast);
    });

    describe('sendMessage', () => {
        it('should call repository and then broadcast', async () => {
            const payload = {
                sender_id: 'user-1',
                receiver_id: 'user-2',
                content: 'Hello',
            };
            const mockMessage = createMockMessage(payload);
            vi.mocked(mockRepository.sendMessage).mockResolvedValue(mockMessage as any);

            const result = await chatService.sendMessage(payload);

            expect(mockRepository.sendMessage).toHaveBeenCalledWith(payload);
            expect(mockBroadcast.broadcastNewMessage).toHaveBeenCalledWith(mockMessage, undefined);
            expect(result).toBe(mockMessage);
        });

        it('should pass calculationId to broadcast if present', async () => {
            const payload = {
                sender_id: 'user-1',
                receiver_id: 'user-2',
                content: 'Hello',
                calculation_id: 'calc-123',
            };
            const mockMessage = createMockMessage(payload);
            vi.mocked(mockRepository.sendMessage).mockResolvedValue(mockMessage as any);

            await chatService.sendMessage(payload);

            expect(mockBroadcast.broadcastNewMessage).toHaveBeenCalledWith(mockMessage, 'calc-123');
        });
    });

    describe('deleteMessage', () => {
        it('should call repository delete and broadcast delete', async () => {
            const messageId = 'msg-1';

            await chatService.deleteMessage(messageId);

            expect(mockRepository.deleteMessage).toHaveBeenCalledWith(messageId);
            expect(mockBroadcast.broadcastMessageDelete).toHaveBeenCalledWith(messageId);
        });
    });

    describe('markAsRead', () => {
        it('should mark as read and broadcast read status', async () => {
            const contactId = 'user-2';
            const userId = 'user-1';

            await chatService.markAsRead(contactId, userId);

            expect(mockRepository.markAsRead).toHaveBeenCalledWith(contactId, userId, undefined);
            expect(mockBroadcast.broadcastMessagesRead).toHaveBeenCalledWith(userId);
        });
    });
});
