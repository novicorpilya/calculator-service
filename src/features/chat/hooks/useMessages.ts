import { useCallback, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useServices } from '@/core/di/ServiceContainer';
import { generateShortToken } from '@/core/utils/crypto';
import type { Message, MessageCreatePayload } from '../types';

interface UseMessagesOptions {
    currentUserId: string;
    selectedUserId: string;
}

/**
 * Preload image with exponential backoff retry.
 * @param url - Image URL to preload
 * @param maxRetries - Maximum retry attempts (default: 3)
 * @returns Promise that resolves when image is loaded or all retries exhausted
 */
async function preloadImageWithRetry(url: string, maxRetries = 3): Promise<boolean> {
    let attempt = 0;

    while (attempt < maxRetries) {
        try {
            await new Promise<void>((resolve, reject) => {
                const img = new Image();
                img.onload = () => resolve();
                img.onerror = () => reject(new Error('Image load failed'));
                img.src = url;
            });
            return true; // Success
        } catch {
            attempt++;
            if (attempt < maxRetries) {
                // Exponential backoff: 100ms, 200ms, 400ms...
                const delay = 100 * Math.pow(2, attempt - 1);
                await new Promise(resolve => setTimeout(resolve, delay));
            }
        }
    }

    console.warn(`[useMessages] Image preload failed after ${maxRetries} attempts:`, url);
    return false; // All retries exhausted
}

interface SendImageParams extends Partial<MessageCreatePayload> {
    file: File;
    previewUrl: string;
}

interface SendVoiceParams extends Partial<MessageCreatePayload> {
    blob: Blob;
    previewUrl: string;
    duration: number;
}

