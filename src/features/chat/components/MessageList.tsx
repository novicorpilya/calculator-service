/**
 * MessageList Component - Production Optimized
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
    onMessageRead?: (messageId: string) => void;
}

interface MessageBubbleProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'onContextMenu'> {
    msg: Message;
    isOwn: boolean;
    replyTo?: Message;
    searchQuery: string;
    onContextMenu: (e: React.MouseEvent, message: Message) => void;
    onImageClick: (imageUrl: string) => void;
    innerRef?: React.Ref<HTMLDivElement>;
}

const MessageBubble = React.memo<MessageBubbleProps>(({ msg, isOwn, replyTo, searchQuery, onContextMenu, onImageClick, innerRef, ...rest }) => {
    const highlightText = useCallback((text: string, query: string) => {
        if (!query) return text;
        const parts = text.split(new RegExp(`(${query})`, 'gi'));
        return parts.map((part, i) =>
            part.toLowerCase() === query.toLowerCase() ? (
                <span key={i} className="bg-yellow-200 text-black px-1 rounded">
                    {part}
                </span>
            ) : (
                part
            )
        );
    }, []);

    const formatTime = useCallback((dateString: string) => {
        return new Date(dateString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }, []);

    const isTemp = msg.id.startsWith('temp-');
    
    // Restore logic: Hide message until image is fully loaded to prevent empty blocks/loaders
    const mustLoad = msg.image_url && !msg.image_url.startsWith('blob:') && !isTemp;
    const [imageLoaded, setImageLoaded] = React.useState(!mustLoad);

    // DEBUG LOGS removed by request
    
    if (mustLoad && !imageLoaded) {
        // Return invisible container so flex gap handles it correctly (no gap)
        return (
            <div style={{ display: 'none' }}>
                 <ChatImage 
                    src={msg.image_url!} 
                    onReady={() => setImageLoaded(true)} 
                 />
            </div>
        );
    }
    
    return (
        <div 
            ref={innerRef}
            {...rest}
            className={`flex ${isOwn ? 'justify-end' : 'justify-start'} animate-in slide-in-from-bottom-2 duration-300`}
        >
            <div
                onContextMenu={(e) => onContextMenu(e, msg)}
                className={`
                    max-w-[85%] lg:max-w-[70%] rounded-[1.5rem] relative group cursor-context-menu overflow-hidden
                    ${msg.image_url && !msg.content ? 'p-0 bg-transparent' : 'p-4 sm:p-5'}
                    ${
                        isOwn
                            ? msg.image_url && !msg.content
                                ? 'shadow-xl'
                                : 'bg-primary text-white rounded-tr-none shadow-xl shadow-primary/20'
                            : msg.image_url && !msg.content
                              ? 'shadow-lg'
                              : 'bg-card border border-border-theme rounded-tl-none text-foreground'
                    }
                `}
            >
                {replyTo && (
                    <div className="mb-2 pl-3 border-l-2 border-white/50 opacity-70 text-[11px] font-medium truncate">
                        <span className="font-bold">Ответ на сообщение</span>
                        <div className="truncate">{replyTo.content || 'Вложение'}</div>
                    </div>
                )}

                {msg.image_url && (
                    <ChatImage
                        src={msg.image_url}
                        altText={msg.content || 'Изображение в сообщении'}
                        onImageClick={() => msg.image_url && onImageClick(msg.image_url)}

                        isTemp={isTemp}
                        footer={
                            !msg.content ? (
                                <div className="flex items-center gap-1 justify-end">
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
                            ) : undefined
                        }
                    />
                )}

                {msg.voice_url && (
                    <VoicePlayer
                        voiceUrl={msg.voice_url}
                        duration={msg.voice_duration || undefined}
                        className="min-w-[200px]"
                        showLoading={isTemp}
                        isOwn={isOwn}
                        isRead={msg.is_read}
                        isTemp={isTemp}
                    />
                )}

                {msg.content && (
                    <div className="text-[13px] font-medium leading-relaxed whitespace-pre-wrap">
                        {highlightText(msg.content, searchQuery)}
                    </div>
                )}

                {(msg.content || msg.voice_url) && (
                    <div className="flex items-center gap-1 mt-1 justify-end select-none">
                        <span className="text-[10px] opacity-40 leading-none tabular-nums">
                            {msg.is_edited && <span className="mr-1">изм.</span>}
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
        </div>
    );
});

export const MessageList: React.FC<MessageListProps> = React.memo(
    ({
        messages,
        currentUserId,
        isLoading,
        searchQuery,
        onContextMenu,
        onImageClick,
        onMessageRead,
    }) => {
        const messagesEndRef = useRef<HTMLDivElement>(null);
        const lastMessageCountRef = useRef(messages.length);
        const observerRef = useRef<IntersectionObserver | null>(null);
        
        // Batch read events with debounce
        const pendingReadsRef = useRef<Set<string>>(new Set());
        const flushTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

        const flushPendingReads = useCallback(() => {
            if (pendingReadsRef.current.size > 0 && onMessageRead) {
                // Call onMessageRead once with the first ID (backend marks all as read)
                const firstId = pendingReadsRef.current.values().next().value;
                if (firstId) onMessageRead(firstId);
                pendingReadsRef.current.clear();
            }
        }, [onMessageRead]);

        const setRef = useCallback(
            (node: HTMLDivElement | null) => {
                if (!node || !onMessageRead) return;
                if (!observerRef.current) {
                    observerRef.current = new IntersectionObserver(
                        (entries) => {
                            entries.forEach((entry) => {
                                if (entry.isIntersecting) {
                                    const id = entry.target.getAttribute('data-message-id');
                                    const isRead = entry.target.getAttribute('data-is-read') === 'true';
                                    const senderId = entry.target.getAttribute('data-sender-id');
                                    if (id && !isRead && senderId !== currentUserId) {
                                        pendingReadsRef.current.add(id);
                                        observerRef.current?.unobserve(entry.target);
                                        
                                        // Debounce: flush after 500ms of no new reads
                                        if (flushTimeoutRef.current) clearTimeout(flushTimeoutRef.current);
                                        flushTimeoutRef.current = setTimeout(flushPendingReads, 500);
                                    }
                                }
                            });
                        },
                        { threshold: 0.5 }
                    );
                }
                observerRef.current.observe(node);
            },
            [onMessageRead, currentUserId, flushPendingReads]
        );

        useEffect(() => {
            return () => observerRef.current?.disconnect();
        }, []);

        useEffect(() => {
            const hasNewMessages = messages.length > lastMessageCountRef.current;
            if (hasNewMessages) {
                messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
            } else if (messages.length > 0 && lastMessageCountRef.current === 0) {
                messagesEndRef.current?.scrollIntoView({ behavior: 'auto' });
            }
            lastMessageCountRef.current = messages.length;
        }, [messages.length]);

        const filteredMessages = useMemo(() => {
            if (!searchQuery) return messages;
            const lowerQuery = searchQuery.toLowerCase();
            return messages.filter((m) => m.content?.toLowerCase().includes(lowerQuery));
        }, [messages, searchQuery]);

        const messageMap = useMemo(() => {
            return new Map(messages.map((m) => [m.id, m]));
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
                        key={msg.client_message_id || msg.id}
                        innerRef={msg.is_read || msg.sender_id === currentUserId ? undefined : setRef}
                        data-message-id={msg.id}
                        data-is-read={msg.is_read}
                        data-sender-id={msg.sender_id}
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
    }
);

MessageList.displayName = 'MessageList';
