import React, { useRef, useState, useEffect } from 'react';
import {
    Loader2,
    MessageCircle,
    Paperclip,
    Smile,
    ArrowRight,
    Check,
    CheckCheck,
    Clock,
    AlertCircle,
    Trash2,
    Mic,
} from 'lucide-react';
import EmojiPicker, { type EmojiClickData } from 'emoji-picker-react';
import { VoiceRecorder } from '@/components/ui/VoiceRecorder';
import { ImagePreviewModal } from '@/components/ui/ImagePreviewModal';
import { logger } from '@/core/logging';
import type { Message } from '@/features/chat/types';
import { ChatImage } from '@/features/chat/components/ChatImage';

const ProjectMessageItem = React.memo<{
    msg: Message;
    userId?: string;
    onResend?: (msg: Message) => void;
    onImageClick: (url: string) => void;
}>(({ msg, userId, onResend, onImageClick }) => {
    const isOwn = msg.sender_id === userId;

    const timeStr = React.useMemo(() => {
        try {
            return new Date(msg.created_at).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
            });
        } catch {
            return '';
        }
    }, [msg.created_at]);

    return (
        <div className={`flex flex-col ${isOwn ? 'items-end' : 'items-start'}`}>
            <div
                className={`
                max-w-[90%] rounded-[1.5rem] relative overflow-hidden
                ${msg.image_url && !msg.content ? 'p-1 bg-[#1a1a1a]' : 'p-4 sm:p-5'}
                ${
                    isOwn
                        ? msg.image_url && !msg.content
                            ? 'shadow-xl'
                            : 'bg-primary text-white rounded-tr-none shadow-xl shadow-primary/20'
                        : msg.image_url && !msg.content
                          ? 'shadow-lg'
                          : 'bg-card border border-border-theme rounded-tl-none'
                }
            `}
            >
                {msg.image_url && (
                    <ChatImage
                        key={msg.client_message_id || msg.id}
                        src={msg.image_url}
                        isTemp={msg.id.startsWith('temp-') || msg.status === 'pending'}
                        onImageClick={() => onImageClick(msg.image_url!)}
                        onRetry={() => onResend?.(msg)}
                    />
                )}
                {msg.content && (
                    <p className={`text-[13px] leading-relaxed ${msg.image_url ? 'mt-3' : ''}`}>
                        {msg.content}
                    </p>
                )}

                {/* Action Card Renderers */}
                {msg.message_type === 'roadmap_card' && (
                    <div
                        className={`mt-4 p-4 rounded-2xl border space-y-4 shadow-sm ${
                            isOwn ? 'bg-white/10 border-white/20' : 'bg-primary/5 border-primary/10'
                        }`}
                    >
                        <div className="flex items-center gap-3">
                            <div
                                className={`p-2 rounded-lg ${
                                    isOwn ? 'bg-white/20 text-white' : 'bg-primary/20 text-primary'
                                }`}
                            >
                                <Clock size={14} />
                            </div>
                            <span
                                className={`text-[10px] font-black uppercase tracking-widest ${
                                    isOwn ? 'text-white/80' : 'text-primary/80'
                                }`}
                            >
                                Статус реализации
                            </span>
                        </div>
                        <div className="flex gap-1">
                            {[1, 2, 3, 4].map((step) => (
                                <div
                                    key={step}
                                    className={`h-1.5 flex-1 rounded-full ${
                                        step === 1
                                            ? isOwn
                                                ? 'bg-white'
                                                : 'bg-primary'
                                            : isOwn
                                              ? 'bg-white/10'
                                              : 'bg-primary/10'
                                    }`}
                                />
                            ))}
                        </div>
                        <div
                            className={`text-[11px] font-medium italic ${
                                isOwn ? 'text-white/70' : 'text-foreground/70'
                            }`}
                        >
                            Команда закупки начала работу над вашим заказом
                        </div>
                    </div>
                )}

                {msg.message_type === 'welcome_card' && (
                    <div
                        className={`mt-4 p-4 rounded-2xl border space-y-3 shadow-sm ${
                            isOwn
                                ? 'bg-white/10 border-white/20'
                                : 'bg-indigo-500/10 border-indigo-500/20'
                        }`}
                    >
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl overflow-hidden border border-white/20">
                                <div className="w-full h-full bg-indigo-500 flex items-center justify-center text-white font-bold text-xs uppercase shadow-inner">
                                    EXP
                                </div>
                            </div>
                            <div className="flex-1">
                                <div
                                    className={`text-[10px] font-black uppercase tracking-widest ${
                                        isOwn
                                            ? 'text-white/80'
                                            : 'text-indigo-600 dark:text-indigo-400'
                                    }`}
                                >
                                    Персональный эксперт
                                </div>
                                <div
                                    className={`text-[12px] font-bold ${
                                        isOwn ? 'text-white' : 'text-foreground/90'
                                    }`}
                                >
                                    Линия аудита открыта
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                <div className="flex items-center gap-1.5 mt-2 justify-end">
                    <span className="text-[8px] font-black uppercase tracking-widest opacity-40">
                        {timeStr}
                    </span>
                    {isOwn && (
                        <div className="flex items-center">
                            {msg.status === 'pending' ? (
                                <Clock size={10} className="text-white/50 animate-pulse" />
                            ) : msg.status === 'error' ? (
                                <button
                                    onClick={() => onResend?.(msg)}
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
    );
});

ProjectMessageItem.displayName = 'ProjectMessageItem';

interface ProjectChatSectionProps {
    messages: Message[];
    loadingMessages: boolean;
    user: { id: string; role?: string } | null;
    onSendMessage: (
        text: string,
        attachments: { file: File; preview: string }[]
    ) => Promise<unknown>;
    onSendVoice: (blob: Blob, duration: number) => Promise<unknown>;
    onResendMessage?: (msg: Message) => void;
    isTyping?: boolean;
}

export const ProjectChatSection = React.memo<ProjectChatSectionProps>(
    ({
        messages,
        loadingMessages,
        user,
        onSendMessage,
        onSendVoice,
        onResendMessage,
        isTyping,
    }) => {
        const [newComment, setNewComment] = useState('');
        const [pendingAttachments, setPendingAttachments] = useState<
            { file: File; preview: string }[]
        >([]);
        const [showEmojiPicker, setShowEmojiPicker] = useState(false);
        const [isRecordingVoice, setIsRecordingVoice] = useState(false);
        const [previewImage, setPreviewImage] = useState<string | null>(null);

        const fileInputRef = useRef<HTMLInputElement>(null);
        const scrollRef = useRef<HTMLDivElement>(null);

        // Auto-scroll to bottom
        const scrollToBottom = React.useCallback(() => {
            if (scrollRef.current) {
                scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
            }
        }, []);

        useEffect(() => {
            scrollToBottom();
        }, [messages, scrollToBottom]);

        const handleFileSelect = React.useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
            const files = Array.from(e.target.files || []);
            const newAttachments: { file: File; preview: string }[] = [];
            for (const file of files) {
                if (!file.type.startsWith('image/')) continue;
                newAttachments.push({ file, preview: URL.createObjectURL(file) });
            }
            setPendingAttachments((prev) => [...prev, ...newAttachments]);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }, []);

        const handleEmojiClick = React.useCallback((emojiData: EmojiClickData) => {
            setNewComment((prev) => prev + emojiData.emoji);
            setShowEmojiPicker(false);
        }, []);

        const handleSubmit = React.useCallback(
            (e: React.FormEvent) => {
                e.preventDefault();
                if (!newComment.trim() && pendingAttachments.length === 0) return;

                const attachmentsToKeep = [...pendingAttachments];
                const textToSend = newComment;

                // Reset UI immediately (Instant feel)
                setNewComment('');
                setPendingAttachments([]);

                // Trigger send in background
                onSendMessage(textToSend, attachmentsToKeep).catch((err) => {
                    logger.error('Failed to send project message', { err });
                });
            },
            [newComment, pendingAttachments, onSendMessage]
        );

        const handleVoiceComplete = React.useCallback(
            async (audioBlob: Blob, duration: number) => {
                setIsRecordingVoice(false);
                try {
                    await onSendVoice(audioBlob, duration);
                } catch (err) {
                    logger.error('Failed to send project voice message', { err });
                }
            },
            [onSendVoice]
        );

        const handleCancelVoice = React.useCallback(() => setIsRecordingVoice(false), []);
        const handleStartVoice = React.useCallback(() => setIsRecordingVoice(true), []);
        const handleImagePreviewClose = React.useCallback(() => setPreviewImage(null), []);
        const handleEmojiToggle = React.useCallback(() => setShowEmojiPicker((prev) => !prev), []);

        const handleRemoveAttachment = React.useCallback((idx: number, preview: string) => {
            URL.revokeObjectURL(preview);
            setPendingAttachments((prev) => prev.filter((_, i) => i !== idx));
        }, []);

        return (
            <div className="glass-card flex flex-col h-[650px] !p-6">
                <div className="flex items-center justify-between mb-8 pb-4 border-b border-border-theme">
                    <div className="flex items-center gap-3">
                        <h3 className="text-xs font-black uppercase tracking-[0.3em]">
                            История изменений
                        </h3>
                    </div>
                    <span className="w-10 h-10 flex items-center justify-center bg-card border border-border-theme rounded-xl text-[11px] font-black">
                        {messages.length}
                    </span>
                </div>

                <div
                    ref={scrollRef}
                    className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-6 mb-6"
                >
                    {loadingMessages ? (
                        <div className="h-full flex items-center justify-center">
                            <Loader2 className="w-6 h-6 animate-spin text-primary" />
                        </div>
                    ) : messages.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-foreground/10 uppercase tracking-widest text-[10px] gap-4">
                            <MessageCircle size={48} className="opacity-20" /> Диалог не начат
                        </div>
                    ) : (
                        messages.map((msg) => (
                            <ProjectMessageItem
                                key={msg.client_message_id || msg.id}
                                msg={msg}
                                userId={user?.id}
                                onResend={onResendMessage}
                                onImageClick={setPreviewImage}
                            />
                        ))
                    )}
                    {isTyping && (
                        <div className="flex items-start animate-in fade-in slide-in-from-bottom-2 duration-300">
                            <div className="bg-card border border-border-theme p-4 rounded-2xl rounded-tl-none flex items-center gap-2">
                                <span className="text-[10px] font-black uppercase tracking-widest text-foreground/40">
                                    Менеджер печатает
                                </span>
                                <div className="flex gap-1 sm:gap-1.5">
                                    <div className="w-1 h-1 bg-primary rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                                    <div className="w-1 h-1 bg-primary rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                                    <div className="w-1 h-1 bg-primary rounded-full animate-bounce"></div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                <form
                    onSubmit={handleSubmit}
                    className="pt-6 border-t border-border-theme space-y-4"
                >
                    {pendingAttachments.length > 0 && (
                        <div className="flex gap-4 overflow-x-auto pb-6 px-2 custom-scrollbar-hide animate-in fade-in slide-in-from-bottom-2 duration-300">
                            {pendingAttachments.map((att, i) => (
                                <div
                                    key={i}
                                    className="relative shrink-0 animate-in zoom-in-95 duration-200"
                                >
                                    <div className="w-20 h-20 sm:w-24 sm:h-24 relative group">
                                        <ChatImage
                                            src={att.preview}
                                            variant="thumbnail"
                                            className="w-full h-full !rounded-2xl border-2 border-primary/20 group-hover:border-primary/50 transition-colors"
                                            onImageClick={handleImagePreviewClose}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => handleRemoveAttachment(i, att.preview)}
                                            className="absolute -top-1.5 -right-1.5 w-6 h-6 bg-red-500/90 text-white rounded-full flex items-center justify-center shadow-lg hover:bg-red-500 hover:scale-110 active:scale-95 transition-all border-none cursor-pointer z-50 ring-4 ring-background"
                                        >
                                            <Trash2 size={12} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                    <div className="flex gap-2">
                        <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="p-4 bg-card border border-border-theme rounded-2xl text-foreground/40 hover:text-primary transition-all"
                        >
                            <Paperclip size={20} />
                        </button>
                        <input
                            type="file"
                            ref={fileInputRef}
                            className="hidden"
                            accept="image/*"
                            multiple
                            onChange={handleFileSelect}
                        />
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
                                onClick={handleEmojiToggle}
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

                            {newComment.trim() || pendingAttachments.length > 0 ? (
                                <button
                                    type="submit"
                                    disabled={!newComment.trim() && pendingAttachments.length === 0}
                                    className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-primary text-white rounded-xl shadow-lg flex items-center justify-center hover:scale-105 active:scale-95 disabled:opacity-50 transition-all border-none cursor-pointer"
                                >
                                    <ArrowRight size={20} />
                                </button>
                            ) : isRecordingVoice ? (
                                <div className="absolute right-1 top-1/2 -translate-y-1/2 translate-x-[4px]">
                                    <VoiceRecorder
                                        onRecordingComplete={handleVoiceComplete}
                                        onCancel={handleCancelVoice}
                                    />
                                </div>
                            ) : (
                                <button
                                    type="button"
                                    onClick={handleStartVoice}
                                    className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-primary/10 text-primary rounded-xl flex items-center justify-center hover:bg-primary hover:text-white transition-all border-none cursor-pointer"
                                >
                                    <Mic size={18} />
                                </button>
                            )}
                        </div>
                    </div>
                </form>

                {previewImage && (
                    <ImagePreviewModal imageUrl={previewImage} onClose={handleImagePreviewClose} />
                )}
            </div>
        );
    }
);
