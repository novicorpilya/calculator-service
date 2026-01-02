import React, { useState, useEffect, useRef } from 'react';
import {
    Send,
    Search,
    MessageSquare,
    MoreVertical,
    Phone,
    Info,
    CheckCircle2,
    ArrowLeft
} from 'lucide-react';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { chatService, type Message } from '@/services/chat.service';
import { toast } from 'sonner';

interface UserRecipient {
    id: string;
    organization_name: string;
    role: string;
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
    const messagesEndRef = useRef<HTMLDivElement>(null);

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
            // Only show loader if we have no recipients yet
            if (recipients.length === 0) setIsLoadingUsers(true);
            const data = await chatService.getRecipients(user.id, user.role);
            setRecipients(data);
        } catch (error) {
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
                    setMessages(prev => [...prev, msg]);
                }
            });
            return () => unsubscribe();
        }
    }, [selectedUser, user]);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const loadMessages = async () => {
        if (!selectedUser || !user || isFetchingMessages.current) return;
        try {
            isFetchingMessages.current = true;
            // Only show loader if we have no messages for this conversation yet
            if (messages.length === 0) setIsLoading(true);
            const data = await chatService.getDirectMessages(user.id, selectedUser.id);
            setMessages(data);
        } catch (error) {
            toast.error('Ошибка загрузки сообщений');
        } finally {
            setIsLoading(false);
            isFetchingMessages.current = false;
        }
    };

    const filteredRecipients = recipients.filter(r =>
        r.organization_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.role?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim() || !selectedUser || !user) return;

        try {
            const msgPayload = {
                sender_id: user.id,
                receiver_id: selectedUser.id,
                content: newMessage.trim(),
            };
            await chatService.sendMessage(msgPayload);
            setNewMessage('');
        } catch (error) {
            toast.error('Не удалось отправить сообщение');
        }
    };

    return (
        <div className="h-[calc(100vh-12rem)] flex bg-card border border-border-theme rounded-[2.5rem] overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-700">
            {/* Sidebar */}
            <div className={`
                ${selectedUser ? 'hidden md:flex' : 'flex'} 
                w-full md:w-80 lg:w-96 flex-col border-r border-border-theme bg-background/30 backdrop-blur-xl
            `}>
                <div className="p-8 border-b border-border-theme">
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
                        <div className="flex justify-center py-10">
                            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                        </div>
                    ) : filteredRecipients.length === 0 ? (
                        <p className="text-center py-10 text-[10px] font-black uppercase tracking-widest text-foreground/20">Контакты не найдены</p>
                    ) : filteredRecipients.map((recipient) => (
                        <button
                            key={recipient.id}
                            onClick={() => setSelectedUser(recipient)}
                            className={`
                                w-full flex items-center gap-4 p-4 rounded-2xl transition-all
                                ${selectedUser?.id === recipient.id
                                    ? 'bg-primary text-white shadow-xl shadow-primary/20 scale-[1.02]'
                                    : 'hover:bg-primary/5 text-foreground group'}
                            `}
                        >
                            <div className="relative">
                                <div className={`
                                    w-12 h-12 rounded-xl flex items-center justify-center font-black text-xs
                                    ${selectedUser?.id === recipient.id ? 'bg-white/20' : 'bg-primary/10 text-primary'}
                                `}>
                                    {recipient.organization_name?.[0] || '?'}
                                </div>
                                <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-emerald-500 border-2 border-background rounded-full" />
                            </div>
                            <div className="flex-1 text-left min-w-0">
                                <div className="flex justify-between items-center mb-0.5">
                                    <p className="text-[12px] font-black truncate">{recipient.organization_name}</p>
                                </div>
                                <p className={`text-[10px] font-bold uppercase tracking-widest truncate ${selectedUser?.id === recipient.id ? 'text-white/60' : 'text-foreground/30'}`}>
                                    {recipient.role === 'manager' ? 'Эксперт HoReCa' : recipient.role === 'admin' ? 'Администратор' : 'Клиент'}
                                </p>
                            </div>
                        </button>
                    ))}
                </div>
            </div>

            {/* Chat Area */}
            <div className={`
                ${selectedUser ? 'flex' : 'hidden md:flex'} 
                flex-1 flex-col bg-card/50
            `}>
                {selectedUser ? (
                    <>
                        {/* Chat Header */}
                        <div className="p-6 border-b border-border-theme bg-background/50 flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <button
                                    onClick={() => setSelectedUser(null)}
                                    className="md:hidden p-2 hover:bg-primary/5 rounded-xl transition-colors"
                                >
                                    <ArrowLeft size={20} />
                                </button>
                                <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-black">
                                    {selectedUser.organization_name?.[0]}
                                </div>
                                <div>
                                    <h3 className="text-[14px] font-black tracking-tight">{selectedUser.organization_name}</h3>
                                    <div className="flex items-center gap-2">
                                        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                        <span className="text-[9px] font-bold text-foreground/40 uppercase tracking-widest">
                                            В сети
                                        </span>
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <button className="p-3 hover:bg-primary/5 rounded-xl transition-all text-foreground/40 hover:text-primary">
                                    <Phone size={20} />
                                </button>
                                <button className="p-3 hover:bg-primary/5 rounded-xl transition-all text-foreground/40 hover:text-primary">
                                    <Info size={20} />
                                </button>
                                <button className="p-3 hover:bg-primary/5 rounded-xl transition-all text-foreground/40 hover:text-primary">
                                    <MoreVertical size={20} />
                                </button>
                            </div>
                        </div>

                        {/* Messages Area */}
                        <div className="flex-1 overflow-y-auto custom-scrollbar p-8 space-y-6">
                            {isLoading ? (
                                <div className="h-full flex items-center justify-center">
                                    <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                                </div>
                            ) : messages.length === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center text-foreground/10 space-y-4">
                                    <MessageSquare size={64} />
                                    <p className="text-[10px] font-black uppercase tracking-[0.4em]">Начните общение первым</p>
                                </div>
                            ) : (
                                messages.map((msg, i) => {
                                    const isOwn = msg.sender_id === user?.id;
                                    return (
                                        <div key={msg.id || i} className={`flex ${isOwn ? 'justify-end' : 'justify-start'} animate-in slide-in-from-bottom-2 duration-300`}>
                                            <div className={`
                                                max-w-[80%] lg:max-w-[60%] p-5 rounded-[2rem] 
                                                ${isOwn
                                                    ? 'bg-primary text-white rounded-tr-none shadow-xl shadow-primary/20'
                                                    : 'bg-background border border-border-theme rounded-tl-none text-foreground'}
                                            `}>
                                                <p className="text-[13px] font-medium leading-relaxed">{msg.content}</p>
                                                <div className={`flex items-center gap-2 mt-3 justify-end opacity-40`}>
                                                    <span className="text-[8px] font-black uppercase tracking-widest">
                                                        {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </span>
                                                    {isOwn && <CheckCircle2 size={10} />}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Input Area */}
                        <div className="p-6 bg-background/50 border-t border-border-theme">
                            <form onSubmit={handleSendMessage} className="relative flex items-center gap-4">
                                <div className="flex-1 relative">
                                    <input
                                        type="text"
                                        placeholder="Напишите сообщение..."
                                        value={newMessage}
                                        onChange={(e) => setNewMessage(e.target.value)}
                                        className="w-full bg-card border border-border-theme rounded-[2rem] pl-8 pr-16 py-5 text-[13px] font-medium outline-none focus:border-primary transition-all shadow-inner"
                                    />
                                    <button
                                        type="submit"
                                        disabled={!newMessage.trim()}
                                        className="absolute right-2.5 top-1/2 -translate-y-1/2 w-12 h-12 bg-primary text-white rounded-[1.25rem] shadow-xl shadow-primary/20 flex items-center justify-center hover:scale-110 active:scale-95 disabled:opacity-50 disabled:scale-100 transition-all cursor-pointer border-none"
                                        style={{ background: 'linear-gradient(135deg, var(--primary) 0%, #1d4ed8 100%)' }}
                                    >
                                        <Send size={20} className="transition-transform group-hover:translate-x-1" />
                                    </button>
                                </div>
                            </form>
                            <p className="text-[8px] font-bold text-foreground/20 uppercase tracking-[0.3em] text-center mt-4">
                                Сообщения защищены сквозным шифрованием
                            </p>
                        </div>
                    </>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center p-12 text-center opacity-30">
                        <div className="w-32 h-32 bg-primary/5 rounded-[3rem] flex items-center justify-center text-primary mb-8 border border-primary/10">
                            <MessageSquare size={64} />
                        </div>
                        <h3 className="text-2xl font-black uppercase tracking-tight mb-4">Ваш центр связи</h3>
                        <p className="max-w-xs text-[10px] font-bold uppercase tracking-widest leading-relaxed">
                            Выберите собеседника из списка слева, чтобы начать общение напрямую с экспертом.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
});
