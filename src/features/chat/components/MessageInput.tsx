/**
 * MessageInput Component
 * Input area with attachments, voice recording, and emoji picker.
 */

import React, { useRef, useState, useEffect, lazy, Suspense } from 'react';
import { Send, Paperclip, X, Smile, Mic } from 'lucide-react';
import type { Message } from '../types';
import { VoiceRecorder } from '@/components/ui/VoiceRecorder';

// Lazy load emoji picker for code splitting
const TelegramEmojiPicker = lazy(() =>
    import('@/components/ui/TelegramEmojiPicker').then((m) => ({ default: m.TelegramEmojiPicker }))
);

interface PendingAttachment {
    file: File;
    preview: string;
    isUploading?: boolean;
}

interface MessageInputProps {
    value: string;
    pendingAttachments: PendingAttachment[];
    replyingTo: Message | null;
    editingMessage: Message | null;
    onChange: (value: string) => void;
    onSend: () => void;
    onFileSelect: (files: FileList) => void;
    onRemoveAttachment: (index: number) => void;
    onVoiceRecording: (blob: Blob, duration: number) => void;
    onCancelAction: () => void;
}

export const MessageInput: React.FC<MessageInputProps> = React.memo(
    ({
        value,
        pendingAttachments,
        replyingTo,
        editingMessage,
        onChange,
        onSend,
        onFileSelect,
        onRemoveAttachment,
        onVoiceRecording,
        onCancelAction,
    }) => {
        const [showEmojiPicker, setShowEmojiPicker] = useState(false);
        const [isRecordingVoice, setIsRecordingVoice] = useState(false);
        const fileInputRef = useRef<HTMLInputElement>(null);
        const textInputRef = useRef<HTMLInputElement>(null);

        // Auto-focus when editing or replying
        useEffect(() => {
            if (replyingTo || editingMessage) {
                textInputRef.current?.focus();
            }
        }, [replyingTo, editingMessage]);

        const handleSubmit = (e: React.FormEvent) => {
            e.preventDefault();
            onSend();
        };

        const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
            if (e.target.files && e.target.files.length > 0) {
                onFileSelect(e.target.files);
                e.target.value = '';
            }
        };

        const handleEmojiClick = (emoji: string) => {
            onChange(value + emoji);
        };

        const handleVoiceComplete = (blob: Blob, duration: number) => {
            setIsRecordingVoice(false);
            onVoiceRecording(blob, duration);
        };

        const handleVoiceCancel = () => {
            setIsRecordingVoice(false);
        };

        const hasContent = value.trim() || pendingAttachments.length > 0;

        return (
            <div className="p-4 lg:p-6 bg-background border-t border-border-theme">
                {/* Reply/Edit Banner */}
                {(replyingTo || editingMessage) && (
                    <div className="mb-2 flex items-center justify-between p-3 bg-primary/5 rounded-2xl border-l-4 border-primary animate-in slide-in-from-bottom-2">
                        <div className="flex flex-col">
                            <span className="text-[10px] font-black uppercase tracking-widest text-primary mb-1">
                                {replyingTo ? 'Ответ на сообщение' : 'Редактирование'}
                            </span>
                            <span className="text-[12px] font-medium text-foreground/70 truncate max-w-[200px] md:max-w-md">
                                {replyingTo?.content || editingMessage?.content || 'Вложение'}
                            </span>
                        </div>
                        <button
                            type="button"
                            onClick={onCancelAction}
                            className="p-2 hover:bg-primary/10 text-foreground/40 hover:text-primary rounded-full transition-colors"
                        >
                            <X size={16} />
                        </button>
                    </div>
                )}

                {/* Pending Attachments */}
                {pendingAttachments.length > 0 && !isRecordingVoice && (
                    <div className="mb-2 flex gap-4 overflow-x-auto pt-3 px-2 pb-2 custom-scrollbar animate-in slide-in-from-bottom-2 duration-300">
                        {pendingAttachments.map((att, idx) => (
                            <div key={idx} className="relative shrink-0 group">
                                <div className="w-24 h-24 rounded-2xl overflow-hidden border-2 border-primary/30 group-hover:border-primary shadow-lg transition-colors">
                                    <img
                                        src={att.preview}
                                        alt=""
                                        className="w-full h-full object-cover"
                                    />
                                </div>
                                <button
                                    type="button"
                                    onClick={() => {
                                        URL.revokeObjectURL(att.preview);
                                        onRemoveAttachment(idx);
                                    }}
                                    className="absolute -top-2 -right-2 w-7 h-7 bg-red-500 text-white rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-all border-none cursor-pointer"
                                >
                                    <X size={14} />
                                </button>
                            </div>
                        ))}
                    </div>
                )}

                {/* Voice Recording Mode */}
                {isRecordingVoice ? (
                    <div className="flex items-center gap-4">
                        <VoiceRecorder
                            onRecordingComplete={handleVoiceComplete}
                            onCancel={handleVoiceCancel}
                        />
                    </div>
                ) : (
                    /* Normal Input Form */
                    <form onSubmit={handleSubmit} className="relative flex items-center gap-4">
                        <input
                            type="file"
                            ref={fileInputRef}
                            className="hidden"
                            accept="image/*"
                            multiple
                            onChange={handleFileChange}
                        />
                        <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="p-4 hover:bg-primary/10 text-foreground/40 hover:text-primary transition-all rounded-full flex items-center justify-center shrink-0"
                            aria-label="Прикрепить файл"
                        >
                            <Paperclip size={24} />
                        </button>

                        <div className="flex-1 relative">
                            <input
                                ref={textInputRef}
                                type="text"
                                placeholder="Напишите сообщение..."
                                value={value}
                                onChange={(e) => onChange(e.target.value)}
                                className="w-full bg-card border border-border-theme rounded-[2.5rem] pl-8 pr-24 py-5 text-[13px] font-medium outline-none focus:border-primary transition-all"
                                aria-label="Текст сообщения"
                            />

                            {/* Emoji Picker Button */}
                            <button
                                type="button"
                                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                                className="absolute right-16 top-1/2 -translate-y-1/2 w-10 h-10 text-foreground/40 hover:text-primary transition-all rounded-full flex items-center justify-center"
                                aria-label="Выбрать эмодзи"
                            >
                                <Smile size={20} />
                            </button>

                            {/* Emoji Picker Popup */}
                            {showEmojiPicker && (
                                <div className="absolute bottom-full right-0 mb-2 z-50">
                                    <Suspense
                                        fallback={
                                            <div className="w-80 h-96 bg-card rounded-2xl animate-pulse" />
                                        }
                                    >
                                        <TelegramEmojiPicker
                                            onEmojiClick={handleEmojiClick}
                                            onClose={() => setShowEmojiPicker(false)}
                                        />
                                    </Suspense>
                                </div>
                            )}

                            {/* Send / Voice Button */}
                            {hasContent ? (
                                <button
                                    type="submit"
                                    className="absolute right-2.5 top-1/2 -translate-y-1/2 w-12 h-12 bg-primary text-white rounded-[1.25rem] shadow-xl flex items-center justify-center hover:scale-110 active:scale-95 transition-all cursor-pointer border-none"
                                    aria-label="Отправить сообщение"
                                >
                                    <Send size={20} />
                                </button>
                            ) : (
                                <button
                                    type="button"
                                    onClick={() => setIsRecordingVoice(true)}
                                    className="absolute right-2.5 top-1/2 -translate-y-1/2 w-12 h-12 bg-primary text-white rounded-[1.25rem] shadow-xl flex items-center justify-center hover:scale-110 active:scale-95 transition-all cursor-pointer border-none"
                                    aria-label="Записать голосовое сообщение"
                                >
                                    <Mic size={20} />
                                </button>
                            )}
                        </div>
                    </form>
                )}
            </div>
        );
    }
);

MessageInput.displayName = 'MessageInput';
