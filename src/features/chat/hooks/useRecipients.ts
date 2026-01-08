import { useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useServices } from '@/core/di/ServiceContainer';
import type { ChatRecipient, Message } from '../types';

interface UseRecipientsOptions {
    currentUserId: string;
}

function sortByLastMessage(recipients: ChatRecipient[]): ChatRecipient[] {
    return [...recipients].sort((a, b) => {
        const dateA = a.lastMessage?.created_at || '0';
        const dateB = b.lastMessage?.created_at || '0';
        return dateB.localeCompare(dateA);
    });
}

export function useRecipients({ currentUserId }: UseRecipientsOptions) {
    const { chatService } = useServices();
    const queryClient = useQueryClient();

    const RECIPIENTS_CACHE_KEY = `hrc_chat_recipients_v1_${currentUserId}`;
    const UNREAD_CACHE_KEY = `hrc_unread_counts_v1_${currentUserId}`;

    // Queries
    const { data: recipients = [], isLoading: isRecipientsLoading, isFetched } = useQuery({
        queryKey: ['recipients', currentUserId],
        queryFn: async () => {
            const data = await chatService.getRecipients(currentUserId);
            if (currentUserId && currentUserId !== 'undefined') {
                sessionStorage.setItem(RECIPIENTS_CACHE_KEY, JSON.stringify(data));
            }
            return data;
        },
        enabled: !!currentUserId && currentUserId !== 'undefined' && currentUserId.length > 10,
        initialData: () => {
            if (!currentUserId || currentUserId === 'undefined') return undefined;
            const cached = sessionStorage.getItem(RECIPIENTS_CACHE_KEY);
            return cached ? JSON.parse(cached) : undefined;
        },
        select: sortByLastMessage,
    });

    const { data: unreadCounts = {}, isLoading: isUnreadLoading } = useQuery({
        queryKey: ['unreadCounts', currentUserId],
        queryFn: async () => {
            const data = await chatService.getUnreadCounts(currentUserId);
            if (currentUserId && currentUserId !== 'undefined') {
                sessionStorage.setItem(UNREAD_CACHE_KEY, JSON.stringify(data));
            }
            return data;
        },
        enabled: !!currentUserId && currentUserId !== 'undefined' && currentUserId.length > 10,
        initialData: () => {
            if (!currentUserId || currentUserId === 'undefined') return {};
            const cached = sessionStorage.getItem(UNREAD_CACHE_KEY);
            return cached ? JSON.parse(cached) : {};
        },
    });

    // Actions
    const updateRecipientLastMessage = useCallback((message: Message, targetUserId: string) => {
        queryClient.setQueryData(['recipients', currentUserId], (old: ChatRecipient[] = []) => {
            const updated = old.map(r =>
                r.id === targetUserId
                    ? {
                        ...r,
                        lastMessage: {
                            content: message.content,
                            image_url: message.image_url,
                            voice_url: message.voice_url,
                            created_at: message.created_at,
                            sender_id: message.sender_id,
                        },
                    }
                    : r
            );
            return sortByLastMessage(updated);
        });
    }, [queryClient, currentUserId]);

    const incrementUnread = useCallback((senderId: string) => {
        queryClient.setQueryData(['unreadCounts', currentUserId], (old: Record<string, number> = {}) => ({
            ...old,
            [senderId]: (old[senderId] || 0) + 1,
        }));
    }, [queryClient, currentUserId]);

    const clearUnread = useCallback(async (userId: string) => {
        queryClient.setQueryData(['unreadCounts', currentUserId], (old: Record<string, number> = {}) => {
            const next = { ...old };
            delete next[userId];
            return next;
        });

        try {
            await chatService.markAsRead(userId, currentUserId);
        } catch (err) {
            console.error('Failed to clear unread:', err);
        }
    }, [queryClient, chatService, currentUserId]);

    const clearRecipientLastMessage = useCallback((targetUserId: string) => {
        const queryKey = ['recipients', currentUserId];

        // 1. Cancel outgoing queries to prevent overwriting our optimistic clear
        queryClient.cancelQueries({ queryKey });

        // 2. Update React Query State
        queryClient.setQueryData(queryKey, (old: ChatRecipient[] = []) => {
            const updated = old.map(r =>
                r.id === targetUserId
                    ? { ...r, lastMessage: null }
                    : r
            );

            // 3. Sync with sessionStorage immediately
            if (currentUserId && currentUserId !== 'undefined') {
                sessionStorage.setItem(RECIPIENTS_CACHE_KEY, JSON.stringify(updated));
            }

            return updated;
        });
    }, [queryClient, currentUserId, RECIPIENTS_CACHE_KEY]);

    return {
        recipients,
        unreadCounts,
        isLoading: isRecipientsLoading,
        isFetched,
        isUnreadLoading,
        updateRecipientLastMessage,
        incrementUnread,
        clearUnread,
        clearRecipientLastMessage,
    };
}
