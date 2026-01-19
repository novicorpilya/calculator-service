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
    Truck,
} from 'lucide-react';
import EmojiPicker, { type EmojiClickData } from 'emoji-picker-react';
import { VoiceRecorder } from '@/components/ui/VoiceRecorder';
import { VoicePlayer } from '@/components/ui/VoicePlayer';
import { ImagePreviewModal } from '@/components/ui/ImagePreviewModal';
import { logger } from '@/core/logging';
import type { Message } from '@/features/chat/types';
import { ChatImage } from '@/features/chat/components';
import { RatingCardWidget } from '@/features/chat/components/RatingCardWidget';

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
                ${isOwn
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
                        onImageClick={() => onImageClick(msg.image_url!)}
                    />
                )}
                {msg.voice_url && (
                    <VoicePlayer
                        voiceUrl={msg.voice_url}
                        duration={msg.voice_duration || undefined}
                        isOwn={isOwn}
                        showLoading={msg.status === 'pending'}
                        isTemp={msg.status === 'pending'}
                        isRead={msg.is_read}
                        className="min-w-[200px]"
                    />
                )}
                {msg.content && (
                    <p className={`text-[13px] leading-relaxed ${msg.image_url || msg.voice_url ? 'mt-3' : ''}`}>
                        {msg.content}
                    </p>
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

                {/* Action Card Renderers - Inside the bubble, below timestamp */}
                {msg.message_type === 'roadmap_card' && (() => {
                    const metadata = msg.metadata as {
                        currentStep?: number;
                        statusTitle?: string;
                        description?: string;
                    } | null;
                    const currentStep = metadata?.currentStep ?? 1;
                    const statusTitle = metadata?.statusTitle ?? 'Статус реализации';
                    const description = metadata?.description ?? 'Команда закупки начала работу над вашим заказом';

                    return (
                        <div
                            className={`mt-4 p-4 rounded-2xl border space-y-4 shadow-sm animate-in fade-in slide-in-from-right-4 duration-500 ${isOwn ? 'bg-white/10 border-white/20' : 'bg-primary/5 border-primary/10'}`}
                        >
                            <div className="flex items-center gap-3">
                                <div
                                    className={`p-2 rounded-lg ${isOwn ? 'bg-white/20 text-white' : 'bg-primary/20 text-primary'}`}
                                >
                                    <Clock size={14} />
                                </div>
                                <span
                                    className={`text-[10px] font-black uppercase tracking-widest ${isOwn ? 'text-white/80' : 'text-primary/80'}`}
                                >
                                    {statusTitle}
                                </span>
                            </div>
                            <div className="flex gap-1">
                                {[1, 2, 3, 4].map((step) => (
                                    <div
                                        key={step}
                                        className={`h-1.5 flex-1 rounded-full ${step <= currentStep
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
                                className={`text-[11px] font-medium italic ${isOwn ? 'text-white/70' : 'text-foreground/70'}`}
                            >
                                {description}
                            </div>
                        </div>
                    );
                })()}

                {msg.message_type === 'shipping_card' && (() => {
                    const metadata = msg.metadata as {
                        tracker?: string;
                        deliveryDate?: string;
                        deliveryTime?: string;
                        arrivalEstimate?: string;
                    } | null;

                    return (
                        <div
                            className={`mt-4 p-5 rounded-3xl border-2 space-y-4 shadow-xl overflow-hidden relative group animate-in fade-in slide-in-from-right-4 duration-500 ${isOwn
                                ? 'bg-gradient-to-br from-white/20 to-white/5 border-white/20 text-white'
                                : 'bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20 text-foreground'
                                }`}
                        >
                            <div className={`absolute -right-10 -top-10 w-32 h-32 rounded-full blur-3xl opacity-20 animate-pulse ${isOwn ? 'bg-white' : 'bg-primary'}`} />

                            <div className="flex items-center justify-between relative">
                                <div className="flex items-center gap-3">
                                    <div className={`p-2.5 rounded-2xl shadow-lg border border-white/10 ${isOwn ? 'bg-white/20' : 'bg-primary/20 text-primary'}`}>
                                        <Truck size={18} className="animate-bounce" />
                                    </div>
                                    <div>
                                        <span className={`text-[10px] font-black uppercase tracking-[0.2em] block ${isOwn ? 'text-white/60' : 'text-primary/60'}`}>
                                            Доставка в пути
                                        </span>
                                        <h4 className="text-sm font-bold">Ваш заказ на пути к вам</h4>
                                    </div>
                                </div>
                                <div className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider backdrop-blur-md border ${isOwn ? 'bg-white/10 border-white/20 text-white' : 'bg-primary/10 border-primary/20 text-primary'
                                    }`}>
                                    {metadata?.arrivalEstimate ?? 'Скоро'}
                                </div>
                            </div>

                            <div className={`grid grid-cols-2 gap-3 p-4 rounded-2xl border ${isOwn ? 'bg-black/20 border-white/10' : 'bg-white/50 border-primary/10 dark:bg-black/20'
                                }`}>
                                <div className="space-y-1 text-center">
                                    <span className={`text-[9px] font-black uppercase tracking-widest ${isOwn ? 'text-white/40' : 'text-foreground/40'}`}>Дата</span>
                                    <p className="text-xs font-bold leading-none">{metadata?.deliveryDate ?? '--.--.----'}</p>
                                </div>
                                <div className="space-y-1 text-center">
                                    <span className={`text-[9px] font-black uppercase tracking-widest ${isOwn ? 'text-white/40' : 'text-foreground/40'}`}>Время</span>
                                    <p className="text-xs font-bold leading-none">{metadata?.deliveryTime ?? '--:--'}</p>
                                </div>
                            </div>
                        </div>
                    );
                })()}

                {msg.message_type === 'rating_card' && (
                    <RatingCardWidget
                        calculationId={String(msg.calculation_id)}
                        userId={userId || ''}
                        isOwn={isOwn}
                        title={msg.metadata?.title}
                        subtitle={msg.metadata?.subtitle}
                        initialRating={msg.metadata?.rating_value}
                    />
                )}

                {msg.message_type === 'welcome_card' && (
                    <div
                        className={`mt-4 p-4 rounded-2xl border space-y-3 shadow-sm animate-in fade-in slide-in-from-right-4 duration-500 ${isOwn
                                ? 'bg-white/10 border-white/20'
                                : 'bg-indigo-500/10 border-indigo-500/20'
                            }`}
                    >
                        <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-xl overflow-hidden border ${isOwn ? 'border-white/20' : 'border-border-theme'}`}>
                                <div className={`w-full h-full flex items-center justify-center text-white font-bold text-xs uppercase shadow-inner ${isOwn ? 'bg-white/20' : 'bg-indigo-500'}`}>
                                    EXP
                                </div>
                            </div>
                            <div className="flex-1">
                                <div
                                    className={`text-[10px] font-black uppercase tracking-widest ${isOwn ? 'text-white/70' : 'text-indigo-600 dark:text-indigo-400'
                                        }`}
                                >
                                    Персональный эксперт
                                </div>
                                <div
                                    className={`text-[12px] font-bold ${isOwn ? 'text-white' : 'text-foreground'
                                        }`}
                                >
                                    Линия аудита открыта
                                </div>
                            </div>
                        </div>
                    </div>
                )}
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
    onSendVoice?: (blob: Blob, duration: number) => Promise<unknown>;
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
                if (!onSendVoice) return;
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
                    className="pt-6 border-t border-border-theme space-y-4 relative"
                >
                    {isRecordingVoice && (
                        <div className="absolute inset-0 bg-background z-50 flex items-center pt-6">
                            <VoiceRecorder
                                onRecordingComplete={handleVoiceComplete}
                                onCancel={handleCancelVoice}
                            />
                        </div>
                    )}
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
