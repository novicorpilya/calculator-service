import React, { useState, useRef, useEffect, useCallback, lazy, Suspense } from 'react';
import {
    Send, MessageSquare, MoreVertical, Phone, Info,
    CheckCircle2, ArrowLeft, Paperclip, X, Loader2,
    Trash2, Smile, Mic
} from 'lucide-react';
import type { EmojiClickData } from 'emoji-picker-react';
import { VoiceRecorder } from '@/components/ui/VoiceRecorder';
import { VoicePlayer } from '@/components/ui/VoicePlayer';
import { ImagePreviewModal } from '@/components/ui/ImagePreviewModal';
import type { Message, ChatRecipient } from '../types';
import { logger } from '@/app/services';
import { toast } from 'sonner';

// Lazy load heavy emoji picker (~200KB)
const EmojiPicker = lazy(() => import('emoji-picker-react'));

interface ChatWindowProps {
    currentUser: { id: string };
    selectedUser: ChatRecipient | null;
    messages: Message[];
    isLoading: boolean;
    onSendMessage: (params: { sender_id: string; receiver_id: string; content: string }) => Promise<any>;
    onSendImage: (params: { file: File; previewUrl: string; sender_id?: string; receiver_id?: string; content?: string }) => Promise<any>;
    onSendVoice: (params: { blob: Blob; previewUrl: string; duration: number; sender_id?: string; receiver_id?: string }) => Promise<any>;
    onClearHistory: () => Promise<void>;
    onDeleteMessage?: (id: string) => Promise<void>;
    onBack?: () => void;
}

