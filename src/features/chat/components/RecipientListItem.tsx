/**
 * RecipientListItem Component
 * Renders a single contact in the recipients sidebar.
 */

import React from 'react';
import type { ChatRecipient } from '../types';

interface RecipientListItemProps {
    recipient: ChatRecipient;
    isSelected: boolean;
    isOnline: boolean;
    unreadCount: number;
    onClick: () => void;
}

export const RecipientListItem: React.FC<RecipientListItemProps> = React.memo(
    ({ recipient, isSelected, isOnline, unreadCount, onClick }) => {
        const displayName = recipient.first_name
            ? `${recipient.first_name} ${recipient.last_name || ''}`.trim()
            : recipient.organization_name || 'Unknown';

        const roleLabel = recipient.role === 'manager' ? 'Менеджер' : 'Клиент';

        const formatTime = (dateString?: string) => {
            if (!dateString) return '';
            const date = new Date(dateString);
            const now = new Date();
            const isToday = date.toDateString() === now.toDateString();

            if (isToday) {
                return date.toLocaleTimeString('ru-RU', {
                    hour: '2-digit',
                    minute: '2-digit',
                });
            }

            return date.toLocaleDateString('ru-RU', {
                day: 'numeric',
                month: 'short',
            });
        };

        return (
            <button
                onClick={onClick}
                className={`w-full p-4 flex items-center gap-3 transition-all hover:bg-primary/5 ${
                    isSelected ? 'bg-primary/10 border-r-2 border-primary' : ''
                }`}
            >
                {/* Avatar with Online Status */}
                <div className="relative shrink-0">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center text-primary font-bold text-lg overflow-hidden">
                        {recipient.avatar_url ? (
                            <img
                                src={recipient.avatar_url}
                                alt=""
                                className="w-full h-full object-cover"
                            />
                        ) : (
                            (displayName || '?').charAt(0).toUpperCase()
                        )}
                    </div>
                    <div
                        className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-background ${
                            isOnline ? 'bg-emerald-500' : 'bg-gray-400'
                        }`}
                    />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0 text-left">
                    <div className="flex items-center justify-between gap-2">
                        <span className="font-semibold text-sm truncate">{displayName}</span>
                        {recipient.lastMessage && (
                            <span className="text-[10px] text-foreground/40 shrink-0">
                                {formatTime(recipient.lastMessage.created_at || undefined)}
                            </span>
                        )}
                    </div>
                    <div className="flex items-center justify-between gap-2 mt-0.5">
                        <div className="flex items-center gap-1.5 min-w-0">
                            <span className="text-[10px] font-bold uppercase tracking-widest text-primary/60">
                                {roleLabel}
                            </span>
                            {recipient.lastMessage && (
                                <>
                                    <span className="text-foreground/20">•</span>
                                    <span className="text-xs text-foreground/50 truncate">
                                        {recipient.lastMessage.content}
                                    </span>
                                </>
                            )}
                        </div>
                        {unreadCount > 0 && (
                            <span className="shrink-0 min-w-[20px] h-5 px-1.5 bg-primary text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                                {unreadCount > 99 ? '99+' : unreadCount}
                            </span>
                        )}
                    </div>
                </div>
            </button>
        );
    }
);

RecipientListItem.displayName = 'RecipientListItem';
