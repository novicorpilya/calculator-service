import { useState, useCallback, useEffect } from 'react';
import { chatService } from '@/app/services';
import type { Message } from '@/features/chat/types';
import { toast } from 'sonner';
import { CalculationEntity } from '@/core/domain/CalculationEntity';
import { logger } from '@/core/utils/logger';

export function useProjectChat(entity: CalculationEntity, user: { id: string; role?: string } | null) {
    const [messages, setMessages] = useState<Message[]>([]);
    const [loadingMessages, setLoadingMessages] = useState(false);

    const loadMessages = useCallback(async () => {
        if (!entity.id) return;
        try {
            setLoadingMessages(true);
            const data = await chatService.getCalculationMessages(String(entity.id));
            setMessages(data);
        } catch (error) {
            logger.error('Failed to load project messages', error, { calculationId: entity.id });
            toast.error('Ошибка загрузки истории правок');
        } finally {
            setLoadingMessages(false);
        }
    }, [entity.id]);

    useEffect(() => {
        if (!entity.id || !user) return;

        loadMessages();

        // Mark as read logic
        const markAsRead = async () => {
            const managerId = entity.managerId;
            const userId = entity.userId;

            if (managerId) {
                try {
                    await chatService.markAsRead(managerId, user.id, String(entity.id));
                } catch (error) {
                    logger.error('Failed to mark messages read (manager)', error, { managerId, calculationId: entity.id });
                }
            }
            if (userId && user.id !== userId) {
                try {
                    await chatService.markAsRead(userId, user.id, String(entity.id));
                } catch (error) {
                    logger.error('Failed to mark messages read (client)', error, { targetUserId: userId, calculationId: entity.id });
                }
            }
        };
        markAsRead();

        // Subscribe to realtime events for this calculation
        const unsubscribe = chatService.subscribeToMessages(async (msg, eventType) => {
            // Handle based on event type
            switch (eventType) {
                case 'INSERT': {
                    // Mark as read if message is for current user
                    if (msg.calculation_id === String(entity.id) && msg.receiver_id === user?.id) {
                        chatService.markAsRead(msg.sender_id, user!.id, String(entity.id))
                            .catch(err => logger.warn('Failed to auto-mark read on insert', { error: err, msgId: msg.id }));
                    }

                    // Preload image if attachment
                    if (msg.image_url) {
                        await new Promise<void>((resolve) => {
                            const img = new Image();
                            img.onload = () => resolve();
                            img.onerror = () => resolve();
                            img.src = msg.image_url!;
                        });
                    }

                    setMessages(prev => {
                        // Optimistic update handler - replace temp message with real one
                        if (msg.sender_id === user?.id) {
                            const tempIdx = prev.findIndex(m =>
                                m.id.startsWith('temp-') &&
                                (m.content === msg.content || (m.image_url && msg.image_url))
                            );
                            if (tempIdx !== -1 && !prev.some(m => m.id === msg.id)) {
                                const next = [...prev];
                                next[tempIdx] = msg;
                                return next;
                            }
                        }
                        // Deduplication
                        if (prev.some(m => m.id === msg.id)) return prev;
                        return [...prev, msg];
                    });
                    break;
                }

                case 'UPDATE': {
                    setMessages(prev =>
                        prev.map(m => m.id === msg.id ? { ...m, ...msg } : m)
                    );
                    break;
                }

                case 'DELETE': {
                    setMessages(prev => prev.filter(m => m.id !== msg.id));
                    break;
                }

                default:
                    logger.warn('Unknown realtime event type', { eventType, msgId: msg.id });
            }
        }, String(entity.id));

        return () => unsubscribe();
    }, [entity.id, entity.managerId, entity.userId, user, loadMessages]);

    const clearHistory = async () => {
        if (!entity.id) return;
        const confirmed = window.confirm('Вы уверены, что хотите полностью очистить историю обсуждения этого проекта? Все сообщения и вложения будут удалены безвозвратно.');
        if (!confirmed) return;

        try {
            setLoadingMessages(true);
            await chatService.clearProjectHistory(String(entity.id));
            setMessages([]);
            toast.success('История обсуждения очищена');
        } catch (error) {
            logger.error('Failed to clear project history', error, { calculationId: entity.id });
            toast.error('Не удалось очистить историю');
        } finally {
            setLoadingMessages(false);
        }
    }

    const sendMessage = async (text: string, attachments: { file: File, preview: string }[]) => {
        if (!user || (!text.trim() && attachments.length === 0)) return;
        const receiverId = user.role === 'manager' ? entity.userId : entity.managerId;
        if (!receiverId) {
            toast.error('Собеседник не определен');
            return;
        }

        const timestamp = new Date().toISOString();
        const optimisticMsgs: Message[] = [];

        attachments.forEach((att, i) => {
            optimisticMsgs.push({
                id: `temp-${Date.now()}-${i}`,
                sender_id: user.id as any, // Type cast for temp msg
                receiver_id: receiverId as any,
                calculation_id: String(entity.id),
                content: i === 0 ? text : '',
                image_url: att.preview,
                created_at: timestamp
            } as Message);
        });

        if (attachments.length === 0) {
            optimisticMsgs.push({
                id: `temp-${Date.now()}`,
                sender_id: user.id as any,
                receiver_id: receiverId as any,
                calculation_id: String(entity.id),
                content: text,
                created_at: timestamp
            } as Message);
        }

        setMessages(prev => [...prev, ...optimisticMsgs]);

        try {
            for (let i = 0; i < attachments.length; i++) {
                const att = attachments[i];
                const url = await chatService.uploadAttachment(att.file);
                await chatService.sendMessage({
                    sender_id: user.id,
                    receiver_id: receiverId,
                    calculation_id: String(entity.id),
                    content: i === 0 ? text : '',
                    image_url: url
                });
            }
            if (attachments.length === 0) {
                await chatService.sendMessage({
                    sender_id: user.id,
                    receiver_id: receiverId,
                    calculation_id: String(entity.id),
                    content: text
                });
            }
        } catch (error) {
            logger.error('Failed to send project message', error, {
                calculationId: entity.id,
                senderId: user.id,
                attachmentCount: attachments.length
            });
            toast.error('Ошибка отправки');
            setMessages(prev => prev.filter(m => !optimisticMsgs.find(o => o.id === m.id)));
            throw error;
        }
    };

    return {
        messages,
        loadingMessages,
        loadMessages,
        setMessages,
        clearHistory,
        sendMessage
    };
}
