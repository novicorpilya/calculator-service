/**
 * ChatHeader Component
 * Header with user info, search, and action menu.
 */

import React, { useRef, useState, useEffect } from 'react';
import { Search, Phone, MoreVertical, ArrowLeft, X, Trash2 } from 'lucide-react';
import type { ChatRecipient } from '../types';

interface ChatHeaderProps {
    selectedUser: ChatRecipient;
    isOnline: boolean;
    isMessageSearchOpen: boolean;
    messageSearchQuery: string;
    onBack: () => void;
    onToggleSearch: (open: boolean) => void;
    onSearchQueryChange: (query: string) => void;
    onClearHistory: () => void;
}

export const ChatHeader: React.FC<ChatHeaderProps> = React.memo(
    ({
        selectedUser,
        isOnline,
        isMessageSearchOpen,
        messageSearchQuery,
        onBack,
        onToggleSearch,
        onSearchQueryChange,
        onClearHistory,
    }) => {
        const [showMoreMenu, setShowMoreMenu] = useState(false);
        const moreMenuRef = useRef<HTMLDivElement>(null);
        const searchInputRef = useRef<HTMLInputElement>(null);

        // Focus search input when opened
        useEffect(() => {
            if (isMessageSearchOpen && searchInputRef.current) {
                searchInputRef.current.focus();
            }
        }, [isMessageSearchOpen]);

        // Close menu on outside click
        useEffect(() => {
            const handleClickOutside = (e: MouseEvent) => {
                if (moreMenuRef.current && !moreMenuRef.current.contains(e.target as Node)) {
                    setShowMoreMenu(false);
                }
            };
            document.addEventListener('mousedown', handleClickOutside);
            return () => document.removeEventListener('mousedown', handleClickOutside);
        }, []);

        const getDisplayName = () => {
            if (selectedUser.role === 'client') {
                return selectedUser.organization_name;
            }
            const fullName =
                `${selectedUser.first_name || ''} ${selectedUser.last_name || ''}`.trim();
            return fullName || selectedUser.organization_name;
        };

        const getAvatar = () => {
            return selectedUser.first_name?.[0] || selectedUser.organization_name?.[0] || '?';
        };

        return (
            <div className="p-6 border-b border-border-theme bg-background flex items-center justify-between min-h-[5.5rem]">
                {isMessageSearchOpen ? (
                    <div className="flex-1 flex items-center gap-4 animate-in fade-in slide-in-from-top-2 duration-300">
                        <div className="flex-1 relative">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground/40" />
                            <input
                                ref={searchInputRef}
                                type="text"
                                placeholder="Поиск по сообщениям..."
                                value={messageSearchQuery}
                                onChange={(e) => onSearchQueryChange(e.target.value)}
                                className="w-full bg-card border border-border-theme rounded-2xl pl-12 pr-4 py-3 text-[13px] font-medium outline-none focus:border-primary transition-all"
                            />
                        </div>
                        <button
                            onClick={() => {
                                onToggleSearch(false);
                                onSearchQueryChange('');
                            }}
                            className="p-3 hover:bg-primary/5 rounded-xl transition-all text-foreground/40 hover:text-red-500"
                        >
                            <X size={20} />
                        </button>
                    </div>
                ) : (
                    <div className="flex items-center gap-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                        <button
                            onClick={onBack}
                            className="md:hidden p-2 hover:bg-primary/5 rounded-xl transition-colors"
                        >
                            <ArrowLeft size={20} />
                        </button>
                        <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-black uppercase overflow-hidden">
                            {selectedUser.avatar_url ? (
                                <img
                                    src={selectedUser.avatar_url}
                                    alt=""
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                getAvatar()
                            )}
                        </div>
                        <div>
                            <h3 className="text-[14px] font-black tracking-tight">
                                {getDisplayName()}
                            </h3>
                            <div className="flex items-center gap-2">
                                <div
                                    className={`w-2 h-2 rounded-full ${
                                        isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-gray-400'
                                    }`}
                                />
                                <span className="text-[9px] font-bold text-foreground/40 uppercase tracking-widest">
                                    {isOnline ? 'В сети' : 'Не в сети'}
                                </span>
                            </div>
                        </div>
                    </div>
                )}

                {/* Actions */}
                <div className="flex items-center gap-2">
                    <button className="p-3 hover:bg-primary/5 rounded-xl transition-all text-foreground/40 hover:text-primary">
                        <Phone size={20} />
                    </button>
                    <button
                        onClick={() => onToggleSearch(true)}
                        className={`p-3 hover:bg-primary/5 rounded-xl transition-all ${
                            isMessageSearchOpen
                                ? 'bg-primary/10 text-primary'
                                : 'text-foreground/40 hover:text-primary'
                        }`}
                    >
                        <Search size={20} />
                    </button>
                    <div className="relative" ref={moreMenuRef}>
                        <button
                            onClick={() => setShowMoreMenu(!showMoreMenu)}
                            className={`p-3 rounded-xl transition-all ${
                                showMoreMenu
                                    ? 'bg-primary/10 text-primary'
                                    : 'hover:bg-primary/5 text-foreground/40 hover:text-primary'
                            }`}
                        >
                            <MoreVertical size={20} />
                        </button>

                        {showMoreMenu && (
                            <div className="absolute right-0 top-full mt-2 w-48 bg-card border border-border-theme rounded-2xl shadow-2xl z-[110] overflow-hidden animate-in zoom-in-95 duration-200">
                                <button
                                    onClick={() => {
                                        setShowMoreMenu(false);
                                        onClearHistory();
                                    }}
                                    className="w-full flex items-center gap-3 px-5 py-4 text-[10px] font-black uppercase tracking-widest text-red-500 hover:bg-red-500/5 transition-colors"
                                >
                                    <Trash2 size={16} />
                                    Очистить историю
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        );
    }
);

ChatHeader.displayName = 'ChatHeader';
