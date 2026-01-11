import React, { useRef, useState, useEffect } from 'react';
import {
    Trash2, MoreVertical, Loader2, MessageCircle,
    Paperclip, Smile, ArrowRight, X,
    Check, CheckCheck, Clock, AlertCircle
} from 'lucide-react';
import EmojiPicker, { type EmojiClickData } from 'emoji-picker-react';
import { ImagePreviewModal } from '@/components/ui/ImagePreviewModal';
import { logger } from '@/app/services';
import type { Message } from '@/features/chat/types';

interface ProjectChatSectionProps {
    messages: Message[];
    loadingMessages: boolean;
    user: { id: string; role?: string } | null;
    onSendMessage: (text: string, attachments: { file: File, preview: string }[]) => Promise<void>;
    onClearHistory: () => void;
    onResendMessage?: (msg: Message) => void;
}

export const ProjectChatSection: React.FC<ProjectChatSectionProps> = ({
    messages,
    loadingMessages,
    user,
    onSendMessage,
    onClearHistory,
    onResendMessage
}) => {
    const [newComment, setNewComment] = useState('');
    const [pendingAttachments, setPendingAttachments] = useState<{ file: File, preview: string }[]>([]);
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const [previewImage, setPreviewImage] = useState<string | null>(null);
    const [showMoreMenu, setShowMoreMenu] = useState(false);

    const fileInputRef = useRef<HTMLInputElement>(null);
    const moreMenuRef = useRef<HTMLDivElement>(null);
    const scrollRef = useRef<HTMLDivElement>(null);

    // Auto-scroll to bottom
    const scrollToBottom = () => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    // Cleanup URLs on unmount
    useEffect(() => {
        return () => {
            pendingAttachments.forEach(att => URL.revokeObjectURL(att.preview));
        };
    }, [pendingAttachments]);

    // Close menus on outside click
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (moreMenuRef.current && !moreMenuRef.current.contains(event.target as Node)) {
                setShowMoreMenu(false);
            }
        };
        if (showMoreMenu) document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [showMoreMenu]);

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        const newAttachments: { file: File, preview: string }[] = [];
        for (const file of files) {
            if (!file.type.startsWith('image/')) continue;
            newAttachments.push({ file, preview: URL.createObjectURL(file) });
        }
        setPendingAttachments(prev => [...prev, ...newAttachments]);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const handleEmojiClick = (emojiData: EmojiClickData) => {
        setNewComment(prev => prev + emojiData.emoji);
        setShowEmojiPicker(false);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newComment.trim() && pendingAttachments.length === 0) return;

        const attachmentsToKeep = [...pendingAttachments];
        const textToSend = newComment;

        // Reset UI immediately (Instant feel)
        setNewComment('');
        setPendingAttachments([]);

        // Trigger send in background
        onSendMessage(textToSend, attachmentsToKeep).catch(err => {
            logger.error('Failed to send project message', { err });
            // Optionally restore text if failed, but usually Chat Hook handles errors with 'error' status
        });

        // Revoke after a short delay to ensure they were used if needed 
        // (but ideally hook handles this or we revoke in cleanup)
        setTimeout(() => {
            attachmentsToKeep.forEach(att => URL.revokeObjectURL(att.preview));
        }, 3000);
    };

    return (
        <div className="glass-card flex flex-col h-[650px] !p-6">
            <div className="flex items-center justify-between mb-8 pb-4 border-b border-border-theme">
                <div className="flex items-center gap-3">
                    <h3 className="text-xs font-black uppercase tracking-[0.3em]">История изменений</h3>
                    <div className="relative" ref={moreMenuRef}>
                        <button
                            onClick={() => setShowMoreMenu(!showMoreMenu)}
                            className={`p-2 rounded-lg transition-all ${showMoreMenu ? 'bg-primary/10 text-primary' : 'text-foreground/20 hover:text-primary hover:bg-primary/5'}`}
                        >
                            <MoreVertical size={14} />
                        </button>

                        {showMoreMenu && (
                            <div className="absolute left-0 top-full mt-2 w-48 bg-card border border-border-theme rounded-2xl shadow-2xl z-50 overflow-hidden animate-in zoom-in-95 duration-200">
                                <button
                                    onClick={() => {
                                        setShowMoreMenu(false);
                                        onClearHistory();
                                    }}
                                    className="w-full flex items-center gap-3 px-5 py-4 text-[9px] font-black uppercase tracking-widest text-red-500 hover:bg-red-500/5 transition-colors"
                                >
                                    <Trash2 size={14} />
                                    Очистить обсуждение
                                </button>
                            </div>
                        )}
                    </div>
                </div>
                <span className="w-10 h-10 flex items-center justify-center bg-card border border-border-theme rounded-xl text-[11px] font-black">
                    {messages.length}
                </span>
            </div>

            <div ref={scrollRef} className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-6 mb-6">
                {loadingMessages ? (
                    <div className="h-full flex items-center justify-center"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
                ) : messages.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-foreground/10 uppercase tracking-widest text-[10px] gap-4">
                        <MessageCircle size={48} className="opacity-20" /> Диалог не начат
                    </div>
                ) : (
                    messages.map((msg) => (
                        <div key={msg.id} className={`flex flex-col ${msg.sender_id === user?.id ? 'items-end' : 'items-start'}`}>
                            <div className={`
                                max-w-[90%] rounded-[1.5rem] relative
                                ${msg.image_url && !msg.content ? 'p-1 bg-[#1a1a1a]' : 'p-4 sm:p-5'}
                                ${msg.sender_id === user?.id
                                    ? (msg.image_url && !msg.content ? 'shadow-xl' : 'bg-primary text-white rounded-tr-none shadow-xl shadow-primary/20')
                                    : (msg.image_url && !msg.content ? 'shadow-lg' : 'bg-card border border-border-theme rounded-tl-none')}
                            `}>
                                {msg.image_url && (
                                    <div className="rounded-xl overflow-hidden border border-white/10 relative bg-[#1a1a1a]">
                                        <img
                                            src={msg.image_url}
                                            alt="Attachment"
                                            className={`max-w-full h-auto object-cover transition-all duration-300 ${msg.id.startsWith('temp-') ? 'blur-[2px] opacity-70' : 'opacity-100'
                                                }`}
                                            onClick={() => setPreviewImage(msg.image_url!)}
                                            loading="lazy"
                                        />
                                        {msg.id.startsWith('temp-') && (
                                            <div className="absolute inset-0 flex items-center justify-center">
                                                <div className="relative">
                                                    <Loader2 className="w-9 h-9 text-white animate-spin drop-shadow-lg" />
                                                    <div className="absolute inset-0 w-9 h-9 border-[3px] border-white/50 rounded-full animate-pulse"></div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}
                                {msg.content && (
                                    <p className={`text-[13px] leading-relaxed ${msg.image_url ? 'mt-3' : ''}`}>
                                        {msg.content}
                                    </p>
                                )}
                                <div className="flex items-center gap-1.5 mt-2 justify-end">
                                    <span className="text-[8px] font-black uppercase tracking-widest opacity-40">
                                        {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                    {msg.sender_id === user?.id && (
                                        <div className="flex items-center">
                                            {msg.status === 'pending' ? (
                                                <Clock size={10} className="text-white/50 animate-pulse" />
                                            ) : msg.status === 'error' ? (
                                                <button 
                                                    onClick={() => onResendMessage?.(msg)}
                                                    className="p-0 bg-transparent border-none cursor-pointer hover:scale-110 transition-transform"
                                                >
                                                    <AlertCircle size={10} className="text-red-400" />
                                                </button>
                                            ) : msg.is_read ? (
                                                <CheckCheck size={11} className="text-white" />
                                            ) : (
                                                <Check size={11} className="text-white/70" />
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            <form
                onSubmit={handleSubmit}
                className="pt-6 border-t border-border-theme space-y-4"
            >
                {pendingAttachments.length > 0 && (
                    <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-none">
                        {pendingAttachments.map((att, i) => (
                            <div key={i} className="relative shrink-0">
                                <div className="w-20 h-20 rounded-xl overflow-hidden border-2 border-primary/20 shadow-lg">
                                    <img src={att.preview} className="w-full h-full object-cover" />
                                </div>
                                <button
                                    type="button"
                                    onClick={() => {
                                        URL.revokeObjectURL(att.preview);
                                        setPendingAttachments(prev => prev.filter((_, idx) => idx !== i));
                                    }}
                                    className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center shadow-md hover:scale-110 active:scale-90 transition-all border-none cursor-pointer"
                                >
                                    <X size={12} />
                                </button>
                            </div>
                        ))}
                    </div>
                )}
                <div className="flex gap-2">
                    <button type="button" onClick={() => fileInputRef.current?.click()} className="p-4 bg-card border border-border-theme rounded-2xl text-foreground/40 hover:text-primary transition-all">
                        <Paperclip size={20} />
                    </button>
                    <input type="file" ref={fileInputRef} className="hidden" accept="image/*" multiple onChange={handleFileSelect} />
                    <div className="flex-1 relative">
                        <input
                            type="text"
                            value={newComment}
                            onChange={(e) => setNewComment(e.target.value)}
                            className="input-premium !py-4 !pr-24"
                            placeholder="Напишите эксперту..."
                        />

                        {/* Emoji Picker Button */}
                        <button
                            type="button"
                            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                            className="absolute right-14 top-1/2 -translate-y-1/2 w-8 h-8 text-foreground/40 hover:text-primary transition-all rounded-full flex items-center justify-center"
                        >
                            <Smile size={18} />
                        </button>

                        {/* Emoji Picker Popup */}
                        {showEmojiPicker && (
                            <div className="absolute bottom-full right-0 mb-2 z-50">
                                <EmojiPicker onEmojiClick={handleEmojiClick} />
                            </div>
                        )}

                        <button type="submit" disabled={!newComment.trim() && pendingAttachments.length === 0} className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-primary text-white rounded-xl shadow-lg flex items-center justify-center hover:scale-105 active:scale-95 disabled:opacity-50 transition-all border-none cursor-pointer">
                            <ArrowRight size={20} />
                        </button>
                    </div>
                </div>
            </form>

            {previewImage && <ImagePreviewModal imageUrl={previewImage} onClose={() => setPreviewImage(null)} />}
        </div>
    );
};
