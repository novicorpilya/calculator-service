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
            getCalculationMessagesPaginated: vi.fn(),
            sendDirectMessage: vi.fn(),
            sendProjectMessage: vi.fn(),
            deleteMessage: vi.fn(),
            editMessage: vi.fn(),
            markDirectAsRead: vi.fn(),
            markProjectAsRead: vi.fn(),
            getRecipients: vi.fn(),
            getUnreadCounts: vi.fn(),
            uploadFile: vi.fn(),
            clearHistory: vi.fn(),
            clearProjectHistory: vi.fn(),
        } as unknown as IChatRepository;

        mockBroadcast = {
            broadcastMessagesRead: vi.fn().mockResolvedValue(true),
            broadcastClearHistory: vi.fn().mockResolvedValue(true),
            subscribeToMessages: vi.fn(),
            broadcastProjectPulse: vi.fn().mockResolvedValue(true),
        } as unknown as IBroadcastService;

        chatService = new ChatService(mockRepository, mockBroadcast);
    });

    describe('sendMessage', () => {
        it('should call sendDirectMessage when calculation_id is missing', async () => {
            const payload = {
                sender_id: 'user-1',
                receiver_id: 'user-2',
                content: 'Hello',
            };
            const mockMessage = createMockMessage(payload);
            vi.mocked(mockRepository.sendDirectMessage).mockResolvedValue(mockMessage as any);

            const result = await chatService.sendMessage(payload);

            expect(mockRepository.sendDirectMessage).toHaveBeenCalledWith('user-1', 'user-2', 'Hello');
            expect(result).toBe(mockMessage);
        });

        it('should call sendProjectMessage when calculation_id is present', async () => {
            const payload = {
                sender_id: 'user-1',
                calculation_id: 'calc-123',
                content: 'Project Update',
            };
            const mockMessage = createMockMessage(payload);
            vi.mocked(mockRepository.sendProjectMessage).mockResolvedValue(mockMessage as any);

            const result = await chatService.sendMessage(payload);

            expect(mockRepository.sendProjectMessage).toHaveBeenCalledWith('user-1', 'calc-123', 'Project Update');
            expect(result).toBe(mockMessage);
        });

        it('should throw error if both are missing', async () => {
            const payload = { sender_id: 'user-1', content: 'Loose message' } as any;
            await expect(chatService.sendMessage(payload)).rejects.toThrow();
        });
    });

    describe('deleteMessage', () => {
        it('should call repository delete', async () => {
            const messageId = 'msg-1';

            await chatService.deleteMessage(messageId);

            expect(mockRepository.deleteMessage).toHaveBeenCalledWith(messageId);
        });
    });

    describe('read status', () => {
        it('should mark direct as read', async () => {
            await chatService.markDirectAsRead('user-2', 'user-1');
            expect(mockRepository.markDirectAsRead).toHaveBeenCalledWith('user-2', 'user-1');
            expect(mockBroadcast.broadcastMessagesRead).toHaveBeenCalledWith('user-1');
        });

        it('should mark project as read', async () => {
            await chatService.markProjectAsRead('calc-123', 'user-1');
            expect(mockRepository.markProjectAsRead).toHaveBeenCalledWith('calc-123', 'user-1');
            expect(mockBroadcast.broadcastMessagesRead).toHaveBeenCalledWith('user-1', 'calc-123');
        });
    });
});
