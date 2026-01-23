import { useCallback, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useServices } from '@/app/di/ServiceContainer';
import { logger } from '@/core/logging/index';
import type { ChatRecipient, Message, UnreadCounts } from '../types';

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

    const RECIPIENTS_CACHE_KEY = `hrc_chat_recipients_v6_${currentUserId}`;
    const UNREAD_CACHE_KEY = `hrc_unread_counts_v6_${currentUserId}`;
    const UNREAD_QUERY_KEY = useMemo(() => ['unread-counts', currentUserId], [currentUserId]);

    // Queries
    const {
        data: recipients = [],
        isLoading: isRecipientsLoading,
        isFetched,
    } = useQuery({
        queryKey: ['recipients', currentUserId],
        queryFn: async () => {
            const res = await chatService.getRecipients(currentUserId);
            if (!res.success) throw new Error(res.error?.message || 'Failed to fetch recipients');
            const data = res.data || [];

            // ... existing lag protection
            const existing = queryClient.getQueryData<ChatRecipient[]>([
                'recipients',
                currentUserId,
            ]);
            if (existing && data.length > 0) {
                data.forEach((newR: ChatRecipient, idx: number) => {
                    const oldR = existing.find((r) => r.id === newR.id);
                    if (oldR?.lastMessage && !newR.lastMessage) {
                        data[idx].lastMessage = oldR.lastMessage;
                    }
                });
            }

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
        staleTime: 30000, // 30s stability
    });

    const { data: unreadCounts = {}, isLoading: isUnreadLoading } = useQuery({
        queryKey: UNREAD_QUERY_KEY,
        queryFn: async () => {
            const res = await chatService.getUnreadCounts(currentUserId);
            if (!res.success)
                throw new Error(res.error?.message || 'Failed to fetch unread counts');
            const data = res.data || { total: 0, perSender: {}, perProject: {} };

            if (currentUserId && currentUserId !== 'undefined') {
                sessionStorage.setItem(UNREAD_CACHE_KEY, JSON.stringify(data));
            }
            return data;
        },
        enabled: !!currentUserId && currentUserId !== 'undefined' && currentUserId.length > 10,
        initialData: (): UnreadCounts | undefined => {
            if (!currentUserId || currentUserId === 'undefined')
                return { total: 0, perSender: {}, perProject: {} };
            const cached = sessionStorage.getItem(UNREAD_CACHE_KEY);
            return cached ? JSON.parse(cached) : { total: 0, perSender: {}, perProject: {} };
        },
        select: (data: UnreadCounts) => data.perSender || {},
    });

    // Actions
    const updateRecipientLastMessage = useCallback(
        (message: Message, targetUserId: string) => {
            const queryKey = ['recipients', currentUserId];
            queryClient.setQueryData(queryKey, (old: ChatRecipient[] = []) => {
                const updated = old.map((r) =>
                    r.id === targetUserId
                        ? {
                              ...r,
                              lastMessage: {
                                  id: message.id,
                                  content: message.content,
                                  image_url: message.image_url,
                                  voice_url: message.voice_url,
                                  created_at: message.created_at,
                                  sender_id: message.sender_id,
                              },
                          }
                        : r
                );

                // Sync with sessionStorage immediately to prevent "flash of old data"
                if (currentUserId && currentUserId !== 'undefined') {
                    sessionStorage.setItem(RECIPIENTS_CACHE_KEY, JSON.stringify(updated));
                }

                return sortByLastMessage(updated);
            });
        },
        [queryClient, currentUserId, RECIPIENTS_CACHE_KEY]
    );

    const incrementUnread = useCallback(
        (senderId: string) => {
            queryClient.setQueryData<UnreadCounts>(UNREAD_QUERY_KEY, (old) => {
                if (!old) return old;
                const perSender = {
                    ...old.perSender,
                    [senderId]: (old.perSender?.[senderId] || 0) + 1,
                };
                return {
                    ...old,
                    total: old.total + 1,
                    perSender,
                };
            });
        },
        [queryClient, UNREAD_QUERY_KEY]
    );

    const syncChannel = useMemo(() => new BroadcastChannel('chat_local_sync'), []);

    const clearUnread = useCallback(
        async (userId: string) => {
            queryClient.setQueryData<UnreadCounts>(UNREAD_QUERY_KEY, (old) => {
                if (!old) return old;
                const countToSubtract = old.perSender?.[userId] || 0;
                const perSender = { ...old.perSender };
                delete perSender[userId];

                return {
                    ...old,
                    total: Math.max(0, old.total - countToSubtract),
                    perSender,
                };
            });

            try {
                const res = await chatService.markDirectAsRead(userId, currentUserId);
                if (!res.success) throw new Error(res.error?.message || 'Failed to mark as read');

                // Broadcast to other tabs
                syncChannel.postMessage({
                    type: 'DIRECT_READ',
                    contactId: userId,
                    userId: currentUserId,
                });

                // Invalidate unread ONLY. Preserving recipients' lastMessage state.
                queryClient.invalidateQueries({ queryKey: UNREAD_QUERY_KEY });
            } catch (err) {
                logger.error('Failed to clear unread', { err, userId });
                queryClient.invalidateQueries({ queryKey: UNREAD_QUERY_KEY });
            }
        },
        [queryClient, currentUserId, UNREAD_QUERY_KEY, syncChannel, chatService]
    );

    const clearRecipientLastMessage = useCallback(
        (targetUserId: string) => {
            const queryKey = ['recipients', currentUserId];

            // 1. Cancel outgoing queries to prevent overwriting our optimistic clear
            queryClient.cancelQueries({ queryKey });

            // 2. Update React Query State
            queryClient.setQueryData(queryKey, (old: ChatRecipient[] = []) => {
                const updated = old.map((r) =>
                    r.id === targetUserId ? { ...r, lastMessage: null } : r
                );

                // 3. Sync with sessionStorage immediately
                if (currentUserId && currentUserId !== 'undefined') {
                    sessionStorage.setItem(RECIPIENTS_CACHE_KEY, JSON.stringify(updated));
                }

                return updated;
            });
        },
        [queryClient, currentUserId, RECIPIENTS_CACHE_KEY]
    );

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
