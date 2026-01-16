import { useMemo, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useServices } from '@/core/di/ServiceContainer';
import { useChatActions } from './useChatActions';
import { useChatSync } from './useChatSync';
import type { Message, MessageEventType } from '../types';
import { sortMessages } from '../utils/chatUtils';

interface UseMessagesOptions {
    currentUserId: string;
    selectedUserId: string;
}

/**
 * Main hook for Chat functionality.
 * Composes specialized hooks for queries, actions, and synchronization.
 */
export function useMessages({ currentUserId, selectedUserId }: UseMessagesOptions) {
    const { chatService } = useServices();
    const queryClient = useQueryClient();
    const queryKey = useMemo(
        () => ['messages', currentUserId, selectedUserId],
        [currentUserId, selectedUserId]
    );

    // 1. Fetching (Core Query)
    const {
        data: messages = [],
        isLoading,
        error,
    } = useQuery({
        queryKey,
        queryFn: async () => {
            const res = await chatService.getMessages(currentUserId, selectedUserId);
            if (!res.success) throw new Error(res.error?.message || 'Failed to fetch messages');
            return res.data || [];
        },
        enabled: !!currentUserId && !!selectedUserId,
    });

    // 2. Actions (Mutations)
    const actions = useChatActions(currentUserId, selectedUserId);

    // 3. Synchronization & Real-time
    useChatSync(currentUserId, selectedUserId, queryKey);

    // 4. Handle incoming message from real-time subscription
    const handleIncomingMessage = useCallback((payload: Message | unknown, eventType: MessageEventType) => {
        const msg = payload as Message;
        
        queryClient.setQueryData<Message[]>(queryKey, (old = []) => {
            if (eventType === 'INSERT') {
                // Check if already exists
                if (old.some(m => m.id === msg.id)) return old;
                return sortMessages([...old, msg]);
            } else if (eventType === 'UPDATE') {
                return old.map(m => m.id === msg.id ? { ...m, ...msg } : m);
            } else if (eventType === 'DELETE') {
                return old.filter(m => m.id !== msg.id);
            } else if (eventType === 'READ') {
                // Mark all messages from the current user as read
                return old.map(m => m.sender_id === currentUserId ? { ...m, is_read: true } : m);
            }
            return old;
        });
    }, [queryClient, queryKey, currentUserId]);

    // 5. Handle history cleared
    const handleHistoryCleared = useCallback((senderId: string, receiverId: string) => {
        // Check if this clear applies to our current chat
        const isRelevant = 
            (senderId === currentUserId && receiverId === selectedUserId) ||
            (senderId === selectedUserId && receiverId === currentUserId);
        
        if (isRelevant) {
            queryClient.setQueryData<Message[]>(queryKey, []);
        }
    }, [queryClient, queryKey, currentUserId, selectedUserId]);

    // 6. Clear history action
    const clearHistory = useCallback(async () => {
        const res = await chatService.clearHistory(currentUserId, selectedUserId);
        if (res.success) {
            queryClient.setQueryData<Message[]>(queryKey, []);
        }
        return res;
    }, [chatService, currentUserId, selectedUserId, queryClient, queryKey]);

    // Alias methods for backward compatibility
    const sendImageMessage = actions.sendImage;
    const sendVoiceMessage = actions.sendVoice;

    return {
        messages,
        isLoading,
        error,
        sendMessage: actions.sendMessage,
        sendImageMessage,
        sendVoiceMessage,
        sendImage: actions.sendImage,
        sendVoice: actions.sendVoice,
        deleteMessage: actions.deleteMessage,
        editMessage: actions.editMessage,
        isSending: actions.isSending,
        clearHistory,
        handleIncomingMessage,
        handleHistoryCleared,
    };
}
