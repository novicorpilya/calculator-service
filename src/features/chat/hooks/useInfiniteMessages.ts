/**
 * useInfiniteMessages Hook
 * 
 * Provides infinite scroll loading for chat messages with pagination.
 * Uses React Query's useInfiniteQuery for efficient data fetching and caching.
 */

import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useServices } from '@/core/di/ServiceContainer';
import { DEFAULT_PAGE_SIZE } from '@/core/types/pagination';
import type { Message, MessageCreatePayload } from '../types';

interface UseInfiniteMessagesOptions {
    currentUserId: string;
    selectedUserId: string;
    enabled?: boolean;
}

export function useInfiniteMessages({
    currentUserId,
    selectedUserId,
    enabled = true,
}: UseInfiniteMessagesOptions) {
    const queryClient = useQueryClient();
    const { chatService } = useServices();

    const queryKey = ['messages', 'infinite', currentUserId, selectedUserId];

    const {
        data,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
        isLoading,
        error,
        refetch,
    } = useInfiniteQuery({
        queryKey,
        queryFn: async ({ pageParam = 1 }) => {
            // Use paginated method from repository via service
            return chatService.getMessagesPaginated(currentUserId, selectedUserId, {
                page: pageParam,
                pageSize: DEFAULT_PAGE_SIZE,
            });
        },
        getNextPageParam: (lastPage) =>
            lastPage.pagination.hasMore ? lastPage.pagination.page + 1 : undefined,
        enabled: enabled && !!currentUserId && !!selectedUserId,
        initialPageParam: 1,
    });

    // Flatten all pages into a single array of messages
    const messages = data?.pages.flatMap((page) => page.data) || [];

    // Total count from the first page metadata
    const totalMessages = data?.pages[0]?.pagination.total || 0;

    // Send message mutation
    const sendMutation = useMutation({
        mutationFn: (params: MessageCreatePayload) => chatService.sendMessage(params),
        onMutate: async (newMessage) => {
            await queryClient.cancelQueries({ queryKey });

            const tempMessage: Message = {
                id: `temp-${Date.now()}`,
                sender_id: newMessage.sender_id,
                receiver_id: newMessage.receiver_id,
                content: newMessage.content,
                image_url: newMessage.image_url,
                voice_url: newMessage.voice_url,
                voice_duration: newMessage.voice_duration,
                created_at: new Date().toISOString(),
                is_edited: false,
            };

            // Optimistic update: add to last page
            queryClient.setQueryData(queryKey, (old: typeof data) => {
                if (!old) return old;
                const pages = [...old.pages];
                const lastPage = { ...pages[pages.length - 1] };
                lastPage.data = [...lastPage.data, tempMessage];
                pages[pages.length - 1] = lastPage;
                return { ...old, pages };
            });

            return { tempMessage };
        },
        onError: (_err, _newMsg, context) => {
            // Rollback optimistic update
            if (context?.tempMessage) {
                queryClient.setQueryData(queryKey, (old: typeof data) => {
                    if (!old) return old;
                    const pages = old.pages.map((page) => ({
                        ...page,
                        data: page.data.filter((m) => m.id !== context.tempMessage.id),
                    }));
                    return { ...old, pages };
                });
            }
        },
        onSettled: () => {
            // Invalidate to sync with server
            queryClient.invalidateQueries({ queryKey });
        },
    });

    // Handler for real-time incoming messages
    const handleIncomingMessage = (message: Message, event: 'INSERT' | 'UPDATE' | 'DELETE') => {
        if (event === 'INSERT') {
            queryClient.setQueryData(queryKey, (old: typeof data) => {
                if (!old) return old;

                // Check for duplicate
                const exists = old.pages.some((page) =>
                    page.data.some((m) => m.id === message.id)
                );
                if (exists) return old;

                // Replace temp message or add new
                const pages = old.pages.map((page, index) => {
                    if (index === old.pages.length - 1) {
                        // Check if we should replace a temp message
                        const tempIndex = page.data.findIndex(
                            (m) =>
                                m.id.startsWith('temp-') &&
                                m.sender_id === message.sender_id &&
                                (m.content === message.content || (m.image_url && message.image_url))
                        );

                        if (tempIndex !== -1) {
                            const newData = [...page.data];
                            newData[tempIndex] = message;
                            return { ...page, data: newData };
                        }

                        return { ...page, data: [...page.data, message] };
                    }
                    return page;
                });

                return { ...old, pages };
            });
        } else if (event === 'UPDATE') {
            queryClient.setQueryData(queryKey, (old: typeof data) => {
                if (!old) return old;
                const pages = old.pages.map((page) => ({
                    ...page,
                    data: page.data.map((m) => (m.id === message.id ? message : m)),
                }));
                return { ...old, pages };
            });
        } else if (event === 'DELETE') {
            queryClient.setQueryData(queryKey, (old: typeof data) => {
                if (!old) return old;
                const pages = old.pages.map((page) => ({
                    ...page,
                    data: page.data.filter((m) => m.id !== message.id),
                }));
                return { ...old, pages };
            });
        }
    };

    return {
        messages,
        totalMessages,
        isLoading,
        error: error ? (error as Error).message : null,
        fetchNextPage,
        hasNextPage: hasNextPage ?? false,
        isFetchingNextPage,
        sendMessage: sendMutation.mutateAsync,
        handleIncomingMessage,
        refetch,
    };
}
