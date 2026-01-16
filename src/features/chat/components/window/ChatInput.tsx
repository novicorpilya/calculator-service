import React, { useRef, Suspense, lazy } from 'react';
import { Paperclip, Smile, Send, Mic, X, Reply, Edit2, Loader2 } from 'lucide-react';
import type { EmojiClickData } from 'emoji-picker-react';
import { VoiceRecorder } from '@/components/ui/VoiceRecorder';
import type { Message } from '../../types';

const EmojiPicker = lazy(() => import('emoji-picker-react'));

interface ChatInputProps {
    newMessage: string;
    setNewMessage: (msg: string) => void;
    pendingAttachments: { file: File; preview: string }[];
    handleRemoveAttachment: (idx: number, preview: string) => void;
    handleFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
    handleFormSubmit: (e: React.FormEvent) => void;
    handleEmojiToggle: () => void;
    showEmojiPicker: boolean;
    handleEmojiClick: (emojiData: EmojiClickData) => void;
    isRecordingVoice: boolean;
    setIsRecordingVoice: (val: boolean) => void;
    handleVoiceComplete: (audioBlob: Blob, duration: number) => void;
    handleVoiceStart: () => void;
    replyingTo: Message | null;
    editingMessage: Message | null;
    handleCancelAction: () => void;
    emojiPickerRef: React.RefObject<HTMLDivElement | null>;
}

const AttachmentPreviewItem = React.memo<{
    att: { file: File; preview: string };
    idx: number;
    onRemove: (idx: number, preview: string) => void;
}>(({ att, idx, onRemove }) => {
    return (
        <div className="relative shrink-0 group">
            <div className="w-24 h-24 rounded-2xl overflow-hidden border-2 border-primary/30 group-hover:border-primary shadow-lg transition-colors">
                <img src={att.preview} className="w-full h-full object-cover" alt="preview" />
            </div>
            <button
                type="button"
                onClick={() => onRemove(idx, att.preview)}
                className="absolute -top-2 -right-2 w-7 h-7 bg-red-500 text-white rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-all border-none cursor-pointer"
            >
                <X size={14} />
            </button>
        </div>
    );
});

export const ChatInput: React.FC<ChatInputProps> = ({
    newMessage,
    setNewMessage,
    pendingAttachments,
    handleRemoveAttachment,
    handleFileSelect,
    handleFormSubmit,
    handleEmojiToggle,
    showEmojiPicker,
    handleEmojiClick,
    isRecordingVoice,
    setIsRecordingVoice,
    handleVoiceComplete,
    handleVoiceStart,
    replyingTo,
    editingMessage,
    handleCancelAction,
    emojiPickerRef,
}) => {
    const fileInputRef = useRef<HTMLInputElement>(null);

    return (
        <div className="p-4 lg:p-6 bg-background border-t border-border-theme shrink-0">
            {(replyingTo || editingMessage) && (
                <div className="mb-4 flex items-center justify-between p-3 bg-primary/5 border-l-4 border-primary rounded-r-2xl animate-in slide-in-from-bottom-2 duration-300">
                    <div className="flex items-center gap-3 overflow-hidden">
                        <div className="p-2 bg-primary/10 rounded-xl text-primary">
                            {replyingTo ? <Reply size={16} /> : <Edit2 size={16} />}
                        </div>
                        <div className="flex flex-col overflow-hidden">
                            <span className="text-[10px] font-black uppercase tracking-widest text-primary">
                                {replyingTo ? 'Ответ на сообщение' : 'Изменение сообщения'}
                            </span>
                            <p className="text-[12px] font-medium text-foreground/60 truncate">
                                {(replyingTo || editingMessage)?.content || 'Вложение'}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={handleCancelAction}
                        className="p-2 hover:bg-primary/10 rounded-full transition-colors text-foreground/40 hover:text-primary"
                    >
                        <X size={18} />
                    </button>
                </div>
            )}

            {pendingAttachments.length > 0 && (
                <div className="mb-2 flex gap-4 overflow-x-auto pt-3 px-2 pb-2 custom-scrollbar animate-in slide-in-from-bottom-2 duration-300">
                    {pendingAttachments.map((att, idx) => (
                        <AttachmentPreviewItem
                            key={att.preview}
                            att={att}
                            idx={idx}
                            onRemove={handleRemoveAttachment}
                        />
                    ))}
                </div>
            )}
            <form onSubmit={handleFormSubmit} className="relative flex items-center gap-4">
                <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    accept="image/*"
                    multiple
                    onChange={(e) => {
                        handleFileSelect(e);
                        e.target.value = '';
                    }}
                />
                <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="p-4 hover:bg-primary/10 text-foreground/40 hover:text-primary transition-all rounded-full flex items-center justify-center shrink-0"
                >
                    <Paperclip size={24} />
                </button>
                <div className="flex-1">
                    <input
                        type="text"
                        placeholder={editingMessage ? 'Измените сообщение...' : 'Напишите сообщение...'}
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        className="w-full bg-card border border-border-theme rounded-[2.5rem] pl-8 pr-24 py-5 text-[13px] font-medium outline-none focus:border-primary transition-all"
                        autoFocus
                    />

                    {/* Emoji Picker Button */}
                    <button
                        type="button"
                        onClick={handleEmojiToggle}
                        className="absolute right-16 top-1/2 -translate-y-1/2 w-10 h-10 text-foreground/40 hover:text-primary transition-all rounded-full flex items-center justify-center"
                    >
                        <Smile size={20} />
                    </button>

                    {/* Emoji Picker Popup */}
                    {showEmojiPicker && (
                        <div ref={emojiPickerRef} className="absolute bottom-full right-0 mb-2 z-50">
                            <Suspense
                                fallback={
                                    <div className="w-[350px] h-[400px] bg-card rounded-lg animate-pulse flex items-center justify-center">
                                        <Loader2 className="w-6 h-6 animate-spin text-primary" />
                                    </div>
                                }
                            >
                                <EmojiPicker onEmojiClick={handleEmojiClick} />
                            </Suspense>
                        </div>
                    )}

                    {newMessage.trim() || pendingAttachments.length > 0 || editingMessage ? (
                        <button
                            type="submit"
                            disabled={!newMessage.trim() && pendingAttachments.length === 0 && !editingMessage}
                            className="absolute right-2.5 top-1/2 -translate-y-1/2 w-12 h-12 bg-primary text-white rounded-[1.25rem] shadow-xl flex items-center justify-center hover:scale-110 active:scale-95 disabled:opacity-50 transition-all cursor-pointer border-none"
                        >
                            <Send size={20} />
                        </button>
                    ) : isRecordingVoice ? (
                        <div className="absolute right-0 top-1/2 -translate-y-1/2 w-full">
                            <VoiceRecorder
                                onRecordingComplete={handleVoiceComplete}
                                onCancel={() => setIsRecordingVoice(false)}
                            />
                        </div>
                    ) : (
                        <button
                            type="button"
                            onClick={handleVoiceStart}
                            className="absolute right-2.5 top-1/2 -translate-y-1/2 w-12 h-12 bg-primary text-white rounded-[1.25rem] shadow-xl flex items-center justify-center hover:scale-110 active:scale-95 transition-all cursor-pointer border-none"
                        >
                            <Mic className="w-5 h-5" />
                        </button>
                    )}
                </div>
            </form>
        </div>
    );
};