export const ChatWindow: React.FC<ChatWindowProps> = ({
    currentUser,
    selectedUser,
    messages,
    isLoading,
    onSendMessage,
    onSendImage,
    onSendVoice,
    onClearHistory,
    onBack
}) => {
    const [newMessage, setNewMessage] = useState('');
    const [pendingAttachments, setPendingAttachments] = useState<{ file: File, preview: string }[]>([]);
    const [showMoreMenu, setShowMoreMenu] = useState(false);
    const [isRecordingVoice, setIsRecordingVoice] = useState(false);
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const [previewImage, setPreviewImage] = useState<string | null>(null);

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const moreMenuRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = useCallback(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, []);

    useEffect(() => {
        scrollToBottom();
    }, [messages, scrollToBottom]);

    // Close menu on click outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (moreMenuRef.current && !moreMenuRef.current.contains(event.target as Node)) {
                setShowMoreMenu(false);
            }
        };
        if (showMoreMenu) document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [showMoreMenu]);

    const handleEmojiClick = (emojiData: EmojiClickData) => {
        setNewMessage(prev => prev + emojiData.emoji);
        setShowEmojiPicker(false);
    };

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        if (files.length === 0 || !selectedUser) return;
        const newAttachments: { file: File, preview: string }[] = [];
        for (const file of files) {
            if (!file.type.startsWith('image/')) continue;
            newAttachments.push({ file, preview: URL.createObjectURL(file) });
        }
        setPendingAttachments(prev => [...prev, ...newAttachments]);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const handleFormSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const text = newMessage.trim();
        const attachments = [...pendingAttachments];
        if ((!text && attachments.length === 0) || !selectedUser) return;

        setNewMessage('');
        setPendingAttachments([]);

        try {
            if (attachments.length > 0) {
                for (let i = 0; i < attachments.length; i++) {
                    const att = attachments[i];
                    await onSendImage({
                        file: att.file,
                        previewUrl: att.preview,
                        sender_id: currentUser.id,
                        receiver_id: selectedUser.id,
                        content: i === 0 ? text : ''
                    });
                }
            } else {
                await onSendMessage({
                    sender_id: currentUser.id,
                    receiver_id: selectedUser.id,
                    content: text
                });
            }
        } catch (error) {
            logger.error('Failed to send message via form', {
                userId: currentUser.id,
                recipientId: selectedUser.id,
                hasAttachments: attachments.length > 0
            }, error);
            toast.error('Не удалось отправить сообщение');
        }
    };

    const handleVoiceComplete = async (audioBlob: Blob, duration: number) => {
        if (!selectedUser) return;
        const previewUrl = URL.createObjectURL(audioBlob);
        setIsRecordingVoice(false);
        try {
            await onSendVoice({
                blob: audioBlob,
                previewUrl,
                duration,
                sender_id: currentUser.id,
                receiver_id: selectedUser.id
            });
        } catch (error) {
            logger.error('Failed to send voice message', {
                userId: currentUser.id,
                recipientId: selectedUser.id,
                duration
            }, error);
            toast.error('Не удалось отправить голосовое сообщение');
        }
    };

    const handleClearHistoryClick = async () => {
        if (!window.confirm('Вы уверены, что хотите полностью очистить историю чата?')) return;
        setShowMoreMenu(false);
        await onClearHistory();
    };

    if (!selectedUser) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center p-12 text-center opacity-30 bg-background">
                <MessageSquare size={64} className="mb-8" />
                <h3 className="text-2xl font-black uppercase tracking-tight mb-4">Ваш центр связи</h3>
                <p className="max-w-xs text-[10px] font-bold uppercase tracking-widest leading-relaxed">
                    Выберите собеседника из списка слева, чтобы начать общение напрямую с экспертом.
                </p>
            </div>
        );
    }

    return (
        <div className="flex-1 flex flex-col bg-background h-full overflow-hidden">
            {/* Header */}
            <div className="p-6 border-b border-border-theme bg-background flex items-center justify-between shrink-0">
                <div className="flex items-center gap-4">
                    {onBack && (
                        <button onClick={onBack} className="md:hidden p-2 hover:bg-primary/5 rounded-xl transition-colors">
                            <ArrowLeft size={20} />
                        </button>
                    )}
                    <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-black uppercase text-xl">
                        {selectedUser.first_name?.[0] || selectedUser.organization_name?.[0]}
                    </div>
                    <div>
                        <h3 className="text-[14px] font-black tracking-tight">
                            {selectedUser.role === 'client' ? selectedUser.organization_name : `${selectedUser.first_name || ''} ${selectedUser.last_name || ''}`.trim() || selectedUser.organization_name}
                        </h3>
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                            <span className="text-[9px] font-bold text-foreground/40 uppercase tracking-widest">В сети</span>
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <button className="p-3 hover:bg-primary/5 rounded-xl transition-all text-foreground/40 hover:text-primary"><Phone size={20} /></button>
                    <button className="p-3 hover:bg-primary/5 rounded-xl transition-all text-foreground/40 hover:text-primary"><Info size={20} /></button>
                    <div className="relative" ref={moreMenuRef}>
                        <button
                            onClick={() => setShowMoreMenu(!showMoreMenu)}
                            className={`p-3 rounded-xl transition-all ${showMoreMenu ? 'bg-primary/10 text-primary' : 'hover:bg-primary/5 text-foreground/40 hover:text-primary'}`}
                        >
                            <MoreVertical size={20} />
                        </button>

                        {showMoreMenu && (
                            <div className="absolute right-0 top-full mt-2 w-48 bg-card border border-border-theme rounded-2xl shadow-2xl z-[110] overflow-hidden animate-in zoom-in-95 duration-200">
                                <button
                                    onClick={handleClearHistoryClick}
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

            {/* Messages */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-4 lg:p-8 space-y-6">
                {isLoading ? (
                    <div className="h-full flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
                ) : messages.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-foreground/10 space-y-4">
                        <MessageSquare size={64} />
                        <p className="text-[10px] font-black uppercase tracking-[0.4em]">Начните общение первым</p>
                    </div>
                ) : (
                    messages.map((msg, i) => (
                        <div key={msg.id || i} className={`flex ${msg.sender_id === currentUser.id ? 'justify-end' : 'justify-start'} animate-in slide-in-from-bottom-2 duration-300`}>
                            <div className={`
                                max-w-[85%] lg:max-w-[70%] rounded-[1.5rem] relative group
                                ${msg.image_url && !msg.content ? 'p-1 bg-[#1a1a1a]' : 'p-4 sm:p-5'}
                                ${msg.sender_id === currentUser.id
                                    ? (msg.image_url && !msg.content ? 'shadow-xl' : 'bg-primary text-white rounded-tr-none shadow-xl shadow-primary/20')
                                    : (msg.image_url && !msg.content ? 'shadow-lg' : 'bg-card border border-border-theme rounded-tl-none text-foreground')}
                            `}>
                                {msg.image_url && (
                                    <div className="rounded-xl overflow-hidden border border-white/10 relative bg-[#1a1a1a]">
                                        <img
                                            src={msg.image_url}
                                            alt="Attachment"
                                            className={`max-w-full h-auto object-cover transition-all duration-300 ${msg.id.startsWith('temp-') ? 'blur-[2px] opacity-70' : 'opacity-100'}`}
                                            onClick={() => setPreviewImage(msg.image_url!)}
                                            loading="lazy"
                                        />
                                        {msg.id.startsWith('temp-') && (
                                            <div className="absolute inset-0 flex items-center justify-center">
                                                <div className="relative">
                                                    <Loader2 className="w-10 h-10 text-white animate-spin drop-shadow-lg" />
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}
                                {msg.voice_url && (
                                    <VoicePlayer
                                        voiceUrl={msg.voice_url}
                                        duration={msg.voice_duration || undefined}
                                        className="min-w-[200px]"
                                    />
                                )}
                                {msg.content && <p className="text-[13px] font-medium leading-relaxed">{msg.content}</p>}
                                <div className="flex items-center gap-2 mt-3 justify-end opacity-40">
                                    <span className="text-[8px] font-black uppercase tracking-widest">{msg.created_at ? new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '...'}</span>
                                    {msg.sender_id === currentUser.id && <CheckCircle2 size={10} />}
                                </div>
                            </div>
                        </div>
                    ))
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-4 lg:p-6 bg-background border-t border-border-theme shrink-0">
                {pendingAttachments.length > 0 && (
                    <div className="mb-2 flex gap-4 overflow-x-auto pt-3 px-2 pb-2 custom-scrollbar animate-in slide-in-from-bottom-2 duration-300">
                        {pendingAttachments.map((att, idx) => (
                            <div key={idx} className="relative shrink-0 group">
                                <div className="w-24 h-24 rounded-2xl overflow-hidden border-2 border-primary/30 group-hover:border-primary shadow-lg transition-colors">
                                    <img src={att.preview} className="w-full h-full object-cover" />
                                </div>
                                <button onClick={() => { URL.revokeObjectURL(att.preview); setPendingAttachments(prev => prev.filter((_, i) => i !== idx)); }} className="absolute -top-2 -right-2 w-7 h-7 bg-red-500 text-white rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-all border-none cursor-pointer">
                                    <X size={14} />
                                </button>
                            </div>
                        ))}
                    </div>
                )}
                <form onSubmit={handleFormSubmit} className="relative flex items-center gap-4">
                    <input type="file" ref={fileInputRef} className="hidden" accept="image/*" multiple onChange={handleFileSelect} />
                    <button type="button" onClick={() => fileInputRef.current?.click()} className="p-4 hover:bg-primary/10 text-foreground/40 hover:text-primary transition-all rounded-full flex items-center justify-center shrink-0"><Paperclip size={24} /></button>
                    <div className="flex-1 relative">
                        <input type="text" placeholder="Напишите сообщение..." value={newMessage} onChange={(e) => setNewMessage(e.target.value)} className="w-full bg-card border border-border-theme rounded-[2.5rem] pl-8 pr-24 py-5 text-[13px] font-medium outline-none focus:border-primary transition-all" />

                        {/* Emoji Picker Button */}
                        <button
                            type="button"
                            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                            className="absolute right-16 top-1/2 -translate-y-1/2 w-10 h-10 text-foreground/40 hover:text-primary transition-all rounded-full flex items-center justify-center"
                        >
                            <Smile size={20} />
                        </button>

                        {/* Emoji Picker Popup */}
                        {showEmojiPicker && (
                            <div className="absolute bottom-full right-0 mb-2 z-50">
                                <Suspense fallback={<div className="w-[350px] h-[400px] bg-card rounded-lg animate-pulse flex items-center justify-center"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>}>
                                    <EmojiPicker onEmojiClick={handleEmojiClick} />
                                </Suspense>
                            </div>
                        )}

                        {newMessage.trim() || pendingAttachments.length > 0 ? (
                            <button type="submit" disabled={!newMessage.trim() && pendingAttachments.length === 0} className="absolute right-2.5 top-1/2 -translate-y-1/2 w-12 h-12 bg-primary text-white rounded-[1.25rem] shadow-xl flex items-center justify-center hover:scale-110 active:scale-95 disabled:opacity-50 transition-all cursor-pointer border-none"><Send size={20} /></button>
                        ) : isRecordingVoice ? (
                            <div className="absolute right-2.5 top-1/2 -translate-y-1/2">
                                <VoiceRecorder onRecordingComplete={handleVoiceComplete} />
                            </div>
                        ) : (
                            <button
                                type="button"
                                onClick={() => setIsRecordingVoice(true)}
                                className="absolute right-2.5 top-1/2 -translate-y-1/2 w-12 h-12 bg-primary text-white rounded-[1.25rem] shadow-xl flex items-center justify-center hover:scale-110 active:scale-95 transition-all cursor-pointer border-none"
                            >
                                <Mic className="w-5 h-5" />
                            </button>
                        )}
                    </div>
                </form>
            </div>
            {previewImage && <ImagePreviewModal imageUrl={previewImage} onClose={() => setPreviewImage(null)} />}
        </div>
    );
};
