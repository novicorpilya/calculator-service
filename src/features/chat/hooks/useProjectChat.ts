import { useCallback, useEffect, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { chatService, logger } from '@/app/services';
import type { Message, MessageEventType } from '@/features/chat/types';
import { toast } from 'sonner';
import { CalculationEntity } from '@/core/domain/CalculationEntity';

export function useProjectChat(entity: CalculationEntity, user: { id: string; role?: string } | null) {
    const queryClient = useQueryClient();
    const queryKey = useMemo(() => ['messages', 'calculation', String(entity.id)], [entity.id]);

    // 1. Fetching
    const { data: messages = [], isLoading: loadingMessages, refetch } = useQuery({
        queryKey,
        queryFn: () => chatService.getCalculationMessages(String(entity.id)),
        select: (data) => sortMessages(data),
        enabled: !!entity.id,
        refetchOnWindowFocus: true,
        refetchOnReconnect: true,
        staleTime: 1000 * 30, // 30 seconds
    });

    // Manual sync on reconnection (browser level)
    useEffect(() => {
        const handleOnline = () => {
            logger.info('App back online, syncing chat history...');
            refetch();
        };
        window.addEventListener('online', handleOnline);
        return () => window.removeEventListener('online', handleOnline);
    }, [refetch]);

    const sortMessages = useCallback((msgs: Message[]) => {
        return [...msgs].sort((a, b) => {
            const timeA = new Date(a.created_at).getTime();
            const timeB = new Date(b.created_at).getTime();
            if (timeA !== timeB) return timeA - timeB;
            // Fallback for same-millisecond messages: use stable ID compare
            return String(a.id).localeCompare(String(b.id));
        });
    }, []);

    // 2. Mutations
    const sendMutation = useMutation({
        mutationFn: async ({ text, attachments, clientIds }: { text: string, attachments: { file: File, preview: string }[], clientIds: string[] }) => {
            const receiverId = user?.role === 'manager' ? entity.userId : entity.managerId;
            if (!receiverId) throw new Error('Receiver not defined');

            if (attachments.length > 0) {
                const urls = await Promise.all(attachments.map(att => chatService.uploadAttachment(att.file)));
                for (let i = 0; i < urls.length; i++) {
                    await chatService.sendMessage({
                        sender_id: user!.id,
                        receiver_id: null,
                        calculation_id: String(entity.id),
                        content: i === 0 ? text : '',
                        image_url: urls[i],
                        client_message_id: clientIds[i]
                    });
                }
            } else {
                await chatService.sendMessage({
                    sender_id: user!.id,
                    receiver_id: null,
                    calculation_id: String(entity.id),
                    content: text,
                    client_message_id: clientIds[0]
                });
            }
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
                        image_url: att.preview,
                        created_at: timestamp,
                        client_message_id: clientMsgId,
                        status: 'pending'
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
                    status: 'pending'
                } as Message);
            }

            queryClient.setQueryData(queryKey, (old: Message[] = []) => [...old, ...optimisticMsgs]);
            
            return { previousMessages, optimisticMsgs, clientIds };
        },
        onError: (err, _vars, context) => {
            logger.error('Failed to send project message', { err });
            toast.error('Ошибка отправки');
            
            if (context?.optimisticMsgs) {
                queryClient.setQueryData(queryKey, (old: Message[] = []) => {
                    const optIds = context.optimisticMsgs.map(m => m.client_message_id);
                    return old.map(m => 
                        optIds.includes(m.client_message_id) 
                            ? { ...m, status: 'error' as const } 
                            : m
                    );
                });
            }
        },
        onSettled: () => {
            // Realtime handles the swap, but invalidate ensures consistency
            queryClient.invalidateQueries({ queryKey });
        }
    });

    const syncChannel = useMemo(() => new BroadcastChannel('chat_local_sync'), []);

    const performDeepSync = useCallback(async () => {
        if (!entity.id || !user) return;
        
        // 1. Optimistic Update of UI
        queryClient.setQueryData(['unread-counts', user.id], (old: any) => {
            if (!old) return old;
            const projectCounts = { ...old.perProject };
            const countToSubtract = projectCounts[String(entity.id)] || 0;
            delete projectCounts[String(entity.id)];
            
            return {
                ...old,
                total: Math.max(0, old.total - countToSubtract),
                perProject: projectCounts
            };
        });

        // 2. Perform background sync
        try {
            const shouldInvalidate = await chatService.syncReadStatus(entity, user);
            if (shouldInvalidate) {
                const payload = { type: 'PROJECT_READ', calculationId: String(entity.id), userId: user.id };
                syncChannel.postMessage(payload);
            }
        } catch (err) {
            logger.warn('Deep sync background failure', { error: err });
        } finally {
            // 3. Final Invalidation to ensure truth
            queryClient.invalidateQueries({ queryKey });
            queryClient.invalidateQueries({ queryKey: ['unread-counts', user.id] });
        }
    }, [entity.id, user, queryClient, syncChannel, queryKey]);

    useEffect(() => {
        const handleMessage = (event: MessageEvent) => {
            if (event.data.type === 'PROJECT_READ' && event.data.calculationId === String(entity.id)) {
                queryClient.invalidateQueries({ queryKey });
                queryClient.invalidateQueries({ queryKey: ['unread-counts', user?.id] });
            }
        };
        syncChannel.addEventListener('message', handleMessage);
        return () => syncChannel.removeEventListener('message', handleMessage);
    }, [syncChannel, entity.id, user?.id, queryClient, queryKey]);

    // Sync on reconnection or visibility change
    useEffect(() => {
        const handleSync = () => {
            if (document.visibilityState === 'visible') {
                performDeepSync();
            }
        };
        window.addEventListener('online', handleSync);
        window.addEventListener('visibilitychange', handleSync);
        window.addEventListener('focus', handleSync);
        
        return () => {
            window.removeEventListener('online', handleSync);
            window.removeEventListener('visibilitychange', handleSync);
            window.removeEventListener('focus', handleSync);
        };
    }, [performDeepSync]);

    const resendMessage = useCallback(async (msg: Message) => {
        // 1. Remove that error message from cache first
        queryClient.setQueryData(queryKey, (old: Message[] = []) => 
            old.filter(m => m.client_message_id !== msg.client_message_id)
        );
        
        // 2. Trigger retry (for text-only retry for now)
        if (msg.content) {
            sendMutation.mutate({ text: msg.content, attachments: [], clientIds: [msg.client_message_id!] });
        }
    }, [sendMutation, queryClient, queryKey]);

    const clearHistoryMutation = useMutation({
        mutationFn: () => chatService.clearProjectHistory(String(entity.id)),
        onMutate: async () => {
            await queryClient.cancelQueries({ queryKey });
            const previousMessages = queryClient.getQueryData<Message[]>(queryKey);
            queryClient.setQueryData(queryKey, []);
            return { previousMessages };
        },
        onError: (_err, _vars, context) => {
            toast.error('Не удалось очистить историю');
            queryClient.setQueryData(queryKey, context?.previousMessages);
        },
        onSuccess: () => {
            toast.success('История обсуждения очищена');
        }
    });

    // 3. Effects (Sync & Realtime)
    useEffect(() => {
        if (!entity.id || !user) return;

        // Initial Sync
        performDeepSync();

        // Realtime Subscription
        const unsubscribe = chatService.subscribeToMessages(async (msg, eventType: MessageEventType) => {
            switch (eventType) {
                case 'RECONNECT':
                    logger.info('Realtime reconnected, triggering deep sync...');
                    performDeepSync();
                    break;
                case 'READ': {
                    const payload = msg as any;
                    if (payload.calculationId === String(entity.id) && payload.receiverId !== user?.id) {
                        queryClient.setQueryData(queryKey, (old: Message[] = []) => 
                            old.map(m => m.sender_id === user?.id ? { ...m, is_read: true } : m)
                        );
                    }
                    break;
                }
                case 'INSERT': {
                    // Auto-read logic if chat is open and visible
                    const isRelevant = msg.calculation_id === String(entity.id);
                    const isForMe = msg.receiver_id === user?.id || (msg.receiver_id === null && msg.sender_id !== user?.id);
                    
                    if (isRelevant && isForMe && document.visibilityState === 'visible') {
                        // Optimistic Clear
                        queryClient.setQueryData(['unread-counts', user.id], (old: any) => {
                            if (!old) return old;
                            const projectCounts = { ...old.perProject };
                            const countToSubtract = projectCounts[String(entity.id)] || 0;
                            if (countToSubtract === 0) return old;
                            
                            delete projectCounts[String(entity.id)];
                            return {
                                ...old,
                                total: Math.max(0, old.total - countToSubtract),
                                perProject: projectCounts
                            };
                        });

                        chatService.markProjectAsRead(String(entity.id), user!.id)
                            .then(() => queryClient.invalidateQueries({ queryKey: ['unread-counts', user?.id] }))
                            .catch(err => {
                                logger.warn('Auto-read failure', { error: err });
                                toast.error('Не удалось синхронизировать статус прочтения');
                            });
                    }

                    if (msg.image_url) await preloadImage(msg.image_url);

                    queryClient.setQueryData(queryKey, (old: Message[] = []) => {
                        let next = [...old];
                        // 10/10 Idempotency: Swap temp message with real one
                        if (msg.sender_id === user?.id && msg.client_message_id) {
                            const tempIdx = next.findIndex(m => m.client_message_id === msg.client_message_id);
                            if (tempIdx !== -1) {
                                next[tempIdx] = { ...msg, status: 'sent' };
                                return sortMessages(next);
                            }
                        }
                        if (next.some(m => m.id === msg.id)) return next;
                        return sortMessages([...next, { ...msg, status: 'sent' }]);
                    });
                    break;
                }
                case 'UPDATE':
                    queryClient.setQueryData(queryKey, (old: Message[] = []) => 
                        old.map(m => m.id === msg.id ? { ...m, ...msg } : m));
                    break;
                case 'DELETE':
                    queryClient.setQueryData(queryKey, (old: Message[] = []) => 
                        old.filter(m => m.id !== msg.id));
                    break;
            }
        }, String(entity.id));

        return () => unsubscribe();
    }, [entity.id, user, queryKey, queryClient]);

    const clearHistory = async () => {
        const confirmed = window.confirm('Вы уверены, что хотите полностью очистить историю обсуждения этого проекта?');
        if (confirmed) clearHistoryMutation.mutate();
    };

    const sendMessage = async (text: string, attachments: { file: File, preview: string }[]) => {
        if (!user || (!text.trim() && attachments.length === 0)) return;
        // We generate IDs here to pass them through for absolute stability
        const clientIds = attachments.length > 0 
            ? attachments.map(() => crypto.randomUUID())
            : [crypto.randomUUID()];
            
        return sendMutation.mutateAsync({ text, attachments, clientIds });
    };

    return {
        messages,
        loadingMessages,
        clearHistory,
        sendMessage,
        resendMessage
    };
}

async function preloadImage(url: string) {
    return new Promise<void>((resolve) => {
        const img = new Image();
        img.onload = () => resolve();
        img.onerror = () => resolve();
        img.src = url;
    });
}
