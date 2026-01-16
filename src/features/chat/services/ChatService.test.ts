import { describe, it, test, expect, vi, beforeEach } from 'vitest';
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
            getMessagesPaginated: vi.fn(),
            sendDirectMessage: vi.fn(),
            sendProjectMessage: vi.fn(),
            deleteMessage: vi.fn(),
            editMessage: vi.fn(),
            markDirectAsRead: vi.fn().mockResolvedValue({ success: true }),
            markProjectAsRead: vi.fn().mockResolvedValue({ success: true }),
            getRecipients: vi.fn(),
            getUnreadCounts: vi.fn(),
            uploadFile: vi.fn(),
            clearHistory: vi.fn(),
            clearProjectHistory: vi.fn(),
        } as unknown as IChatRepository;

        mockBroadcast = {
            broadcastNewMessage: vi.fn().mockResolvedValue(true),
            broadcastMessagesRead: vi.fn().mockResolvedValue(true),
            broadcastClearHistory: vi.fn().mockResolvedValue(true),
            subscribeToMessages: vi.fn(),
            broadcastProjectPulse: vi.fn().mockResolvedValue(true),
            subscribeToProjects: vi.fn(),
        } as unknown as IBroadcastService;

        chatService = new ChatService(mockRepository, mockBroadcast);
        
        // Mock storage to prevent hanging on IndexedDB
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (chatService as any).storage = {
            saveMessages: vi.fn().mockResolvedValue(undefined),
            addToOutbox: vi.fn().mockResolvedValue(1),
            updateMessage: vi.fn().mockResolvedValue(undefined),
        };
    });

    describe('sendMessage', () => {
        test('should call sendDirectMessage when calculation_id is missing', async () => {
            const payload = {
                sender_id: 'user-1',
                receiver_id: 'user-2',
                content: 'Hello',
            };
            const mockMessage = createMockMessage(payload);
            vi.mocked(mockRepository.sendDirectMessage).mockResolvedValue({
                success: true,
                data: mockMessage,
            });

            const result = await chatService.sendMessage(payload);

            expect(mockRepository.sendDirectMessage).toHaveBeenCalledWith(
                'user-1',
                'user-2',
                'Hello',
                expect.objectContaining({
                    metadata: {},
                })
            );
            expect(result.success).toBe(true);
            if (result.success) expect(result.data).toBe(mockMessage);
        });

        it('should call sendProjectMessage when calculation_id is present', async () => {
            const payload = {
                sender_id: 'user-1',
                calculation_id: 'calc-123',
                content: 'Project Update',
            };
            const mockMessage = createMockMessage(payload);
            vi.mocked(mockRepository.sendProjectMessage).mockResolvedValue({
                success: true,
                data: mockMessage,
            });

            const result = await chatService.sendMessage(payload);

            expect(mockRepository.sendProjectMessage).toHaveBeenCalledWith(
                'user-1',
                'calc-123',
                'Project Update',
                expect.objectContaining({
                    metadata: {},
                })
            );
            expect(result.success).toBe(true);
            if (result.success) expect(result.data).toBe(mockMessage);
        });

        it('should return error if both ids are missing', async () => {
            const payload = {
                sender_id: 'user-1',
                content: 'Loose message',
            } as unknown as import('../types').MessageCreatePayload;
            const result = await chatService.sendMessage(payload);
            expect(result.success).toBe(false);
            if (!result.success)
                expect(result.error?.message).toContain('calculation_id or receiver_id');
        });
    });

    describe('read status', () => {
        it('should mark direct as read and broadcast', async () => {
            const res = await chatService.markDirectAsRead('user-2', 'user-1');

            expect(mockRepository.markDirectAsRead).toHaveBeenCalledWith('user-2', 'user-1');
            // Broadcast is sent to the sender (user-2) to notify them
            expect(mockBroadcast.broadcastMessagesRead).toHaveBeenCalledWith(
                'user-2',
                undefined,
                'user-1'
            );
            expect(res.success).toBe(true);
        });

        it('should mark project as read and broadcast on project channel', async () => {
            vi.mocked(mockRepository.getCalculationMessages).mockResolvedValue({
                success: true,
                data: [createMockMessage({ sender_id: 'other-user' })]
            });

            const res = await chatService.markProjectAsRead('calc-123', 'user-1');

            expect(mockRepository.markProjectAsRead).toHaveBeenCalledWith('calc-123', 'user-1');
            // In project mode, broadcast goes to the other user or room
            expect(mockBroadcast.broadcastMessagesRead).toHaveBeenCalledWith(
                'other-user',
                'calc-123',
                'user-1'
            );
            expect(res.success).toBe(true);
        });
    });
});
