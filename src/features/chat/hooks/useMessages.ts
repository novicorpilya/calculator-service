import { useCallback, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useServices } from '@/core/di/ServiceContainer';
import type {
    Message,
    MessageCreatePayload,
    MessageEventType,
    ChatEventPayload,
    ReadEventPayload,
} from '../types';
import { preloadImage, sortMessages } from '../utils/chatUtils';

interface UseMessagesOptions {
    currentUserId: string;
    selectedUserId: string;
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
    const { chatService } = useServices();
    const queryClient = useQueryClient();
    const queryKey = useMemo(
        () => ['messages', currentUserId, selectedUserId],
        [currentUserId, selectedUserId]
    );

    // 1. Fetching
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

    // 2. Mutations
    const sendMutation = useMutation({
        mutationFn: async (params: MessageCreatePayload) => {
            const res = await chatService.sendMessage(params);
            if (!res.success || !res.data) throw new Error(res.error?.message || 'Send failed');
            return res.data;
        },
        onMutate: async (newMessage: MessageCreatePayload) => {
            await queryClient.cancelQueries({ queryKey });
            const previousMessages = queryClient.getQueryData<Message[]>(queryKey);

            const clientMessageId = crypto.randomUUID();
            newMessage.client_message_id = clientMessageId;

            const tempMessage: Message = {
                id: `temp-${clientMessageId}`,
                client_message_id: clientMessageId,
                sender_id: currentUserId,
                receiver_id: selectedUserId,
                content: newMessage.content,
                image_url: newMessage.image_url,
                voice_url: newMessage.voice_url,
                voice_duration: newMessage.voice_duration,
                created_at: new Date().toISOString(),
                is_edited: false,
                is_read: false,
                calculation_id: null,
                status: 'pending',
            };

            queryClient.setQueryData(queryKey, (old: Message[] = []) =>
                sortMessages([...old, tempMessage])
            );
            return { previousMessages };
        },
        onSuccess: (data: Message) => {
            queryClient.setQueryData(queryKey, (old: Message[] = []) =>
                old.map((m) =>
                    m.client_message_id === data.client_message_id ||
                    m.id === `temp-${data.client_message_id}`
                        ? { ...data, status: 'sent' as const }
                        : m
                )
            );
        },
        onError: (_err, _newMessage, context) => {
            if (context?.previousMessages) {
                queryClient.setQueryData(queryKey, context.previousMessages);
            }
        },
    });

    const sendImageMutation = useMutation<
        Message,
        Error,
        SendImageParams,
        { previousMessages?: Message[] }
    >({
        mutationFn: async (params) => {
            const uploadRes = await chatService.uploadAttachment(params.file);
            if (!uploadRes.success) throw new Error(uploadRes.error?.message || 'Upload failed');
            const publicUrl = uploadRes.data || '';

            const res = await chatService.sendMessage({
                sender_id: params.sender_id || currentUserId,
                receiver_id: params.receiver_id || selectedUserId,
                content: params.content || '',
                image_url: publicUrl,
                reply_to_id: params.reply_to_id,
                calculation_id: null,
                client_message_id: params.client_message_id,
            });

            if (!res.success || !res.data) throw new Error(res.error?.message || 'Send failed');
            return res.data;
        },
        onMutate: async (params) => {
            await queryClient.cancelQueries({ queryKey });
            const previousMessages = queryClient.getQueryData<Message[]>(queryKey);

            const clientMessageId = crypto.randomUUID();
            params.client_message_id = clientMessageId;

            const tempMessage: Message = {
                id: `temp-${clientMessageId}`,
                client_message_id: clientMessageId,
                sender_id: params.sender_id || currentUserId,
                receiver_id: params.receiver_id || selectedUserId,
                content: params.content || '',
                image_url: params.previewUrl,
                created_at: new Date().toISOString(),
                is_edited: false,
                is_read: false,
                calculation_id: null,
                status: 'pending',
            };

            queryClient.setQueryData(queryKey, (old: Message[] = []) =>
                sortMessages([...old, tempMessage])
            );
            return { previousMessages, tempId: tempMessage.id, clientMessageId };
        },
        onSuccess: (data: Message) => {
            queryClient.setQueryData(queryKey, (old: Message[] = []) =>
                old.map((m) =>
                    m.client_message_id === data.client_message_id ||
                    m.id === `temp-${data.client_message_id}`
                        ? { ...data, status: 'sent' as const }
                        : m
                )
            );
        },
        onError: (_err, _vars, context) => {
            queryClient.setQueryData(queryKey, context?.previousMessages);
        },
    });

