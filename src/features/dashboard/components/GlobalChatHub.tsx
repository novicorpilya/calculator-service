import React, { useState, useEffect, useRef } from 'react';
import {
    Send,
    Search,
    MessageSquare,
    MoreVertical,
    Phone,
    Info,
    CheckCircle2,
    ArrowLeft,
    Paperclip,
    X,
    Loader2,
    Trash2
} from 'lucide-react';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { chatService, type Message } from '@/services/chat.service';
import { toast } from 'sonner';
import { ImagePreviewModal } from '@/components/ui/ImagePreviewModal';
import { VoiceRecorder } from '@/components/ui/VoiceRecorder';
import { VoicePlayer } from '@/components/ui/VoicePlayer';

interface UserRecipient {
    id: string;
    organization_name: string;
    role: string;
    first_name?: string;
    last_name?: string;
}

/**
 * GlobalChatHub component for direct messaging between users.
 * Optimized with React.memo and handles real-time message streaming.
 */
export const GlobalChatHub = React.memo(() => {
    const { user } = useAuth();
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedUser, setSelectedUser] = useState<UserRecipient | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isLoadingUsers, setIsLoadingUsers] = useState(false);
    const [recipients, setRecipients] = useState<UserRecipient[]>([]);
    const [previewImage, setPreviewImage] = useState<string | null>(null);
    const [pendingAttachments, setPendingAttachments] = useState<{ file: File, preview: string, isUploading?: boolean }[]>([]);
    const [showMoreMenu, setShowMoreMenu] = useState(false);
    const [isRecordingVoice, setIsRecordingVoice] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const fileInputRef = React.useRef<HTMLInputElement>(null);
    const moreMenuRef = React.useRef<HTMLDivElement>(null);

    const isFetchingRecipients = useRef(false);
    const isFetchingMessages = useRef(false);

    useEffect(() => {
        if (user) {
            fetchRecipients();
        }
    }, [user]);

    const fetchRecipients = async () => {
        if (!user || isFetchingRecipients.current) return;
        try {
            isFetchingRecipients.current = true;
            if (recipients.length === 0) setIsLoadingUsers(true);
            const data = await chatService.getRecipients(user.id);
            setRecipients(data);
        } catch (_error) {
            toast.error('Ошибка загрузки контактов');
        } finally {
            setIsLoadingUsers(false);
            isFetchingRecipients.current = false;
        }
    };

    useEffect(() => {
        if (selectedUser && user) {
            loadMessages();
            const unsubscribe = chatService.subscribeToMessages((msg) => {
                if (msg.sender_id === selectedUser.id || msg.sender_id === user.id) {
                    setMessages(prev => {
                        if (msg.sender_id === user.id) {
                            const tempIdx = prev.findIndex(m =>
                                m.id.startsWith('temp-') &&
                                (m.content === msg.content || (m.image_url && msg.image_url))
                            );
                            if (tempIdx !== -1 && !prev.some(m => m.id === msg.id)) {
                                const next = [...prev];
                                next[tempIdx] = msg;
                                return next;
                            }
                        }
                        if (prev.some(m => m.id === msg.id)) return prev;
                        return [...prev, msg];
                    });
                }
            });
            return () => unsubscribe();
        }
    }, [selectedUser, user]);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (moreMenuRef.current && !moreMenuRef.current.contains(event.target as Node)) {
                setShowMoreMenu(false);
            }
        };

        if (showMoreMenu) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [showMoreMenu]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const loadMessages = async () => {
        if (!selectedUser || !user || isFetchingMessages.current) return;
        try {
            isFetchingMessages.current = true;
            if (messages.length === 0) setIsLoading(true);
            const data = await chatService.getDirectMessages(user.id, selectedUser.id);
            setMessages(data);
        } catch (_error) {
            toast.error('Ошибка загрузки сообщений');
        } finally {
            setIsLoading(false);
            isFetchingMessages.current = false;
        }
    };

    const filteredRecipients = recipients.filter(r => {
        const fullName = `${r.first_name || ''} ${r.last_name || ''}`.toLowerCase();
        return r.organization_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            fullName.includes(searchQuery.toLowerCase()) ||
            r.role?.toLowerCase().includes(searchQuery.toLowerCase());
    });

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        const text = newMessage.trim();
        const attachments = [...pendingAttachments];

        if ((!text && attachments.length === 0) || !selectedUser || !user) return;

        setNewMessage('');
        setPendingAttachments([]);

        const timestamp = new Date().toISOString();
        const optimisticMsgs: Message[] = [];

        if (attachments.length > 0) {
            attachments.forEach((att, i) => {
                optimisticMsgs.push({
                    id: `temp-${Date.now()}-${i}`,
                    sender_id: user.id,
                    receiver_id: selectedUser.id,
                    content: i === 0 ? text : '',
                    image_url: att.preview,
                    created_at: timestamp,
                } as Message);
            });
        } else {
            optimisticMsgs.push({
                id: `temp-${Date.now()}`,
                sender_id: user.id,
                receiver_id: selectedUser.id,
                content: text,
                created_at: timestamp,
            } as Message);
        }

        setMessages(prev => [...prev, ...optimisticMsgs]);

        try {
            if (attachments.length > 0) {
                for (let i = 0; i < attachments.length; i++) {
                    const att = attachments[i];
                    const imageUrl = await chatService.uploadAttachment(att.file);
                    await chatService.sendMessage({
                        sender_id: user.id,
                        receiver_id: selectedUser.id,
                        content: optimisticMsgs[i].content,
                        image_url: imageUrl,
                    });
                }
            } else {
                await chatService.sendMessage({
                    sender_id: user.id,
                    receiver_id: selectedUser.id,
                    content: text,
                });
            }
        } catch (_error) {
            toast.error('Не удалось отправить сообщение');
            setMessages(prev => prev.filter(m => !optimisticMsgs.find(om => om.id === m.id)));
        }
    };

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        if (files.length === 0 || !selectedUser || !user) return;
        const newAttachments: { file: File, preview: string }[] = [];
        for (const file of files) {
            if (!file.type.startsWith('image/')) continue;
            newAttachments.push({ file, preview: URL.createObjectURL(file) });
        }
        setPendingAttachments(prev => [...prev, ...newAttachments]);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const handleVoiceRecording = async (audioBlob: Blob, duration: number) => {
        if (!selectedUser || !user) return;

        const timestamp = new Date().toISOString();
        const tempVoiceUrl = URL.createObjectURL(audioBlob);

        const optimisticMsg: Message = {
            id: `temp-${Date.now()}`,
            sender_id: user.id,
            receiver_id: selectedUser.id,
            content: '',
            voice_url: tempVoiceUrl,
            voice_duration: duration,
            created_at: timestamp
        };

        setMessages(prev => [...prev, optimisticMsg]);
        setIsRecordingVoice(false);

        try {
            const voiceUrl = await chatService.uploadVoiceMessage(audioBlob);
            await chatService.sendMessage({
                sender_id: user.id,
                receiver_id: selectedUser.id,
                content: '',
                voice_url: voiceUrl,
                voice_duration: duration
            });
        } catch (_error) {
            toast.error('Не удалось отправить голосовое сообщение');
            setMessages(prev => prev.filter(m => m.id !== optimisticMsg.id));
        }
    };

    const handleClearHistory = async () => {
        if (!selectedUser || !user) return;

        const confirmed = window.confirm('Вы уверены, что хотите полностью очистить историю чата? Это действие нельзя отменить.');
        if (!confirmed) return;

        try {
            setIsLoading(true);
            await chatService.clearChatHistory(user.id, selectedUser.id);
            setMessages([]);
            toast.success('История чата очищена');
        } catch (_error) {
            toast.error('Не удалось очистить историю');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="h-[calc(100dvh-64px)] lg:h-[calc(100vh-64px)] flex bg-background overflow-hidden animate-in fade-in duration-700">
            <div className={`${selectedUser ? 'hidden md:flex' : 'flex'} w-full md:w-80 lg:w-96 flex-col border-r border-border-theme bg-background`}>
                <div className="p-6 lg:p-8 border-b border-border-theme">
                    <h2 className="text-2xl font-black uppercase tracking-tight mb-6">Диалоги</h2>
                    <div className="relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground/20" />
                        <input
                            type="text"
                            placeholder="Поиск собеседника..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-card border border-border-theme rounded-2xl pl-12 pr-4 py-3 text-[11px] font-black uppercase tracking-widest outline-none focus:border-primary transition-all"
                        />
                    </div>
                </div>
                <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-2">
                    {isLoadingUsers ? (
                        <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
                    ) : filteredRecipients.length === 0 ? (
                        <p className="text-center py-10 text-[10px] font-black uppercase tracking-widest text-foreground/20">Контакты не найдены</p>
                    ) : filteredRecipients.map((recipient) => (
                        <button
                            key={recipient.id}
                            onClick={() => setSelectedUser(recipient)}
                            className={`w-full flex items-center gap-4 p-4 rounded-2xl transition-all ${selectedUser?.id === recipient.id ? 'bg-primary text-white shadow-xl shadow-primary/20 scale-[1.02]' : 'hover:bg-primary/5 text-foreground group'}`}
                        >
                            <div className="relative">
                                <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-black text-xs ${selectedUser?.id === recipient.id ? 'bg-white/20' : 'bg-primary/10 text-primary'}`}>
                                    {(recipient.first_name?.[0] || recipient.organization_name?.[0] || '?')}
                                </div>
                                <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-emerald-500 border-2 border-background rounded-full" />
                            </div>
                            <div className="flex-1 text-left min-w-0">
                                <p className="text-[12px] font-black truncate">{recipient.role === 'client' ? recipient.organization_name : `${recipient.first_name || ''} ${recipient.last_name || ''}`.trim() || recipient.organization_name}</p>
                                <p className={`text-[10px] font-bold uppercase tracking-widest truncate ${selectedUser?.id === recipient.id ? 'text-white/60' : 'text-foreground/30'}`}>{recipient.role === 'manager' ? 'Эксперт HoReCa' : recipient.role === 'admin' ? 'Администратор' : 'Клиент'}</p>
                            </div>
                        </button>
                    ))}
                </div>
            </div>

            <div className={`${selectedUser ? 'flex' : 'hidden md:flex'} flex-1 flex-col bg-background`}>
                {selectedUser ? (
                    <>
                        <div className="p-6 border-b border-border-theme bg-background flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <button onClick={() => setSelectedUser(null)} className="md:hidden p-2 hover:bg-primary/5 rounded-xl transition-colors"><ArrowLeft size={20} /></button>
                                <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-black uppercase">{selectedUser.first_name?.[0] || selectedUser.organization_name?.[0]}</div>
                                <div>
                                    <h3 className="text-[14px] font-black tracking-tight">{selectedUser.role === 'client' ? selectedUser.organization_name : `${selectedUser.first_name || ''} ${selectedUser.last_name || ''}`.trim() || selectedUser.organization_name}</h3>
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
                                                onClick={() => {
                                                    setShowMoreMenu(false);
                                                    handleClearHistory();
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
                                    <div key={msg.id || i} className={`flex ${msg.sender_id === user?.id ? 'justify-end' : 'justify-start'} animate-in slide-in-from-bottom-2 duration-300`}>
                                        <div className={`
                                            max-w-[85%] lg:max-w-[70%] rounded-[1.5rem] relative group
                                            ${msg.image_url && !msg.content ? 'p-1 bg-[#1a1a1a]' : 'p-4 sm:p-5'}
                                            ${user && msg.sender_id === user.id
                                                ? (msg.image_url && !msg.content ? 'shadow-xl' : 'bg-primary text-white rounded-tr-none shadow-xl shadow-primary/20')
                                                : (msg.image_url && !msg.content ? 'shadow-lg' : 'bg-card border border-border-theme rounded-tl-none text-foreground')}
                                        `}>
                                            {msg.image_url && (
                                                <div className="rounded-xl overflow-hidden border border-white/10 relative min-h-[100px] bg-[#1a1a1a] flex items-center justify-center">
                                                    <img
                                                        src={msg.image_url}
                                                        alt="Attachment"
                                                        className={`max-w-full h-auto object-cover transition-all duration-300 ${msg.id.startsWith('temp-') ? 'blur-[2px] opacity-70' : 'opacity-100'}`}
                                                        onClick={() => setPreviewImage(msg.image_url!)}
                                                    />
                                                    {msg.id.startsWith('temp-') && (
                                                        <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center backdrop-blur-[2px]">
                                                            <Loader2 className="w-8 h-8 text-white animate-spin mb-2" />
                                                            <span className="text-[10px] text-white font-bold uppercase tracking-wider">Отправка...</span>
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                            {msg.voice_url && (
                                                <VoicePlayer
                                                    voiceUrl={msg.voice_url}
                                                    duration={msg.voice_duration}
                                                    className="min-w-[200px]"
                                                />
                                            )}
                                            {msg.content && <p className="text-[13px] font-medium leading-relaxed">{msg.content}</p>}
                                            <div className="flex items-center gap-2 mt-3 justify-end opacity-40">
                                                <span className="text-[8px] font-black uppercase tracking-widest">{new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                                {msg.sender_id === user?.id && <CheckCircle2 size={10} />}
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                            <div ref={messagesEndRef} />
                        </div>

                        <div className="p-4 lg:p-6 bg-background border-t border-border-theme">
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
                            <form onSubmit={handleSendMessage} className="relative flex items-center gap-4">
                                <input type="file" ref={fileInputRef} className="hidden" accept="image/*" multiple onChange={handleFileSelect} />
                                <button type="button" onClick={() => fileInputRef.current?.click()} className="p-4 hover:bg-primary/10 text-foreground/40 hover:text-primary transition-all rounded-full flex items-center justify-center shrink-0"><Paperclip size={24} /></button>
                                <div className="flex-1 relative">
                                    <input type="text" placeholder="Напишите сообщение..." value={newMessage} onChange={(e) => setNewMessage(e.target.value)} className="w-full bg-card border border-border-theme rounded-[2.5rem] pl-8 pr-16 py-5 text-[13px] font-medium outline-none focus:border-primary transition-all" />
                                    {newMessage.trim() || pendingAttachments.length > 0 ? (
                                        <button type="submit" disabled={!newMessage.trim() && pendingAttachments.length === 0} className="absolute right-2.5 top-1/2 -translate-y-1/2 w-12 h-12 bg-primary text-white rounded-[1.25rem] shadow-xl flex items-center justify-center hover:scale-110 active:scale-95 disabled:opacity-50 transition-all cursor-pointer border-none"><Send size={20} /></button>
                                    ) : isRecordingVoice ? (
                                        <div className="absolute right-2.5 top-1/2 -translate-y-1/2">
                                            <VoiceRecorder onRecordingComplete={handleVoiceRecording} />
                                        </div>
                                    ) : (
                                        <button
                                            type="button"
                                            onClick={() => setIsRecordingVoice(true)}
                                            className="absolute right-2.5 top-1/2 -translate-y-1/2 w-12 h-12 bg-primary text-white rounded-[1.25rem] shadow-xl flex items-center justify-center hover:scale-110 active:scale-95 transition-all cursor-pointer border-none"
                                        >
                                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
                                                <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                                                <line x1="12" x2="12" y1="19" y2="22" />
                                            </svg>
                                        </button>
                                    )}
                                </div>
                            </form>
                        </div>
                    </>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center p-12 text-center opacity-30">
                        <MessageSquare size={64} className="mb-8" />
                        <h3 className="text-2xl font-black uppercase tracking-tight mb-4">Ваш центр связи</h3>
                        <p className="max-w-xs text-[10px] font-bold uppercase tracking-widest leading-relaxed">Выберите собеседника из списка слева, чтобы начать общение напрямую с экспертом.</p>
                    </div>
                )}
            </div>
            {previewImage && <ImagePreviewModal imageUrl={previewImage} onClose={() => setPreviewImage(null)} />}
        </div>
    );
});
