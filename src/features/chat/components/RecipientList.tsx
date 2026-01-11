/**
 * RecipientList Component
 * Sidebar with contacts, search, and unread indicators.
 */

import React from 'react';
import { Search, Loader2 } from 'lucide-react';
import type { ChatRecipient } from '../types';

interface RecipientListProps {
    recipients: ChatRecipient[];
    selectedUserId: string | null;
    currentUserId: string;
    unreadCounts: Record<string, number>;
    searchQuery: string;
    isLoading: boolean;
    isFetched?: boolean;
    isUserOnline: (userId: string) => boolean;
    onSearchChange: (query: string) => void;
    onSelectRecipient: (recipient: ChatRecipient) => void;
}

export const RecipientList: React.FC<RecipientListProps> = React.memo(({
    recipients,
    selectedUserId,
    currentUserId,
    unreadCounts,
    searchQuery,
    isLoading,
    isFetched,
    isUserOnline,
    onSearchChange,
    onSelectRecipient,
}) => {
    const filteredRecipients = recipients.filter(r => {
        const query = searchQuery.toLowerCase();
        return (
            r.organization_name?.toLowerCase().includes(query) ||
            r.first_name?.toLowerCase().includes(query) ||
            r.last_name?.toLowerCase().includes(query)
        );
    });

    const getDisplayName = (recipient: ChatRecipient) => {
        if (recipient.role === 'client') {
            return recipient.organization_name;
        }
        const fullName = `${recipient.first_name || ''} ${recipient.last_name || ''}`.trim();
        return fullName || recipient.organization_name;
    };

    const getAvatar = (recipient: ChatRecipient) => {
        return recipient.first_name?.[0] || recipient.organization_name?.[0] || '?';
    };

    const formatTime = (dateString?: string | null) => {
        if (!dateString) return '';
        return new Date(dateString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    const showLoader = isLoading || (!isFetched && filteredRecipients.length === 0);

    return (
        <>
            {/* Header */}
            <div className="p-6 lg:p-8 border-b border-border-theme">
                <h2 className="text-2xl font-black uppercase tracking-tight mb-6">Диалоги</h2>
                <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground/20" />
                    <input
                        type="text"
                        placeholder="Поиск собеседника..."
                        value={searchQuery}
                        onChange={(e) => onSearchChange(e.target.value)}
                        className="w-full bg-card border border-border-theme rounded-2xl pl-12 pr-4 py-3 text-[11px] font-black uppercase tracking-widest outline-none focus:border-primary transition-all"
                    />
                </div>
            </div>

            {/* Recipients List */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-2">
                {showLoader ? (
                    <div className="flex justify-center py-10">
                        <Loader2 className="w-6 h-6 animate-spin text-primary" />
                    </div>
                ) : filteredRecipients.length === 0 ? (
                    <p className="text-center py-10 text-[10px] font-black uppercase tracking-widest text-foreground/20">
                        Контакты не найдены
                    </p>
                ) : (
                    filteredRecipients.map((recipient) => {
                        const isSelected = selectedUserId === recipient.id;
                        const unread = unreadCounts[recipient.id] || 0;
                        const online = isUserOnline(recipient.id);

                        return (
                            <button
                                key={recipient.id}
                                onClick={() => onSelectRecipient(recipient)}
                                className={`w-full flex items-center gap-4 p-4 rounded-2xl transition-all ${isSelected
                                    ? 'bg-primary text-white shadow-xl shadow-primary/20 scale-[1.02]'
                                    : 'hover:bg-primary/5 text-foreground group'
                                    }`}
                            >
                                {/* Avatar */}
                                <div className="relative shrink-0">
                                    <div
                                        className={`w-14 h-14 rounded-xl flex items-center justify-center font-black text-sm ${isSelected ? 'bg-white/20' : 'bg-primary/10 text-primary'
                                            }`}
                                    >
                                        {getAvatar(recipient)}
                                    </div>
                                    <div
                                        className={`absolute -bottom-1 -right-1 w-4 h-4 ${online ? 'bg-emerald-500' : 'bg-gray-400'
                                            } border-2 border-background rounded-full`}
                                    />
                                </div>

                                {/* Content */}
                                <div className="flex-1 text-left min-w-0 flex flex-col justify-center">
                                    <div className="flex items-center justify-between gap-2 mb-1">
                                        <p className="text-[13px] font-bold truncate">
                                            {getDisplayName(recipient)}
                                        </p>
                                        {recipient.lastMessage && (
                                            <span
                                                className={`text-[9px] font-bold uppercase tracking-tight ${isSelected ? 'text-white/40' : 'text-foreground/20'
                                                    }`}
                                            >
                                                {formatTime(recipient.lastMessage.created_at)}
                                            </span>
                                        )}
                                    </div>

                                    <div className="flex items-center justify-between gap-3">
                                        <p
                                            className={`text-[11px] truncate flex-1 ${isSelected ? 'text-white/70' : 'text-foreground/40'
                                                }`}
                                        >
                                            {!recipient.lastMessage ? (
                                                <span className="opacity-40 italic">Нет сообщений</span>
                                            ) : (() => {
                                                const lm = recipient.lastMessage;
                                                const isMine = lm?.sender_id === currentUserId;
                                                const content = lm?.content?.trim() || '';

                                                // Defensive Check: If we have a lastMessage object but all relevant fields are empty
                                                if (!content && !lm?.image_url && !lm?.voice_url) {
                                                    return <span className="opacity-40 italic">Сообщение...</span>;
                                                }

                                                // Emoji-only detection regex
                                                const isEmojiOnly = content && /^(\u00a9|\u00ae|[\u2000-\u3300]|\ud83c[\ud000-\udfff]|\ud83d[\ud000-\udfff]|\ud83e[\ud000-\udfff])+\s*$/.test(content);

                                                return (
                                                    <span className="flex items-center gap-1">
                                                        {isMine && <span className="opacity-50">Вы:</span>}
                                                        <span className="truncate">
                                                            {isEmojiOnly ? '😊 Смайлик' : (content || (lm?.image_url ? '📷 Изображение' : lm?.voice_url ? '🎤 Голосовое сообщение' : ''))}
                                                        </span>
                                                    </span>
                                                );
                                            })()}
                                        </p>

                                        {unread > 0 && (
                                            <span
                                                className={`flex items-center justify-center min-w-[20px] h-[20px] px-1.5 rounded-full text-[10px] font-black transition-all animate-in zoom-in ${isSelected
                                                    ? 'bg-white text-primary'
                                                    : 'bg-primary text-white shadow-lg shadow-primary/20'
                                                    }`}
                                            >
                                                {unread}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </button>
                        );
                    })
                )}
            </div>
        </>
    );
});

RecipientList.displayName = 'RecipientList';
