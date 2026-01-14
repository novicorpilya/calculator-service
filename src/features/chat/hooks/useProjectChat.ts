import { useCallback, useEffect, useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useServices } from '@/core/di/ServiceContainer';
import { logger } from '@/core/logging';
import { type Message, type MessageEventType, type ReadEventPayload } from '@/features/chat/types';
import { toast } from 'sonner';
import { CalculationEntity } from '@/core/domain/CalculationEntity';
import { preloadImage, sortMessages } from '../utils/chatUtils';

export function useProjectChat(
    entity: CalculationEntity,
    user: { id: string; role?: string } | null
) {
    const { chatService } = useServices();
    const queryClient = useQueryClient();
    const [isTyping, setIsTyping] = useState(false);
    const queryKey = useMemo(() => ['messages', 'calculation', String(entity.id)], [entity.id]);

    // 1. Fetching
    const { data: messages = [], isLoading: loadingMessages } = useQuery({
        queryKey,
        queryFn: async () => {
            const res = await chatService.getCalculationMessages(String(entity.id));
            if (!res.success) throw new Error(res.error?.message || 'Failed to fetch messages');
            return res.data || [];
        },
        select: (data: Message[]) => sortMessages(data),
        enabled: !!entity.id,
        staleTime: 1000 * 30,
    });

    // 2. Mutations
    const sendMutation = useMutation({
        mutationFn: async ({
            text,
            attachments,
            clientIds,
        }: {
            text: string;
            attachments: { file: File; preview: string }[];
            clientIds: string[];
        }) => {
            const receiverId = user?.role === 'manager' ? entity.userId : entity.managerId;
            if (!receiverId) throw new Error('Receiver not defined');

            const results: Message[] = [];
            for (let i = 0; i < (attachments.length || 1); i++) {
                let imageUrl: string | null = null;
                if (attachments[i]) {
                    const uploadRes = await chatService.uploadAttachment(attachments[i].file);
                    if (!uploadRes.success)
                        throw new Error(uploadRes.error?.message || 'Upload failed');
                    imageUrl = uploadRes.data || null;
                }

                const res = await chatService.sendMessage({
                    sender_id: user!.id,
                    receiver_id: null,
                    calculation_id: String(entity.id),
                    content: i === 0 ? text : '',
                    image_url: imageUrl,
                    client_message_id: clientIds[i],
                });

                if (!res.success || !res.data) throw new Error(res.error?.message || 'Send failed');
                results.push(res.data);
            }
            return results;
        },
        onMutate: async ({ text, attachments }) => {
            const receiverId = user?.role === 'manager' ? entity.userId : entity.managerId;
            await queryClient.cancelQueries({ queryKey });
            const previousMessages = queryClient.getQueryData<Message[]>(queryKey);

            const timestamp = new Date().toISOString();
            const optimisticMsgs: Message[] = [];
            const clientIds: string[] = [];

            if (attachments.length > 0) {
                attachments.forEach((att, i) => {
                    const clientMsgId = crypto.randomUUID();
                    clientIds.push(clientMsgId);
                    optimisticMsgs.push({
                        id: `temp-${clientMsgId}`,
                        sender_id: user!.id,
                        receiver_id: receiverId!,
                        calculation_id: String(entity.id),
                        content: i === 0 ? text : '',
                        image_url: att.preview, // Используем blob URL для превью
                        created_at: timestamp,
                        client_message_id: clientMsgId,
                        status: 'pending',
                    } as Message);
                });
            } else {
                const clientMsgId = crypto.randomUUID();
                clientIds.push(clientMsgId);
                optimisticMsgs.push({
                    id: `temp-${clientMsgId}`,
                    sender_id: user!.id,
                    receiver_id: receiverId!,
                    calculation_id: String(entity.id),
                    content: text,
                    created_at: timestamp,
                    client_message_id: clientMsgId,
                    status: 'pending',
                } as Message);
            }

            queryClient.setQueryData(queryKey, (old: Message[] = []) => [
                ...old,
                ...optimisticMsgs,
            ]);
            return { previousMessages, optimisticMsgs, clientIds };
        },
        onSuccess: (data: Message[]) => {
            // Мгновенно заменяем временные сообщения реальными данными с сервера (с правильными URL)
            queryClient.setQueryData(queryKey, (old: Message[] = []) => {
                let next = [...old];
                data.forEach((realMsg) => {
                    next = next.map((m) =>
                        m.client_message_id === realMsg.client_message_id
                            ? { ...realMsg, status: 'sent' as const }
                            : m
                    );
                });
                return sortMessages(next);
            });
        },
        onError: (err, _vars, context) => {
            logger.error('Failed to send project message', { err });
            toast.error('Ошибка отправки');
            if (context?.optimisticMsgs) {
                queryClient.setQueryData(queryKey, (old: Message[] = []) => {
                    const optIds = context.optimisticMsgs.map((m) => m.client_message_id);
                    return old.map((m) =>
                        optIds.includes(m.client_message_id)
                            ? { ...m, status: 'error' as const }
                            : m
                    );
                });
            }
        },
    });

    const voiceMutation = useMutation({
        mutationFn: async ({
            blob,
            duration,
            clientId,
        }: {
            blob: Blob;
            duration: number;
            clientId: string;
        }) => {
            const receiverId = user?.role === 'manager' ? entity.userId : entity.managerId;
            if (!receiverId) throw new Error('Receiver not defined');

            const uploadRes = await chatService.uploadVoiceMessage(blob);
            if (!uploadRes.success)
                throw new Error(uploadRes.error?.message || 'Voice upload failed');
            const voiceUrl = uploadRes.data || '';

            const res = await chatService.sendMessage({
                sender_id: user!.id,
                receiver_id: null,
                calculation_id: String(entity.id),
                content: '',
                voice_url: voiceUrl,
                voice_duration: duration,
                client_message_id: clientId,
            });

            if (!res.success || !res.data) throw new Error(res.error?.message || 'Send failed');
            return res.data;
        },
        onMutate: async ({ duration, clientId }) => {
            const receiverId = user?.role === 'manager' ? entity.userId : entity.managerId;
            await queryClient.cancelQueries({ queryKey });
            const previousMessages = queryClient.getQueryData<Message[]>(queryKey);

            const timestamp = new Date().toISOString();
            const optimisticMsg: Message = {
                id: `temp-${clientId}`,
                sender_id: user!.id,
                receiver_id: receiverId!,
                calculation_id: String(entity.id),
                content: '',
                voice_url: 'pending', // Placeholder
                voice_duration: duration,
                created_at: timestamp,
                client_message_id: clientId,
                status: 'pending',
            } as Message;

            queryClient.setQueryData(queryKey, (old: Message[] = []) => [...old, optimisticMsg]);
            return { previousMessages, optimisticMsg };
        },
        onSuccess: (realMsg: Message) => {
            queryClient.setQueryData(queryKey, (old: Message[] = []) => {
                return sortMessages(
                    old.map((m) =>
                        m.client_message_id === realMsg.client_message_id
                            ? { ...realMsg, status: 'sent' as const }
                            : m
                    )
                );
            });
        },
        onError: (err, _vars, context) => {
            logger.error('Failed to send voice message', { err });
            toast.error('Ошибка отправки голосового сообщения');
            if (context?.optimisticMsg) {
                queryClient.setQueryData(queryKey, (old: Message[] = []) => {
                    return old.map((m) =>
                        m.client_message_id === context.optimisticMsg.client_message_id
                            ? { ...m, status: 'error' as const }
                            : m
                    );
                });
            }
        },
    });

    // 3. Sync Logic
    const performDeepSync = useCallback(async () => {
        if (!entity.id || !user) return;
        try {
            await chatService.syncReadStatus(entity, user);
        } catch (err) {
            logger.warn('Deep sync failure', { error: err });
        } finally {
            // Force invalidate unread counts for both roles
            queryClient.invalidateQueries({ queryKey: ['unread-counts', user.id] });
            // Also invalidate messages to show new "read" statuses
            queryClient.invalidateQueries({ queryKey });
        }
    }, [entity, user, queryClient, queryKey, chatService]);

    // Clear notifications on mount & window focus
    useEffect(() => {
        const handleSync = () => {
            if (document.visibilityState === 'visible') {
                performDeepSync();
            }
        };
        handleSync(); // mount
        window.addEventListener('focus', handleSync);
        window.addEventListener('visibilitychange', handleSync);
        return () => {
            window.removeEventListener('focus', handleSync);
            window.removeEventListener('visibilitychange', handleSync);
        };
    }, [performDeepSync]);

    useEffect(() => {
        if (!entity.id || !user) return;

        const unsubscribe = chatService.subscribeToMessages(
            async (payload, eventType: MessageEventType) => {
                switch (eventType) {
                    case 'RECONNECT':
                        performDeepSync();
                        break;
                    case 'READ': {
                        const readPayload = payload as ReadEventPayload;
                        // If someone else read messages in THIS project
                        const isRelevantRead =
                            readPayload.calculationId === String(entity.id) &&
                            readPayload.readerId !== user?.id;

                        if (isRelevantRead) {
                            queryClient.setQueryData(queryKey, (old: Message[] = []) =>
                                old.map((m) =>
                                    m.sender_id === user?.id ? { ...m, is_read: true } : m
                                )
                            );
                        }
                        break;
                    }
                    case 'INSERT': {
                        const msg = payload as Message;
                        if (msg.image_url) preloadImage(msg.image_url).catch(() => {});

                        // If we receive a message in the ACTIVE project from SOMEONE ELSE,
                        // we mark it as read on the backend, but we DON'T invalidate the whole list.
                        const isWindowVisible = document.visibilityState === 'visible';
                        if (
                            msg.calculation_id === String(entity.id) &&
                            msg.sender_id !== user.id &&
                            isWindowVisible
                        ) {
                            chatService.syncReadStatus(entity, user).catch(() => {});
                            // Targeted count invalidation is fine, but messages list stays stream-based
                            queryClient.invalidateQueries({ queryKey: ['unread-counts', user.id] });
                        }

                        queryClient.setQueryData(queryKey, (old: Message[] = []) => {
                            const alreadyExists = old.some((m) => m.id === msg.id);
                            if (alreadyExists) return old;

                            let replaced = false;
                            const next = old.map((m) => {
                                if (replaced) return m;
                                // Match by client_message_id or media/content fallback
                                const idMatch =
                                    msg.client_message_id &&
                                    m.client_message_id === msg.client_message_id;
                                const mediaMatch =
                                    m.id.startsWith('temp-') &&
                                    !m.content &&
                                    !msg.content &&
                                    m.image_url &&
                                    msg.image_url;
                                const textMatch =
                                    m.id.startsWith('temp-') &&
                                    m.content === msg.content &&
                                    m.content !== '';

                                if (idMatch || mediaMatch || textMatch) {
                                    replaced = true;
                                    return { ...msg, status: 'sent' as const };
                                }
                                return m;
                            });

                            return replaced
                                ? sortMessages(next)
                                : sortMessages([...old, { ...msg, status: 'sent' as const }]);
                        });
                        break;
                    }
                    case 'UPDATE': {
                        const msg = payload as Message;
                        queryClient.setQueryData(queryKey, (old: Message[] = []) =>
                            old.map((m) => (m.id === msg.id ? { ...m, ...msg } : m))
                        );
                        break;
                    }
                    case 'DELETE': {
                        const msg = payload as Message;
                        queryClient.setQueryData(queryKey, (old: Message[] = []) =>
                            old.filter((m) => m.id !== msg.id)
                        );
                        break;
                    }
                    case 'TYPING': {
                        const typingPayload = payload as { sender_id: string };
                        if (typingPayload.sender_id !== user?.id) {
                            setIsTyping(true);
                            setTimeout(() => setIsTyping(false), 3000);
                        }
                        break;
                    }
                }
            },
            String(entity.id)
        );

        return () => unsubscribe();
    }, [entity, user, queryKey, queryClient, performDeepSync, chatService]);

    return {
        messages,
        loadingMessages,
        isTyping,
        sendMessage: async (text: string, attachments: { file: File; preview: string }[]) => {
            if (!user || (!text.trim() && attachments.length === 0)) return;
            const clientIds =
                attachments.length > 0
                    ? attachments.map(() => crypto.randomUUID())
                    : [crypto.randomUUID()];
            return sendMutation.mutateAsync({ text, attachments, clientIds });
        },
        sendVoice: async (blob: Blob, duration: number) => {
            if (!user) return;
            const clientId = crypto.randomUUID();
            return voiceMutation.mutateAsync({ blob, duration, clientId });
        },
        resendMessage: useCallback(
            async (msg: Message) => {
                queryClient.setQueryData(queryKey, (old: Message[] = []) =>
                    old.filter((m) => m.client_message_id !== msg.client_message_id)
                );
                if (msg.content) {
                    const clientIds = [msg.client_message_id || crypto.randomUUID()];
                    sendMutation.mutate({ text: msg.content, attachments: [], clientIds });
                }
            },
            [sendMutation, queryClient, queryKey]
        ),
    };
}
