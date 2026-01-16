import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useServices } from '@/core/di/ServiceContainer';
import type { Message, MessageEventType, ChatEventPayload, ReadEventPayload, MessageAckPayload } from '../types';
import { sortMessages } from '../utils/chatUtils';
import { chatStorage } from '../services/ChatStorage';

export function useChatSync(currentUserId: string, selectedUserId: string, queryKey: string[]) {
    const { chatService } = useServices();
    const queryClient = useQueryClient();
    const lastSeqIdRef = useRef<number>(0);

    // Initial persistence load
    useEffect(() => {
        if (!currentUserId || !selectedUserId) return;
        chatStorage.getCachedMessages(currentUserId, selectedUserId).then(cached => {
            if (cached && cached.length > 0) {
                queryClient.setQueryData(queryKey, (current: Message[] = []) => {
                    const existingIds = new Set(current.map(m => m.id));
                    const newFromCache = cached.filter(m => !existingIds.has(m.id));
                    return sortMessages([...current, ...newFromCache]);
                });
            }
        });
    }, [currentUserId, selectedUserId, queryClient, queryKey]);

    // Outbox processing
    useEffect(() => {
        const handleOnline = () => chatService.processOutbox();
        window.addEventListener('online', handleOnline);
        if (navigator.onLine) chatService.processOutbox();
        return () => window.removeEventListener('online', handleOnline);
    }, [chatService]);

    // Real-time subscription
    useEffect(() => {
        if (!currentUserId || !selectedUserId) return;

        const unsubscribe = chatService.subscribeToMessages(
            (payload: ChatEventPayload, eventType: MessageEventType) => {
                // Handle INSERT (new message)
                if (eventType === 'INSERT') {
                    const newMessage = payload as Message;
                    queryClient.setQueryData<Message[]>(queryKey, (old = []) => {
                        if (old.some(m => m.id === newMessage.id)) return old;
                        const updated = sortMessages([...old, newMessage]);
                        lastSeqIdRef.current = Math.max(lastSeqIdRef.current, newMessage.server_seq_id || 0);
                        return updated;
                    });
                } 
                // Handle DELETE
                else if (eventType === 'DELETE') {
                    const msg = payload as Message;
                    queryClient.setQueryData<Message[]>(queryKey, (old = []) => old.filter(m => m.id !== msg.id));
                } 
                // Handle UPDATE (edit)
                else if (eventType === 'UPDATE') {
                    const msg = payload as Message;
                    queryClient.setQueryData<Message[]>(queryKey, (old = []) => 
                        old.map(m => m.id === msg.id ? msg : m)
                    );
                } 
                // Handle READ
                else if (eventType === 'READ') {
                    const p = payload as ReadEventPayload;
                    if (p.readerId !== currentUserId) {
                        queryClient.setQueryData<Message[]>(queryKey, (old = []) => 
                            old.map(m => m.sender_id === currentUserId ? { ...m, is_read: true } : m)
                        );
                    }
                } 
                // Handle ACK
                else if (eventType === 'ACK') {
                    const p = payload as MessageAckPayload;
                    queryClient.setQueryData<Message[]>(queryKey, (old = []) => 
                        old.map(m => m.id === p.clientId ? { ...m, id: p.messageId, is_optimistic: false } : m)
                    );
                }
            },
            undefined, // calculationId - not needed for direct messages
            currentUserId // userId for filtering
        );

        return () => {
            unsubscribe();
        };
    }, [currentUserId, selectedUserId, chatService, queryClient, queryKey]);
}
