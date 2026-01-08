import React, { useState, useEffect } from 'react';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { ChatSidebar } from '@/features/chat/components/ChatSidebar';
import { ChatWindow } from '@/features/chat/components/ChatWindow';
import { useRecipients } from '@/features/chat/hooks/useRecipients';
import { useMessages } from '@/features/chat/hooks/useMessages';
import { useChatSubscription } from '@/features/chat/hooks/useChatSubscription';
import type { ChatRecipient } from '@/features/chat/types';

/**
 * GlobalChatHub - Refactored Controller Component
 * Connects the ChatSidebar and ChatWindow with data/logic hooks.
 */
export const GlobalChatHub = React.memo(() => {
    const { user } = useAuth();
    const [selectedUser, setSelectedUser] = useState<ChatRecipient | null>(null);

    // 1. Sidebar Data & Actions
    const {
        updateRecipientLastMessage,
        incrementUnread,
        clearUnread,
        clearRecipientLastMessage
    } = useRecipients({ currentUserId: user?.id || '' });

    // 2. Active Chat Data & Actions
    const {
        messages,
        isLoading: isLoadingMessages,
        sendMessage,
        sendImageMessage,
        sendVoiceMessage,
        clearHistory,
        handleIncomingMessage,
        handleHistoryCleared
    } = useMessages({
        currentUserId: user?.id || '',
        selectedUserId: selectedUser?.id || ''
    });

    // 3. Mark as read when selecting user
    useEffect(() => {
        if (selectedUser?.id && user?.id) {
            clearUnread(selectedUser.id);
        }
    }, [selectedUser?.id, user?.id, clearUnread]);

    // 4. Global Realtime Subscription
    useChatSubscription({
        currentUserId: user?.id || '',
        selectedUserId: selectedUser?.id || null,
        onIncomingMessage: (msg, evt) => {
            handleIncomingMessage(msg, evt);

            // If new message in active chat, mark as read immediately
            if (evt === 'INSERT' && selectedUser && msg.sender_id === selectedUser.id) {
                clearUnread(selectedUser.id);
            }
        },
        onRecipientUpdate: updateRecipientLastMessage,
        onUnreadIncrement: incrementUnread,
        onHistoryCleared: (userId, contactId) => {
            handleHistoryCleared(userId, contactId);
            if (clearRecipientLastMessage) clearRecipientLastMessage(contactId === user?.id ? userId : contactId);
        }
    });

    if (!user) return null;

    return (
        <div className="h-[calc(100dvh-64px)] lg:h-[calc(100vh-64px)] flex bg-background overflow-hidden animate-in fade-in duration-700">
            {/* Sidebar - Hidden on mobile if user selected */}
            <div className={`${selectedUser ? 'hidden md:flex' : 'flex'} w-full md:w-80 lg:w-96 flex-col border-r border-border-theme bg-background h-full`}>
                <ChatSidebar
                    currentUserId={user.id}
                    selectedUserId={selectedUser?.id}
                    onSelectUser={setSelectedUser}
                />
            </div>

            {/* Chat Window - Hidden on mobile if no user selected */}
            <div className={`${selectedUser ? 'flex' : 'hidden md:flex'} flex-1 flex-col bg-background h-full min-w-0`}>
                <ChatWindow
                    currentUser={user}
                    selectedUser={selectedUser}
                    messages={messages}
                    isLoading={isLoadingMessages}
                    onSendMessage={sendMessage}
                    onSendImage={sendImageMessage}
                    onSendVoice={sendVoiceMessage}
                    onClearHistory={() => clearHistory(undefined)}
                    onBack={() => setSelectedUser(null)}
                />
            </div>
        </div>
    );
});
