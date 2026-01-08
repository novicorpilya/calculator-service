
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@/test/utils';
import { useChat } from './useChat';
import { mockChatService } from '@/test/utils';
import { createMockRecipient, createMockMessage } from '@/test/utils';

// Reset mocks before each test
beforeEach(() => {
    vi.clearAllMocks();
    // Default mock behavior
    mockChatService.getRecipients.mockResolvedValue([]);
    mockChatService.getUnreadCounts.mockResolvedValue({});
    mockChatService.getMessages.mockResolvedValue([]);
    mockChatService.sendMessage.mockImplementation(async (payload) => ({
        id: `msg-${Date.now()}`,
        created_at: new Date().toISOString(),
        ...payload
    }));
    mockChatService.subscribeToMessages.mockReturnValue(() => { });
});

describe('useChat', () => {
    const currentUser = { id: 'user-1' };
    const selectedUser = createMockRecipient({ id: 'user-2' });

    it('should fetch recipients on mount when currentUser is present', async () => {
        const recipients = [createMockRecipient({ id: 'r1' }), createMockRecipient({ id: 'r2' })];
        mockChatService.getRecipients.mockResolvedValue(recipients);

        const { result } = renderHook(() => useChat({ currentUser, selectedUser: null }));

        await waitFor(() => {
            expect(result.current.recipients).toHaveLength(2);
            expect(result.current.recipients).toEqual(recipients);
        });

        expect(mockChatService.getRecipients).toHaveBeenCalledWith(currentUser.id);
    });

    it('should load messages when selectedUser changes', async () => {
        const messages = [createMockMessage({ id: 'm1' }), createMockMessage({ id: 'm2' })];
        mockChatService.getMessages.mockResolvedValue(messages);

        const { result } = renderHook(() => useChat({ currentUser, selectedUser }));

        await waitFor(() => {
            expect(result.current.messages).toHaveLength(2);
            expect(result.current.messages).toEqual(messages);
        });

        expect(mockChatService.getMessages).toHaveBeenCalledWith(currentUser.id, selectedUser.id);
        expect(mockChatService.markAsRead).toHaveBeenCalledWith(selectedUser.id, currentUser.id);
    });

    it('should send a message and update state optimistically then confirm', async () => {
        const { result } = renderHook(() => useChat({ currentUser, selectedUser }));

        // Wait for initial load to finish
        await waitFor(() => {
            expect(result.current.isLoadingMessages).toBe(false);
        });

        const messageText = 'Hello World';

        // Initial state
        expect(result.current.messages).toHaveLength(0);

        await act(async () => {
            await result.current.sendMessage(messageText, []);
        });

        // After sending (service mocked to resolve immediately)
        // Optimistic update happens, then service returns real message.
        // Due to "await", we likely see final state or optimistic if service is slow.
        // But our mock resolves immediately.

        await waitFor(() => {
            // Should have the message
            expect(result.current.messages).toHaveLength(1);
            expect(result.current.messages[0].content).toBe(messageText);
        });

        expect(mockChatService.sendMessage).toHaveBeenCalledWith(expect.objectContaining({
            content: messageText,
            sender_id: currentUser.id,
            receiver_id: selectedUser.id
        }));
    });

    it('should handle incoming realtime messages', async () => {
        let subscriptionCallback: any;
        mockChatService.subscribeToMessages.mockImplementation((cb) => {
            subscriptionCallback = cb;
            return () => { };
        });

        const { result } = renderHook(() => useChat({ currentUser, selectedUser }));

        // Wait for effect to run and subscribe
        await waitFor(() => {
            expect(mockChatService.subscribeToMessages).toHaveBeenCalled();
        });

        const newMessage = createMockMessage({
            id: 'new-realtime-msg',
            sender_id: selectedUser.id,
            receiver_id: currentUser.id,
            content: 'Incoming!'
        });

        act(() => {
            if (subscriptionCallback) {
                subscriptionCallback(newMessage, 'INSERT');
            }
        });

        await waitFor(() => {
            expect(result.current.messages).toContainEqual(newMessage);
        });
    });
});
