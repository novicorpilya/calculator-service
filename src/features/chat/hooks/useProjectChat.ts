import { useEffect, useMemo, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useServices } from '@/app/di/ServiceContainer';
import { type Message, type MessageAckPayload, type ReadEventPayload } from '@/features/chat/types';
import { CalculationEntity } from '@/core/domain/CalculationEntity';
import { sortMessages } from '../utils/chatUtils';

export function useProjectChat(
    entity: CalculationEntity,
    user: { id: string; role?: string } | null
) {
    const { chatService } = useServices();
    const queryClient = useQueryClient();
    const queryKey = useMemo(() => ['messages', 'calculation', String(entity.id)], [entity.id]);

    const { data: messages = [], isLoading: loadingMessages } = useQuery({
        queryKey,
        queryFn: async () => {
            const res = await chatService.getCalculationMessages(String(entity.id));
            if (!res.success) throw new Error(res.error?.message || 'Failed to fetch messages');
            return res.data || [];
        },
        select: (data: Message[]) => sortMessages(data),
        enabled: !!entity.id,
    });

    // Track sequence for Gap Detection
    const lastSeqIdRef = useRef<number>(0);

    useEffect(() => {
        if (messages.length > 0) {
            const sorted = [...messages].sort((a, b) => (b.server_seq_id || 0) - (a.server_seq_id || 0));
            lastSeqIdRef.current = sorted[0].server_seq_id || 0;
        }
    }, [messages]);

    const sendMutation = useMutation({
        mutationFn: async ({ text, attachments, clientIds }: { text: string; attachments: { file: File; preview: string }[]; clientIds: string[] }) => {
            const results: Message[] = [];
            for (let i = 0; i < (attachments.length || 1); i++) {
                let imageUrl = null;
                if (attachments[i]) {
                    const uploadRes = await chatService.uploadAttachment(attachments[i].file);
                    imageUrl = uploadRes.data || null;
                }
                const res = await chatService.sendMessage({
                    sender_id: user!.id,
                    calculation_id: String(entity.id),
                    content: i === 0 ? text : '',
                    image_url: imageUrl,
                    client_message_id: clientIds[i],
                });
                if (res.success && res.data) results.push(res.data);
            }
            return results;
        },
        onMutate: async ({ text, attachments, clientIds }) => {
            await queryClient.cancelQueries({ queryKey });
            const previousMessages = queryClient.getQueryData<Message[]>(queryKey);
            
            const optimisticMsgs = (attachments?.length > 0 ? attachments : [null]).map((att: { preview?: string } | null, i: number) => ({
                id: `temp-${clientIds[i]}`,
                sender_id: user!.id,
                calculation_id: String(entity.id),
                content: i === 0 ? text : '',
                image_url: att?.preview || null,
                created_at: new Date().toISOString(),
                client_message_id: clientIds[i],
                status: 'pending',
            }));

            queryClient.setQueryData(queryKey, (old: Message[] = []) => [...old, ...optimisticMsgs]);
            return { previousMessages };
        },
        onSuccess: (data: Message[]) => {
            queryClient.setQueryData(queryKey, (old: Message[] = []) => {
                const next = old.filter(m => !data.some(d => d.client_message_id === m.client_message_id));
                return sortMessages([...next, ...data]);
            });
        }
    });

    // 4. SYNC ON STATUS CHANGE: Если статус проекта изменился, принудительно обновляем сообщения.
    // Это решает проблему "мертвой зоны", когда скрипт вставляется в БД одновременно со статусом,
    // и реалтайм событие может быть пропущено во время перерисовки UI.
    useEffect(() => {
        if (entity.status) {
            queryClient.invalidateQueries({ queryKey });
        }
    }, [entity.status, queryKey, queryClient]);

    useEffect(() => {
        if (!entity.id || !user) return;
        const sub = chatService.subscribeToMessages(async (payload, eventType) => {
            if (eventType === 'INSERT') {
                const msg = payload as Message;
                
                // Parse metadata if it's a string, and detect system status
                let meta = {};
                try {
                    meta = typeof msg.metadata === 'string' ? JSON.parse(msg.metadata) : (msg.metadata || {});
                } catch (e) {
                    console.warn('[ProjectChat] Failed to parse metadata', e);
                }
                
                // Проверка на системное сообщение (скрипт)
                // Любое сообщение с типом отличным от text или флагом is_system считаем системным
                const isSystem = (meta as Record<string, unknown>).is_system === true || (msg.message_type && msg.message_type !== 'text');

                // Свои сообщения обрабатываются мутацией, но СИСТЕМНЫЕ сообщения (даже от нашего имени) нужно отображать
                if (user && msg.sender_id === user.id && !isSystem) return;

                // GAP DETECTION: если seq_id прыгнул — догружаем пропущенные
                if (msg.server_seq_id && lastSeqIdRef.current > 0) {
                    if (msg.server_seq_id > lastSeqIdRef.current + 1) {
                        console.warn(`[ProjectChat] Gap detected: ${lastSeqIdRef.current} → ${msg.server_seq_id}`);
                        chatService.getCalculationMessagesDeltaBySeq(String(entity.id), lastSeqIdRef.current)
                            .then(res => {
                                if (res.success && res.data) {
                                    queryClient.setQueryData(queryKey, (current: Message[] = []) => {
                                        const existingIds = new Set(current.map(m => m.id));
                                        const newMsgs = res.data!.filter(m => !existingIds.has(m.id));
                                        return sortMessages([...current, ...newMsgs]);
                                    });
                                }
                            });
                    }
                }

                // Обновляем seq tracker
                if (msg.server_seq_id) {
                    lastSeqIdRef.current = Math.max(lastSeqIdRef.current, msg.server_seq_id);
                }

                queryClient.setQueryData(queryKey, (old: Message[] = []) => {
                    if (old.some(m => m.id === msg.id)) return old;
                    return sortMessages([...old, msg]);
                });
            }
            if (eventType === 'ACK') {
                const ack = payload as MessageAckPayload;
                queryClient.setQueryData(queryKey, (old: Message[] = []) => 
                    old.map(m => m.id === ack.messageId ? { ...m, status: 'sent' as const } : m)
                );
            }
            if (eventType === 'READ') {
                const read = payload as ReadEventPayload;
                // Update all messages from other user as read when they send a READ signal
                queryClient.setQueryData(queryKey, (old: Message[] = []) => 
                    old.map(m => (m.sender_id !== read.readerId && !m.is_read) ? { ...m, is_read: true } : m)
                );
            }
        }, String(entity.id));
        return () => sub();
    }, [entity.id, user, queryKey, queryClient, chatService]);

    return {
        messages,
        loadingMessages,
        sendMessage: (text: string, attachments: { file: File; preview: string }[]) => {
            const clientIds = attachments.length > 0 ? attachments.map(() => crypto.randomUUID()) : [crypto.randomUUID()];
            return sendMutation.mutateAsync({ text, attachments, clientIds });
        },
        sendVoice: async (blob: Blob, duration: number) => {
            if (!user) return;
            const clientId = crypto.randomUUID();
            
            // Optimistic update
            const optimisticMsg = {
                id: `temp-${clientId}`,
                sender_id: user.id,
                calculation_id: String(entity.id),
                content: '',
                voice_url: URL.createObjectURL(blob),
                voice_duration: duration,
                created_at: new Date().toISOString(),
                client_message_id: clientId,
                status: 'pending' as const,
            };
            
            queryClient.setQueryData(queryKey, (old: Message[] = []) => [...old, optimisticMsg]);

            try {
                const uploadRes = await chatService.uploadVoiceMessage(blob);
                const voiceUrl = uploadRes.data || null;
                
                const res = await chatService.sendMessage({
                    sender_id: user.id,
                    calculation_id: String(entity.id),
                    content: '',
                    voice_url: voiceUrl,
                    voice_duration: duration,
                    client_message_id: clientId,
                });

                if (res.success && res.data) {
                    queryClient.setQueryData(queryKey, (old: Message[] = []) => 
                        old.map(m => m.client_message_id === clientId ? res.data! : m)
                    );
                }
                return res;
            } catch (err) {
                queryClient.setQueryData(queryKey, (old: Message[] = []) => 
                    old.map(m => m.client_message_id === clientId ? { ...m, status: 'error' as const } : m)
                );
                throw err;
            }
        },
        markAsRead: async () => {
            if (!entity.id || !user) return;
            const res = await chatService.markProjectAsRead(String(entity.id), user.id);
            if (res.success) {
                queryClient.invalidateQueries({ queryKey: ['unread-counts', user.id] });
            }
        }
    };
}
