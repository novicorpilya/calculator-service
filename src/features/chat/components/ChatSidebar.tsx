import React, { useState, useMemo } from 'react';
import { Search, Loader2 } from 'lucide-react';
import { useRecipients } from '../hooks/useRecipients';
import type { ChatRecipient } from '../types';
import { MESSAGE_SNIPPETS } from '../types';

interface ChatSidebarProps {
    currentUserId: string;
    selectedUserId?: string;
    onSelectUser: (user: ChatRecipient) => void;
    isUserOnline?: (userId: string) => boolean;
    className?: string;
}

const ChatRecipientItem = React.memo<{
    recipient: ChatRecipient;
    selectedUserId?: string;
    currentUserId: string;
    unreadCount: number;
    isOnline?: boolean;
    onSelect: (user: ChatRecipient) => void;
}>(({ recipient, selectedUserId, currentUserId, unreadCount, isOnline, onSelect }) => {
    const isSelected = selectedUserId === recipient.id;

    const lastMessageTime = useMemo(() => {
        if (!recipient.lastMessage?.created_at) return null;
        try {
            return new Date(recipient.lastMessage.created_at).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
            });
        } catch {
            return null;
        }
    }, [recipient.lastMessage?.created_at]);

    const lastMessagePreview = useMemo(() => {
        if (!recipient.lastMessage) return null;
        const msg = recipient.lastMessage;
        const content = msg.content?.trim();

        // Emoji-only detection regex
        const isEmojiOnly =
            content &&
            /^(\u00a9|\u00ae|[\u2000-\u3300]|\ud83c[\ud000-\udfff]|\ud83d[\ud000-\udfff]|\ud83e[\ud000-\udfff])+\s*$/.test(
                content
            );

        if (isEmojiOnly) return MESSAGE_SNIPPETS.EMOJI;

        return (
            content ||
            (msg.image_url ? MESSAGE_SNIPPETS.PHOTO : msg.voice_url ? MESSAGE_SNIPPETS.VOICE : '')
        );
    }, [recipient.lastMessage]);

    return (
        <button
            onClick={() => onSelect(recipient)}
            className={`w-full flex items-center gap-4 p-4 rounded-2xl transition-all ${isSelected ? 'bg-primary text-white shadow-xl shadow-primary/20 scale-[1.02]' : 'hover:bg-primary/5 text-foreground group'}`}
        >
            <div className="relative shrink-0">
                <div
                    className={`w-14 h-14 rounded-xl flex items-center justify-center font-black text-sm overflow-hidden ${isSelected ? 'bg-white/20' : 'bg-primary/10 text-primary'}`}
                >
                    {recipient.avatar_url ? (
                        <img
                            src={recipient.avatar_url}
                            alt=""
                            className="w-full h-full object-cover"
                        />
                    ) : (
                        recipient.first_name?.[0] || recipient.organization_name?.[0] || '?'
                    )}
                </div>
                <div
                    className={`absolute -bottom-1 -right-1 w-4 h-4 ${isOnline ? 'bg-emerald-500' : 'bg-gray-400'} border-2 border-background rounded-full transition-colors`}
                />
            </div>

            <div className="flex-1 text-left min-w-0 flex flex-col justify-center">
                <div className="flex items-center justify-between gap-2 mb-1">
                    <p className="text-[13px] font-bold truncate">
                        {recipient.role === 'client'
                            ? recipient.organization_name
                            : `${recipient.first_name || ''} ${recipient.last_name || ''}`.trim() ||
                              recipient.organization_name}
                    </p>
                    {lastMessageTime && (
                        <span
                            className={`text-[9px] font-bold uppercase tracking-tight ${isSelected ? 'text-white/40' : 'text-foreground/20'}`}
                        >
                            {lastMessageTime}
                        </span>
                    )}
                </div>

                <div className="flex items-center justify-between gap-3">
                    <p
                        className={`text-[11px] truncate flex-1 transition-colors duration-300 ${
                            isSelected ? 'text-white/70' : 'text-foreground/40'
                        }`}
                    >
                        {recipient.lastMessage ? (
                            <span className="flex items-center gap-1">
                                {String(recipient.lastMessage.sender_id) ===
                                    String(currentUserId) && (
                                    <span className="opacity-50">Вы:</span>
                                )}
                                <span className="truncate">{lastMessagePreview}</span>
                            </span>
                        ) : (
                            <span className="opacity-40 italic lowercase tracking-wider">
                                Нет сообщений
                            </span>
                        )}
                    </p>

                    {unreadCount > 0 && (
                        <span
                            className={`flex items-center justify-center min-w-[20px] h-[20px] px-1.5 rounded-full text-[10px] font-black transition-all animate-in zoom-in ${isSelected ? 'bg-white text-primary' : 'bg-primary text-white shadow-lg shadow-primary/20'}`}
                        >
                            {unreadCount}
                        </span>
                    )}
                </div>
            </div>
        </button>
    );
});

ChatRecipientItem.displayName = 'ChatRecipientItem';

export const ChatSidebar = React.memo<ChatSidebarProps>(
    ({ currentUserId, selectedUserId, isUserOnline, onSelectUser, className }) => {
        const [searchQuery, setSearchQuery] = useState('');
        const { recipients, unreadCounts, isLoading } = useRecipients({ currentUserId });

        const filteredRecipients = useMemo(() => {
            if (!recipients) return [];
            const query = searchQuery.toLowerCase();
            return recipients.filter((r) => {
                const fullName = `${r.first_name || ''} ${r.last_name || ''}`.toLowerCase();
                return (
                    r.organization_name?.toLowerCase().includes(query) ||
                    fullName.includes(query) ||
                    r.role?.toLowerCase().includes(query)
                );
            });
        }, [recipients, searchQuery]);

        return (
            <div
                className={`flex flex-col border-r border-border-theme bg-background h-full ${className || ''}`}
            >
                <div className="p-6 lg:p-8 border-b border-border-theme">
                    <h2 className="text-2xl font-black uppercase tracking-tight mb-6">Диалоги</h2>
                    <div className="relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground/20" />
                        <input
                            type="text"
                            placeholder="Поиск собеседника..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-card border border-border-theme rounded-2xl pl-12 pr-4 py-3 text-[11px] font-black uppercase tracking-widest outline-none focus:border-primary transition-all"
                        />
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-2">
                    {isLoading ? (
                        <div className="flex justify-center py-10">
                            <Loader2 className="w-6 h-6 animate-spin text-primary" />
                        </div>
                    ) : filteredRecipients.length === 0 ? (
                        <p className="text-center py-10 text-[10px] font-black uppercase tracking-widest text-foreground/20">
                            Контакты не найдены
                        </p>
                    ) : (
                        filteredRecipients.map((recipient) => (
                            <ChatRecipientItem
                                key={recipient.id}
                                recipient={recipient}
                                selectedUserId={selectedUserId}
                                currentUserId={currentUserId}
                                unreadCount={unreadCounts[recipient.id] || 0}
                                isOnline={isUserOnline?.(recipient.id)}
                                onSelect={onSelectUser}
                            />
                        ))
                    )}
                </div>
            </div>
        );
    }
);