    const sendVoiceMutation = useMutation<
        Message,
        Error,
        SendVoiceParams,
        { previousMessages?: Message[] }
    >({
        mutationFn: async (params) => {
            const uploadRes = await chatService.uploadVoiceMessage(params.blob);
            if (!uploadRes.success)
                throw new Error(uploadRes.error?.message || 'Voice upload failed');
            const publicUrl = uploadRes.data || '';

            const res = await chatService.sendMessage({
                sender_id: params.sender_id || currentUserId,
                receiver_id: params.receiver_id || selectedUserId,
                content: '',
                voice_url: publicUrl,
                voice_duration: params.duration,
                calculation_id: null,
                client_message_id: params.client_message_id,
            });

            if (!res.success || !res.data) throw new Error(res.error?.message || 'Send failed');
            return res.data;
        },
        onMutate: async (params) => {
            await queryClient.cancelQueries({ queryKey });
            const previousMessages = queryClient.getQueryData<Message[]>(queryKey);

            const clientMessageId = crypto.randomUUID();
            params.client_message_id = clientMessageId;

            const tempMessage: Message = {
                id: `temp-${clientMessageId}`,
                client_message_id: clientMessageId,
                sender_id: params.sender_id || currentUserId,
                receiver_id: params.receiver_id || selectedUserId,
                content: '',
                voice_url: params.previewUrl,
                voice_duration: params.duration,
                created_at: new Date().toISOString(),
                is_edited: false,
                is_read: false,
                calculation_id: null,
                status: 'pending',
            };

            queryClient.setQueryData(queryKey, (old: Message[] = []) =>
                sortMessages([...old, tempMessage])
            );
            return { previousMessages, tempId: tempMessage.id, clientMessageId };
        },
        onSuccess: (data: Message) => {
            queryClient.setQueryData(queryKey, (old: Message[] = []) =>
                old.map((m) =>
                    m.client_message_id === data.client_message_id ||
                    m.id === `temp-${data.client_message_id}`
                        ? { ...data, status: 'sent' as const }
                        : m
                )
            );
        },
        onError: (_err, _vars, context) => {
            queryClient.setQueryData(queryKey, context?.previousMessages);
        },
    });

    const deleteMutation = useMutation({
        mutationFn: async (id: string) => {
            const res = await chatService.deleteMessage(id);
            if (!res.success) throw new Error(res.error?.message || 'Delete failed');
            return id;
        },
        onMutate: async (id: string) => {
            await queryClient.cancelQueries({ queryKey });
            const previousMessages = queryClient.getQueryData<Message[]>(queryKey);
            queryClient.setQueryData(queryKey, (old: Message[] = []) =>
                old.filter((m) => m.id !== id)
            );
            return { previousMessages };
        },
        onError: (_err, _id, context) => {
            queryClient.setQueryData(queryKey, context?.previousMessages);
        },
    });

    const clearHistoryMutation = useMutation({
        mutationFn: async () => {
            const res = await chatService.clearHistory(currentUserId, selectedUserId);
            if (!res.success) throw new Error(res.error?.message || 'Clear history failed');
            return true;
        },
        onMutate: async () => {
            await queryClient.cancelQueries({ queryKey });
            const previousMessages = queryClient.getQueryData<Message[]>(queryKey);
            queryClient.setQueryData(queryKey, []);
            return { previousMessages };
        },
        onError: (_err, _vars, context) => {
            queryClient.setQueryData(queryKey, context?.previousMessages);
        },
    });

    const editMutation = useMutation({
        mutationFn: async ({ id, content }: { id: string; content: string }) => {
            const res = await chatService.editMessage(id, content);
            if (!res.success) throw new Error(res.error?.message || 'Edit failed');
            return { id, content };
        },
        onMutate: async ({ id, content }) => {
            await queryClient.cancelQueries({ queryKey });
            const previousMessages = queryClient.getQueryData<Message[]>(queryKey);
            queryClient.setQueryData(queryKey, (old: Message[] = []) =>
                old.map((m) => (m.id === id ? { ...m, content, is_edited: true } : m))
            );
            return { previousMessages };
        },
        onError: (_err, _vars, context) => {
            queryClient.setQueryData(queryKey, context?.previousMessages);
        },
    });