export function useMessages({ currentUserId, selectedUserId }: UseMessagesOptions) {
    const queryClient = useQueryClient();
    const { chatService } = useServices();

    const queryKey = useMemo(() => ['messages', currentUserId, selectedUserId], [currentUserId, selectedUserId]);

    // 1. Fetching
    const { data: messages = [], isLoading, error } = useQuery({
        queryKey,
        queryFn: () => chatService.getMessages(currentUserId, selectedUserId),
        enabled: !!currentUserId && !!selectedUserId,
    });

    // 2. Mutations
    const sendMutation = useMutation({
        mutationFn: (params: MessageCreatePayload) => chatService.sendMessage(params),
        onMutate: async (newMessage: MessageCreatePayload) => {
            await queryClient.cancelQueries({ queryKey });
            const previousMessages = queryClient.getQueryData<Message[]>(queryKey);

            // Optimistic update
            const tempMessage: Message = {
                id: `temp-${generateShortToken(12)}`,
                sender_id: currentUserId,
                receiver_id: selectedUserId,
                content: newMessage.content,
                image_url: newMessage.image_url,
                voice_url: newMessage.voice_url,
                voice_duration: newMessage.voice_duration,
                created_at: new Date().toISOString(),
                is_edited: false,
            };

            queryClient.setQueryData(queryKey, (old: Message[] = []) => [...old, tempMessage]);

            return { previousMessages };
        },
        onError: (_err: Error, _newMsg: MessageCreatePayload, context?: { previousMessages?: Message[] }) => {
            queryClient.setQueryData(queryKey, context?.previousMessages);
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey });
        },
    });

    const sendImageMutation = useMutation<Message, Error, SendImageParams, { previousMessages?: Message[] }>({
        mutationFn: async (params) => {
            const publicUrl = await chatService.uploadAttachment(params.file);
            return chatService.sendMessage({
                sender_id: params.sender_id || currentUserId,
                receiver_id: params.receiver_id || selectedUserId,
                content: params.content || '',
                image_url: publicUrl,
                reply_to_id: params.reply_to_id,
                calculation_id: params.calculation_id,
            });
        },
        onMutate: async (params) => {
            await queryClient.cancelQueries({ queryKey });
            const previousMessages = queryClient.getQueryData<Message[]>(queryKey);

            const clientId = generateShortToken(16);
            const tempMessage: Message = {
                id: `temp-${clientId}`,
                client_id: clientId,
                sender_id: params.sender_id || currentUserId,
                receiver_id: params.receiver_id || selectedUserId,
                content: params.content || '',
                image_url: params.previewUrl,
                created_at: new Date().toISOString(),
                is_edited: false,
            };

            queryClient.setQueryData(queryKey, (old: Message[] = []) => [...old, tempMessage]);

            return { previousMessages, tempId: tempMessage.id, clientId };
        },
        onError: (_err: Error, _variables: unknown, context?: { previousMessages?: Message[] }) => {
            queryClient.setQueryData(queryKey, context?.previousMessages);
        },
        onSettled: () => {
            // Realtime handles the atomic swap
        },
    });

    // Voice Message Mutation with Optimistic UI
    const sendVoiceMutation = useMutation<Message, Error, SendVoiceParams, { previousMessages?: Message[] }>({
        mutationFn: async (params) => {
            const publicUrl = await chatService.uploadVoiceMessage(params.blob);
            return chatService.sendMessage({
                sender_id: params.sender_id || currentUserId,
                receiver_id: params.receiver_id || selectedUserId,
                content: '',
                voice_url: publicUrl,
                voice_duration: params.duration,
            });
        },
        onMutate: async (params) => {
            await queryClient.cancelQueries({ queryKey });
            const previousMessages = queryClient.getQueryData<Message[]>(queryKey);

            const clientId = generateShortToken(16);
            const tempMessage: Message = {
                id: `temp-${clientId}`,
                client_id: clientId,
                sender_id: params.sender_id || currentUserId,
                receiver_id: params.receiver_id || selectedUserId,
                content: '',
                voice_url: params.previewUrl, // Optimistic blob URL
                voice_duration: params.duration,
                created_at: new Date().toISOString(),
                is_edited: false,
            };

            queryClient.setQueryData(queryKey, (old: Message[] = []) => [...old, tempMessage]);

            return { previousMessages, tempId: tempMessage.id, clientId };
        },
        onError: (_err: Error, _variables: unknown, context?: { previousMessages?: Message[] }) => {
            queryClient.setQueryData(queryKey, context?.previousMessages);
        },
        onSettled: () => {
            // Realtime handles the atomic swap
        },
    });

    const deleteMutation = useMutation({
        mutationFn: (id: string) => chatService.deleteMessage(id),
        onMutate: async (id: string) => {
            await queryClient.cancelQueries({ queryKey });
            const previousMessages = queryClient.getQueryData<Message[]>(queryKey);

            queryClient.setQueryData(queryKey, (old: Message[] = []) =>
                old.filter(m => m.id !== id)
            );

            return { previousMessages };
        },
        onError: (_err: Error, _id: string, context?: { previousMessages?: Message[] }) => {
            queryClient.setQueryData(queryKey, context?.previousMessages);
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey });
        },
    });

    const clearHistoryMutation = useMutation({
        mutationFn: () => chatService.clearHistory(currentUserId, selectedUserId),
        onMutate: async () => {
            await queryClient.cancelQueries({ queryKey });
            const previousMessages = queryClient.getQueryData<Message[]>(queryKey);

            // Optimistic clear
            queryClient.setQueryData(queryKey, []);

            return { previousMessages };
        },
        onError: (_err: Error, _vars: unknown, context?: { previousMessages?: Message[] }) => {
            queryClient.setQueryData(queryKey, context?.previousMessages);
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey });
            queryClient.invalidateQueries({ queryKey: ['recipients', currentUserId] });
        },
    });

    const editMutation = useMutation({
        mutationFn: ({ id, content }: { id: string, content: string }) =>
            chatService.editMessage(id, content),
        onMutate: async ({ id, content }: { id: string, content: string }) => {
            await queryClient.cancelQueries({ queryKey });
            const previousMessages = queryClient.getQueryData<Message[]>(queryKey);

            queryClient.setQueryData(queryKey, (old: Message[] = []) =>
                old.map(m => m.id === id ? { ...m, content, is_edited: true } : m)
            );

            return { previousMessages };
        },
        onError: (_err: Error, _vars: { id: string, content: string }, context?: { previousMessages?: Message[] }) => {
            queryClient.setQueryData(queryKey, context?.previousMessages);
        },
        onSettled: () => {
            // No need to invalidate, optimistic update + Realtime handle it smoothly
        },
    });

    // 3. Realtime Handler
    const handleIncomingMessage = useCallback(async (message: Message, event: 'INSERT' | 'UPDATE' | 'DELETE') => {
        if (event === 'INSERT') {
            if (message.image_url) {
                await preloadImageWithRetry(message.image_url);
                await new Promise(resolve => setTimeout(resolve, 50));
            }

            // Atomic Update with Deduplication
            queryClient.setQueryData(queryKey, (old: Message[] = []) => {
                if (old.some(m => m.id === message.id)) return old;

                let replaced = false;
                const nextMessages = old.map(m => {
                    const isTemp = m.id.startsWith('temp-');
                    const isSenderMatch = m.sender_id === message.sender_id;
                    const isMatchingContent = m.content === message.content && m.content !== '';
                    const isMatchingImage = m.image_url && message.image_url;
                    const isMatchingVoice = m.voice_url && message.voice_url;

                    if (!replaced && isTemp && isSenderMatch && (isMatchingContent || isMatchingImage || isMatchingVoice)) {
                        replaced = true;
                        return { ...message, client_id: m.client_id };
                    }
                    return m;
                });

                if (replaced) return nextMessages;
                return [...old, message];
            });
        } else {
            // Processing UPDATE and DELETE
            queryClient.setQueryData(queryKey, (old: Message[] = []) => {
                switch (event) {
                    case 'UPDATE':
                        return old.map(m => m.id === message.id ? message : m);
                    case 'DELETE':
                        return old.filter(m => m.id !== message.id);
                    default:
                        return old;
                }
            });
        }
    }, [queryClient, queryKey]);

    const handleHistoryCleared = useCallback((userId: string, contactId: string) => {
        // Check if cleared history is relevant to the current view
        const isRelevant = (userId === currentUserId && contactId === selectedUserId) ||
            (userId === selectedUserId && contactId === currentUserId);

        if (isRelevant) {
            queryClient.setQueryData(queryKey, []);
        }
    }, [queryClient, queryKey, currentUserId, selectedUserId]);

    return {
        messages,
        isLoading,
        error: error ? (error as Error).message : null,
        sendMessage: sendMutation.mutateAsync,
        editMessage: editMutation.mutateAsync,
        sendImageMessage: sendImageMutation.mutateAsync,
        sendVoiceMessage: sendVoiceMutation.mutateAsync,
        deleteMessage: deleteMutation.mutateAsync,
        uploadAttachment: chatService.uploadAttachment.bind(chatService),
        uploadVoiceMessage: chatService.uploadVoiceMessage.bind(chatService),
        handleIncomingMessage,
        handleHistoryCleared,
        clearHistory: clearHistoryMutation.mutateAsync,
    };
}
