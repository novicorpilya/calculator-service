/**
 * MessageList Component - Production Optimized
 * Renders the scrollable list of messages with virtualization potential and bubble memoization.
 */

import React, { useRef, useEffect, useMemo, useCallback } from 'react';
import { MessageSquare, Check, CheckCheck, Clock } from 'lucide-react';
import type { Message } from '../types';
import { VoicePlayer } from '@/components/ui/VoicePlayer';
import { ChatImage } from './ChatImage';

interface MessageListProps {
    messages: Message[];
    currentUserId: string;
    isLoading: boolean;
    searchQuery: string;
    onContextMenu: (e: React.MouseEvent, message: Message) => void;
    onImageClick: (imageUrl: string) => void;
}

const MessageBubble = React.memo<{
    msg: Message;
    isOwn: boolean;
    replyTo?: Message;
    searchQuery: string;
    onContextMenu: (e: React.MouseEvent, message: Message) => void;
    onImageClick: (imageUrl: string) => void;
}>(({ msg, isOwn, replyTo, searchQuery, onContextMenu, onImageClick }) => {

    const highlightText = useCallback((text: string, query: string) => {
        if (!query) return text;
        const parts = text.split(new RegExp(`(${query})`, 'gi'));
        return parts.map((part, i) =>
            part.toLowerCase() === query.toLowerCase()
                ? <span key={i} className="bg-yellow-200 text-black px-1 rounded">{part}</span>
                : part
        );
    }, []);

    const formatTime = useCallback((dateString: string) => {
        return new Date(dateString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }, []);

    const isTemp = msg.id.startsWith('temp-');

    return (
        <div
            className={`flex ${isOwn ? 'justify-end' : 'justify-start'} animate-in slide-in-from-bottom-2 duration-300`}
        >
            <div
                onContextMenu={(e) => onContextMenu(e, msg)}
                className={`
                    max-w-[85%] lg:max-w-[70%] rounded-[1.5rem] relative group cursor-context-menu overflow-hidden
                    ${msg.image_url && !msg.content ? 'p-0 bg-transparent' : 'p-4 sm:p-5'}
                    ${isOwn
                        ? (msg.image_url && !msg.content ? 'shadow-xl' : 'bg-primary text-white rounded-tr-none shadow-xl shadow-primary/20')
                        : (msg.image_url && !msg.content ? 'shadow-lg' : 'bg-card border border-border-theme rounded-tl-none text-foreground')}
                `}
            >
                {/* Reply Context */}
                {replyTo && (
                    <div className="mb-2 pl-3 border-l-2 border-white/50 opacity-70 text-[11px] font-medium truncate">
                        <span className="font-bold">Ответ на сообщение</span>
                        <div className="truncate">{replyTo.content || 'Вложение'}</div>
                    </div>
                )}

                {/* Image */}
                {msg.image_url && (
                    <ChatImage
                        key={msg.image_url}
                        src={msg.image_url}
                        isTemp={isTemp}
                        altText={msg.content || 'Изображение в сообщении'}
                        onImageClick={() => msg.image_url && onImageClick(msg.image_url)}
                        footer={!msg.content ? (
                            <div className="flex items-center gap-1 justify-end">
                                {msg.is_edited && (
                                    <span className="text-[9px] text-white/70 leading-none">изм.</span>
                                )}
                                <span className="text-[10px] text-white/80 leading-none tabular-nums">
                                    {formatTime(msg.created_at)}
                                </span>
                                {isOwn && (
                                    <div className="flex items-center ml-0.5">
                                        {isTemp ? (
                                            <Clock size={10} className="text-white/70" />
                                        ) : msg.is_read ? (
                                            <CheckCheck size={14} className="text-white" />
                                        ) : (
                                            <Check size={14} className="text-white/80" />
                                        )}
                                    </div>
                                )}
                            </div>
                        ) : undefined}
                    />
                )}

                {/* Voice */}
                {msg.voice_url && (
                    <VoicePlayer
                        voiceUrl={msg.voice_url}
                        duration={msg.voice_duration || undefined}
                        className="min-w-[200px]"
                    />
                )}

                {/* Text Content */}
                {msg.content && (
                    <p className="text-[13px] font-medium leading-relaxed">
                        {highlightText(msg.content, searchQuery)}
                    </p>
                )}

                {/* Footer (only for text/voice messages) */}
                {(msg.content || msg.voice_url) && (
                    <div className="flex items-center gap-1 mt-1 justify-end select-none">
                        {msg.is_edited && (
                            <span className="text-[9px] opacity-40 leading-none">изм.</span>
                        )}
                        <span className="text-[10px] opacity-40 leading-none tabular-nums">
                            {formatTime(msg.created_at)}
                        </span>

                        {isOwn && (
                            <div className="flex items-center ml-0.5 text-primary-foreground/60">
                                {isTemp ? (
                                    <Clock size={10} className="opacity-70" />
                                ) : msg.is_read ? (
                                    <CheckCheck size={14} className="text-white" />
                                ) : (
                                    <Check size={14} className="text-white/80" />
                                )}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div >
    );
});

MessageBubble.displayName = 'MessageBubble';

export const MessageList: React.FC<MessageListProps> = React.memo(({
    messages,
    currentUserId,
    isLoading,
    searchQuery,
    onContextMenu,
    onImageClick,
}) => {
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const lastMessageCountRef = useRef(messages.length);

    // Optimized Scroll logic
    useEffect(() => {
        const hasNewMessages = messages.length > lastMessageCountRef.current;
        if (hasNewMessages) {
            messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        } else if (messages.length > 0 && lastMessageCountRef.current === 0) {
            // Initial load
            messagesEndRef.current?.scrollIntoView({ behavior: 'auto' });
        }
        lastMessageCountRef.current = messages.length;
    }, [messages.length]);

    const filteredMessages = useMemo(() => {
        if (!searchQuery) return messages;
        const lowerQuery = searchQuery.toLowerCase();
        return messages.filter(m => m.content?.toLowerCase().includes(lowerQuery));
    }, [messages, searchQuery]);

    const messageMap = useMemo(() => {
        return new Map(messages.map(m => [m.id, m]));
    }, [messages]);

    if (isLoading) {
        return (
            <div className="h-full flex items-center justify-center">
                <Clock className="w-8 h-8 animate-pulse text-primary/50" />
            </div>
        );
    }

    if (messages.length === 0) {
        return (
            <div className="h-full flex flex-col items-center justify-center text-foreground/10 space-y-4">
                <MessageSquare size={64} />
                <p className="text-[10px] font-black uppercase tracking-[0.4em]">Начните общение первым</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-4">
            {filteredMessages.map((msg) => (
                <MessageBubble
                    key={msg.client_id || msg.id}
                    msg={msg}
                    isOwn={msg.sender_id === currentUserId}
                    replyTo={msg.reply_to_id ? messageMap.get(msg.reply_to_id) : undefined}
                    searchQuery={searchQuery}
                    onContextMenu={onContextMenu}
                    onImageClick={onImageClick}
                />
            ))}
            <div ref={messagesEndRef} />
        </div>
    );
});

MessageList.displayName = 'MessageList';
