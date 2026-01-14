import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { ChatSidebar } from '@/features/chat/components/ChatSidebar';
import { ChatWindow } from '@/features/chat/components/ChatWindow';
import { useRecipients } from '@/features/chat/hooks/useRecipients';
import { useMessages } from '@/features/chat/hooks/useMessages';
import { useServices } from '@/core/di/ServiceContainer';
import type { ChatRecipient, Message, HistoryClearedPayload } from '@/features/chat/types';

/**
 * GlobalChatHub - Refactored Controller Component
 * Connects the ChatSidebar and ChatWindow with data/logic hooks.
 */
export const GlobalChatHub = React.memo(() => {
    const { chatService } = useServices();
    const { user } = useAuth();
    const [selectedUser, setSelectedUser] = useState<ChatRecipient | null>(null);

    // 1. Sidebar Data & Actions
    const { updateRecipientLastMessage, incrementUnread, clearUnread, clearRecipientLastMessage } =
        useRecipients({ currentUserId: user?.id || '' });

    // 2. Active Chat Data & Actions
    const {
        messages,
        isLoading: isLoadingMessages,
        sendMessage,
        sendImageMessage,
        sendVoiceMessage,
        clearHistory,
        handleIncomingMessage,
        handleHistoryCleared,
    } = useMessages({
        currentUserId: user?.id || '',
        selectedUserId: selectedUser?.id || '',
    });

    // 3. Mark as read when selecting user
    useEffect(() => {
        if (selectedUser?.id && user?.id) {
            clearUnread(selectedUser.id);
        }
    }, [selectedUser?.id, user?.id, clearUnread]);

    // 4. Stable Handlers Ref (to avoid subscription cycles)
    const handlersRef = useRef({
        handleIncomingMessage,
        updateRecipientLastMessage,
        incrementUnread,
        clearUnread,
        handleHistoryCleared,
        clearRecipientLastMessage,
        selectedUserId: selectedUser?.id,
    });

    useEffect(() => {
        handlersRef.current = {
            handleIncomingMessage,
            updateRecipientLastMessage,
            incrementUnread,
            clearUnread,
            handleHistoryCleared,
            clearRecipientLastMessage,
            selectedUserId: selectedUser?.id,
        };
    }, [
        handleIncomingMessage,
        updateRecipientLastMessage,
        incrementUnread,
        clearUnread,
        handleHistoryCleared,
        clearRecipientLastMessage,
        selectedUser?.id,
    ]);

    // 5. Automatic Read Marker on window focus
    useEffect(() => {
        const handleFocus = () => {
            if (document.visibilityState === 'visible' && selectedUser?.id && user?.id) {
                clearUnread(selectedUser.id);
            }
        };
        window.addEventListener('focus', handleFocus);
        window.addEventListener('visibilitychange', handleFocus);
        return () => {
            window.removeEventListener('focus', handleFocus);
            window.removeEventListener('visibilitychange', handleFocus);
        };
    }, [selectedUser?.id, user?.id, clearUnread]);

    // 6. Global Realtime Subscription
    useEffect(() => {
        if (!user?.id) return;

        const unsubscribe = chatService.subscribeToMessages(
            (payload, evt) => {
                const currentSelectedId = handlersRef.current.selectedUserId;

                // 1. Message Events (INSERT/UPDATE/DELETE)
                if (evt === 'INSERT' || evt === 'UPDATE' || evt === 'DELETE') {
                    const msg = payload as Message;
                    if (msg.calculation_id) return;

                    // Pass to active chat handler (Stream Processing)
                    handlersRef.current.handleIncomingMessage(msg, evt);

                    // Side-effects for Recipient List
                    if (evt === 'INSERT' && msg.sender_id && msg.receiver_id) {
                        const contactId =
                            msg.sender_id === user.id ? msg.receiver_id : msg.sender_id;
                        handlersRef.current.updateRecipientLastMessage(msg, contactId);

                        // Increment unread if message from others and not in active chat
                        if (
                            msg.sender_id !== user.id &&
                            (!currentSelectedId || msg.sender_id !== currentSelectedId)
                        ) {
                            handlersRef.current.incrementUnread(msg.sender_id);
                        }

                        // Auto-read if window is active and chat is open
                        if (
                            currentSelectedId &&
                            msg.sender_id === currentSelectedId &&
                            document.visibilityState === 'visible'
                        ) {
                            handlersRef.current.clearUnread(currentSelectedId);
                        }
                    } else if (evt === 'UPDATE' && msg.sender_id && msg.receiver_id) {
                        // Update recipient list if the updated message was the last one
                        const contactId =
                            msg.sender_id === user.id ? msg.receiver_id : msg.sender_id;
                        handlersRef.current.updateRecipientLastMessage(msg, contactId);
                    }
                }

                // 2. Read Events
                if (evt === 'READ') {
                    handlersRef.current.handleIncomingMessage(payload, evt);
                    // No need to invalidate unreadCounts, handleIncomingMessage/clearUnread handles it
                }

                // 3. History Cleared
                if (evt === 'DELETE' && !(payload as Message).id) {
                    const historyPayload = payload as HistoryClearedPayload;
                    handlersRef.current.handleHistoryCleared(
                        historyPayload.sender_id,
                        historyPayload.receiver_id
                    );
                    const contactId =
                        historyPayload.receiver_id === user.id
                            ? historyPayload.sender_id
                            : historyPayload.receiver_id;
                    handlersRef.current.clearRecipientLastMessage?.(contactId);
                }
            },
            undefined,
            user.id
        );

        return () => unsubscribe();
    }, [user?.id, chatService]);

    const handleClearHistory = React.useCallback(async () => {
        await clearHistory(undefined);
    }, [clearHistory]);
    const handleBack = React.useCallback(() => setSelectedUser(null), []);

    if (!user) return null;

    return (
        <div className="h-[calc(100dvh-64px)] lg:h-[calc(100vh-64px)] flex bg-background overflow-hidden animate-in fade-in duration-700">
            {/* Sidebar - Hidden on mobile if user selected */}
            <div
                className={`${selectedUser ? 'hidden md:flex' : 'flex'} w-full md:w-80 lg:w-96 flex-col border-r border-border-theme bg-background h-full`}
            >
                <ChatSidebar
                    currentUserId={user.id}
                    selectedUserId={selectedUser?.id}
                    onSelectUser={setSelectedUser}
                />
            </div>

            {/* Chat Window - Hidden on mobile if no user selected */}
            <div
                className={`${selectedUser ? 'flex' : 'hidden md:flex'} flex-1 flex-col bg-background h-full min-w-0`}
            >
                <ChatWindow
                    currentUser={user}
                    selectedUser={selectedUser}
                    messages={messages}
                    isLoading={isLoadingMessages}
                    onSendMessage={sendMessage}
                    onSendImage={sendImageMessage}
                    onSendVoice={sendVoiceMessage}
                    onClearHistory={handleClearHistory}
                    onBack={handleBack}
                />
            </div>
        </div>
    );
});