    // 3. Realtime Handler
    const handleIncomingMessage = useCallback(
        (payload: ChatEventPayload, event: MessageEventType) => {
            // Guard: For INSERT/UPDATE/DELETE events, payload should be a Message
            const message = 'id' in payload ? (payload as Message) : null;

            // 0. Safety check: does this message belong to the active chat?
            const isRelevant =
                message &&
                ((message.sender_id === selectedUserId && message.receiver_id === currentUserId) ||
                    (message.sender_id === currentUserId &&
                        message.receiver_id === selectedUserId));

            if (event === 'INSERT' && message) {
                if (!isRelevant) return; // Ignore messages from other chats

                if (message.image_url) {
                    preloadImage(message.image_url).catch(() => {});
                }

                queryClient.setQueryData(queryKey, (old: Message[] = []) => {
                    // If it already exists (from optimistic update or server success), skip
                    if (old.some((m) => m.id === message.id)) return old;

                    let replaced = false;
                    const nextMessages = old.map((m) => {
                        if (replaced) return m;

                        // Match by client_message_id
                        if (
                            message.client_message_id &&
                            m.client_message_id === message.client_message_id
                        ) {
                            replaced = true;
                            return { ...message, status: 'sent' as const };
                        }

                        // Match by temporary ID logic (fallback for media/content)
                        if (m.id.startsWith('temp-') && m.sender_id === message.sender_id) {
                            const contentMatch = m.content === message.content && m.content !== '';
                            const mediaMatch =
                                (m.image_url && message.image_url) ||
                                (m.voice_url && message.voice_url);

                            if (contentMatch || mediaMatch) {
                                replaced = true;
                                return { ...message, status: 'sent' as const };
                            }
                        }

                        return m;
                    });

                    if (replaced) return sortMessages(nextMessages);
                    return sortMessages([...old, { ...message, status: 'sent' as const }]);
                });
            } else if (event === 'READ') {
                const readPayload = payload as ReadEventPayload;
                if (!readPayload.readerId) return;

                // 1. If person I chat with read my messages (shows 2 ticks)
                const isTargetRead =
                    readPayload.readerId === selectedUserId &&
                    readPayload.receiverId === currentUserId;

                // 2. OR if I read this chat elsewhere (marks all as read for me)
                const isMeRead =
                    readPayload.readerId === currentUserId &&
                    readPayload.receiverId === currentUserId;

                if (isTargetRead || isMeRead) {
                    queryClient.setQueryData(queryKey, (old: Message[] = []) =>
                        old.map((m) => {
                            // Mark our own messages as read if target read them
                            if (isTargetRead && m.sender_id === currentUserId)
                                return { ...m, is_read: true };
                            // Mark their messages as read if we read them elsewhere
                            if (isMeRead && m.sender_id === selectedUserId)
                                return { ...m, is_read: true };
                            return m;
                        })
                    );
                }
            } else if (message) {
                if (!isRelevant && event !== 'RECONNECT') return;

                queryClient.setQueryData(queryKey, (old: Message[] = []) => {
                    switch (event) {
                        case 'UPDATE':
                            // If it's a read receipt update (is_read changed) or content update
                            return old.map((m) => (m.id === message.id ? { ...m, ...message } : m));
                        case 'DELETE':
                            return old.filter((m) => m.id !== message.id);
                        case 'RECONNECT':
                            // Only case where we refetch to ensure consistency after network gap
                            queryClient.invalidateQueries({ queryKey });
                            return old;
                        default:
                            return old;
                    }
                });
            }
        },
        [queryClient, queryKey, currentUserId, selectedUserId]
    );

    const handleHistoryCleared = useCallback(
        (userId: string, contactId: string) => {
            const isRelevant =
                (userId === currentUserId && contactId === selectedUserId) ||
                (userId === selectedUserId && contactId === currentUserId);
            if (isRelevant) {
                queryClient.setQueryData(queryKey, []);
            }
        },
        [queryClient, queryKey, currentUserId, selectedUserId]
    );

    return {
        messages,
        isLoading,
        error: error ? (error as Error).message : null,
        sendMessage: sendMutation.mutateAsync,
        editMessage: editMutation.mutateAsync,
        sendImageMessage: sendImageMutation.mutateAsync,
        sendVoiceMessage: sendVoiceMutation.mutateAsync,
        deleteMessage: deleteMutation.mutateAsync,
        handleIncomingMessage,
        handleHistoryCleared,
        clearHistory: clearHistoryMutation.mutateAsync,
    };
}
