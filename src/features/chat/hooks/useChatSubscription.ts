import { useEffect, useRef } from 'react';
import { supabase } from '@/services/supabase';
import type { RealtimePostgresChangesPayload } from '@supabase/supabase-js';
import { type Message } from '../types';

interface UseChatSubscriptionOptions {
    currentUserId: string;
    selectedUserId: string | null;
    onIncomingMessage: (msg: Message, event: 'INSERT' | 'UPDATE' | 'DELETE') => void;
    onRecipientUpdate: (message: Message, contactId: string) => void;
    onUnreadIncrement: (senderId: string) => void;
    onHistoryCleared: (userId: string, contactId: string) => void;
}

/**
 * useChatSubscription - Production Hardened
 * 
 * Uses 'Ref Pattern' to maintain a single stable subscription.
 * Does NOT resubscribe when callbacks or selectedUserId change.
 */
export function useChatSubscription({
    currentUserId,
    selectedUserId,
    onIncomingMessage,
    onRecipientUpdate,
    onUnreadIncrement,
    onHistoryCleared,
}: UseChatSubscriptionOptions) {
    // Maintain stable references to prevent effect re-runs
    const callbacksRef = useRef({
        onIncomingMessage,
        onRecipientUpdate,
        onUnreadIncrement,
        onHistoryCleared,
        selectedUserId
    });

    // Update refs on every render without triggering effect
    useEffect(() => {
        callbacksRef.current = {
            onIncomingMessage,
            onRecipientUpdate,
            onUnreadIncrement,
            onHistoryCleared,
            selectedUserId
        };
    });

    useEffect(() => {
        if (!currentUserId || currentUserId === 'undefined') return;



        const personalChannel = `user_updates_${currentUserId}`;
        const channel = supabase
            .channel(personalChannel)
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'messages' },
                (payload: RealtimePostgresChangesPayload<Message>) => {
                    const event = payload.eventType as 'INSERT' | 'UPDATE' | 'DELETE';
                    const msg = (event === 'DELETE' ? payload.old : payload.new) as Message;

                    // CRITICAL: Ignore project messages in direct chat subscription
                    if (msg.calculation_id) return;

                    const { selectedUserId: currentSelected, onIncomingMessage: handleMsg, onRecipientUpdate: handleRecipient, onUnreadIncrement: handleUnread } = callbacksRef.current;

                    const isForCurrentChat =
                        currentSelected &&
                        ((msg.sender_id === currentSelected && msg.receiver_id === currentUserId) ||
                            (msg.sender_id === currentUserId && msg.receiver_id === currentSelected));

                    // 1. Update message list if relevant
                    if (isForCurrentChat || event === 'DELETE') {
                        handleMsg(msg, event);
                    }

                    // 2. Update recipient list on new messages
                    // Ensure sender_id and receiver_id check to satisfy TS (string | null vs string)
                    if (event === 'INSERT' && msg.sender_id && msg.receiver_id) {
                        const contactId = msg.sender_id === currentUserId ? msg.receiver_id! : msg.sender_id!;
                        handleRecipient(msg, contactId);

                        // 3. Handle unread count
                        if (msg.sender_id !== currentUserId && (!currentSelected || msg.sender_id !== currentSelected)) {
                            handleUnread(msg.sender_id!);
                        }
                    }
                }
            )
            .on('broadcast', { event: 'history_cleared' }, ({ payload }) => {
                const { sender_id, receiver_id } = payload;
                callbacksRef.current.onHistoryCleared(sender_id, receiver_id);
            })
            .on('broadcast', { event: 'messages_read' }, ({ payload }) => {
                const { receiverId, calculationId } = payload;
                // If it's a global chat (no calculationId), notify the active message list
                if (!calculationId) {
                    callbacksRef.current.onIncomingMessage({ receiver_id: receiverId } as any, 'READ' as any);
                }
            })
            .subscribe((status) => {
                if (status === 'SUBSCRIBED') {

                }
                if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
                    // Fail silently in production or handle via a dedicated logger
                }
            });

        return () => {

            supabase.removeChannel(channel);
        };
    }, [currentUserId]); // ONLY depend on currentUserId
}
