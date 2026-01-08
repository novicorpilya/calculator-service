import { useState, useEffect, useRef, useCallback } from 'react';
import { toast } from 'sonner';
import { useServices } from '@/core/di/ServiceContainer';
import type { Message, ChatRecipient } from '@/features/chat/types';

interface UseChatOptions {
    currentUser: { id: string } | null;
    selectedUser: ChatRecipient | null;
}

export const useChat = ({ currentUser, selectedUser }: UseChatOptions) => {
    const [messages, setMessages] = useState<Message[]>([]);
    const [recipients, setRecipients] = useState<ChatRecipient[]>([]);
    const [unreadCounts, setUnreadCounts] = useState<{ [key: string]: number }>({});
    const [isLoadingMessages, setIsLoadingMessages] = useState(false);
    const [isLoadingRecipients, setIsLoadingRecipients] = useState(false);

    const { chatService } = useServices();

    const isFetchingRecipients = useRef(false);
    const isFetchingMessages = useRef(false);

    const updateRecipientLastMessage = useCallback((msg: Message) => {
        setRecipients(prev => {
            const targetId = msg.sender_id === (currentUser?.id) ? msg.receiver_id : msg.sender_id;

            let contentSnippet = msg.content || '';
            if (msg.image_url) contentSnippet = '📷 Фотография';
            if (msg.voice_url) contentSnippet = '🎤 Голосовое сообщение';

            return prev.map(r => r.id === targetId ? {
                ...r,
                lastMessage: {
                    content: contentSnippet,
                    created_at: msg.created_at,
                    sender_id: msg.sender_id
                }
            } : r).sort((a, b) => {
                const dateA = a.lastMessage?.created_at || '0';
                const dateB = b.lastMessage?.created_at || '0';
                return dateB.localeCompare(dateA);
            });
        });
    }, [currentUser]);

    const fetchRecipients = useCallback(async () => {
        if (!currentUser || isFetchingRecipients.current) return;
        try {
            isFetchingRecipients.current = true;
            if (recipients.length === 0) setIsLoadingRecipients(true);

            const [data, counts] = await Promise.all([
                chatService.getRecipients(currentUser.id),
                chatService.getUnreadCounts(currentUser.id)
            ]);

            setRecipients(data);
            setUnreadCounts(counts);
        } catch (error) {
            console.error(error);
            toast.error('Ошибка загрузки контактов');
        } finally {
            setIsLoadingRecipients(false);
            isFetchingRecipients.current = false;
        }
    }, [currentUser, chatService, recipients.length]);

    const loadMessages = useCallback(async () => {
        if (!selectedUser || !currentUser || isFetchingMessages.current) return;
        try {
            isFetchingMessages.current = true;
            setIsLoadingMessages(true);
            const data = await chatService.getMessages(currentUser.id, selectedUser.id);
            setMessages(data);
        } catch (error) {
            console.error(error);
            toast.error('Ошибка загрузки сообщений');
        } finally {
            setIsLoadingMessages(false);
            isFetchingMessages.current = false;
        }
    }, [selectedUser, currentUser, chatService]);

    // Initial load of recipients
    useEffect(() => {
        if (currentUser) {
            fetchRecipients();
        }
    }, [currentUser, fetchRecipients]);

    // Message subscription and auto-read
    useEffect(() => {
        if (selectedUser && currentUser) {
            loadMessages();

            // Mark as read immediately
            chatService.markAsRead(selectedUser.id, currentUser.id).catch(console.error);
            setUnreadCounts(prev => {
                const next = { ...prev };
                delete next[selectedUser.id];
                return next;
            });

            const unsubscribe = chatService.subscribeToMessages(async (msg, eventType) => {
                // Update last message in list for ALL incoming messages to ensure real-time preview
                if (eventType === 'INSERT' || !eventType) {
                    updateRecipientLastMessage(msg);
                }

                const isCurrentChat = selectedUser && (
                    msg.sender_id === selectedUser.id ||
                    (msg.sender_id === currentUser.id && msg.receiver_id === selectedUser.id)
                );

                if (isCurrentChat) {
                    // Incoming message from selected user
                    if (msg.sender_id === selectedUser.id && (eventType === 'INSERT' || !eventType)) {
                        chatService.markAsRead(msg.sender_id, currentUser.id).catch(console.error);
                    }

                    // Preload image if exists
                    if (msg.image_url && (eventType === 'INSERT' || eventType === 'UPDATE' || !eventType)) {
                        const img = new Image();
                        img.src = msg.image_url;
                    }

                    setMessages(prev => {
                        if (eventType === 'DELETE') {
                            return prev.filter(m => m.id !== msg.id);
                        }
                        if (eventType === 'UPDATE') {
                            return prev.map(m => m.id === msg.id ? msg : m);
                        }

                        // Handle optimistic updates (deduplication)
                        if (msg.sender_id === currentUser.id) {
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
                        if (prev.some(m => m.id === msg.id)) return prev;
                        return [...prev, msg];
                    });
                } else if (msg.receiver_id === currentUser.id && (eventType === 'INSERT' || !eventType)) {
                    // Message from someone else - update notification
                    setUnreadCounts(prev => ({
                        ...prev,
                        [msg.sender_id]: (prev[msg.sender_id] || 0) + 1
                    }));
                }
            });

            return () => unsubscribe();
        }
    }, [selectedUser, currentUser, chatService, updateRecipientLastMessage, loadMessages]);



    const sendMessage = async (text: string, attachments: { file: File, preview: string }[]) => {
        if (!selectedUser || !currentUser) return;

        const timestamp = new Date().toISOString();
        const optimisticMsgs: Message[] = [];

        // Optimistic UI Update
        if (attachments.length > 0) {
            attachments.forEach((att, i) => {
                optimisticMsgs.push({
                    id: `temp-${Date.now()}-${i}`,
                    sender_id: currentUser.id,
                    receiver_id: selectedUser.id,
                    content: i === 0 ? text : '',
                    image_url: att.preview,
                    created_at: timestamp,
                } as Message);
            });
        } else if (text) {
            optimisticMsgs.push({
                id: `temp-${Date.now()}`,
                sender_id: currentUser.id,
                receiver_id: selectedUser.id,
                content: text,
                created_at: timestamp,
            } as Message);
        }

        setMessages(prev => [...prev, ...optimisticMsgs]);
        updateRecipientLastMessage(optimisticMsgs[optimisticMsgs.length - 1]);

        try {
            if (attachments.length > 0) {
                for (let i = 0; i < attachments.length; i++) {
                    const att = attachments[i];
                    const imageUrl = await chatService.uploadAttachment(att.file);
                    await chatService.sendMessage({
                        sender_id: currentUser.id,
                        receiver_id: selectedUser.id,
                        content: optimisticMsgs[i].content || '',
                        image_url: imageUrl,
                    });
                }
            } else {
                await chatService.sendMessage({
                    sender_id: currentUser.id,
                    receiver_id: selectedUser.id,
                    content: text,
                });
            }
        } catch (error) {
            console.error(error);
            toast.error('Не удалось отправить сообщение');
            // Rollback optimistic update
            setMessages(prev => prev.filter(m => !optimisticMsgs.some(om => om.id === m.id)));
        }
    };

    const sendVoiceMessage = async (audioBlob: Blob, duration: number) => {
        if (!selectedUser || !currentUser) return;

        const timestamp = new Date().toISOString();
        const tempVoiceUrl = URL.createObjectURL(audioBlob);

        const optimisticMsg: Message = {
            id: `temp-${Date.now()}`,
            sender_id: currentUser.id,
            receiver_id: selectedUser.id,
            content: '',
            voice_url: tempVoiceUrl,
            voice_duration: duration,
            created_at: timestamp
        } as Message;

        setMessages(prev => [...prev, optimisticMsg]);
        updateRecipientLastMessage(optimisticMsg);

        try {
            const voiceUrl = await chatService.uploadVoiceMessage(audioBlob);
            await chatService.sendMessage({
                sender_id: currentUser.id,
                receiver_id: selectedUser.id,
                content: '',
                voice_url: voiceUrl,
                voice_duration: duration
            });
        } catch (error) {
            console.error(error);
            toast.error('Не удалось отправить голосовое сообщение');
            setMessages(prev => prev.filter(m => m.id !== optimisticMsg.id));
        }
    };

    const clearHistory = async () => {
        if (!selectedUser || !currentUser) return;
        try {
            await chatService.clearHistory(currentUser.id, selectedUser.id);
            setMessages([]);
            toast.success('История чата очищена');
        } catch (error) {
            console.error(error);
            toast.error('Не удалось очистить историю');
        }
    };



    return {
        messages,
        recipients,
        unreadCounts,
        isLoadingMessages,
        isLoadingRecipients,
        sendMessage,
        sendVoiceMessage,
        clearHistory
    };
};
