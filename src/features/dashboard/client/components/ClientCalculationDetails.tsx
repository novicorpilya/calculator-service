import React, { useState } from 'react';
import {
    ChevronLeft, Download, Send, Calendar, MapPin, Boxes,
    MessageCircle, FileText, ArrowRight,
    Trash2, AlertTriangle, Briefcase, Paperclip,
    X, Loader2
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { type Calculation, type CalculationStatus } from '../../dashboard.types';
import { chatService, type Message } from '@/services/chat.service';
import { toast } from 'sonner';
import { ImagePreviewModal } from '@/components/ui/ImagePreviewModal';
import { CalculationBreakdown } from './CalculationBreakdown';

import { useAuth } from '@/features/auth';

interface ClientCalculationDetailsProps {
    calculation: Calculation;
    onBack: () => void;
    onUpdateStatus: (id: number | string, status: CalculationStatus, additional?: any) => void;
    onDelete: (id: number | string) => void;
    onEdit: (calc: Calculation) => void;
}

const ModernStatusBadge = React.memo<{ status: Calculation['status'] }>(({ status }) => {
    const config = {
        draft: { label: 'Черновик', color: 'bg-slate-400', ghost: 'bg-card text-foreground/60' },
        sent: { label: 'Отправлен', color: 'bg-primary', ghost: 'bg-primary/10 text-primary' },
        changes: { label: 'Правки', color: 'bg-orange-500', ghost: 'bg-orange-500/10 text-orange-600' },
        revision: { label: 'Правки внесены', color: 'bg-purple-500', ghost: 'bg-purple-500/10 text-purple-600' },
        approved: { label: 'Утвержден', color: 'bg-emerald-500', ghost: 'bg-emerald-500/10 text-emerald-600' },
        suppliers: { label: 'Передано поставщикам', color: 'bg-indigo-500', ghost: 'bg-indigo-500/10 text-indigo-600' },
        invoice: { label: 'Выставлен счет', color: 'bg-cyan-500', ghost: 'bg-cyan-500/10 text-cyan-600' },
        paid: { label: 'Оплачено', color: 'bg-emerald-500', ghost: 'bg-emerald-500/10 text-emerald-600' },
        shipping: { label: 'Поставка в работе', color: 'bg-amber-500', ghost: 'bg-amber-500/10 text-amber-600' },
        completed: { label: 'Поставка завершена', color: 'bg-teal-500', ghost: 'bg-teal-500/10 text-teal-600' },
        closed: { label: 'Проект закрыт', color: 'bg-slate-400', ghost: 'bg-slate-400/10 text-slate-500' },
    }[status];

    return (
        <div className={`px-4 py-1.5 rounded-full ${config.ghost} text-[10px] font-black uppercase tracking-widest flex items-center gap-2 border border-current border-opacity-10`}>
            <span className={`w-2 h-2 rounded-full ${config.color} animate-pulse`} />
            {config.label}
        </div>
    );
});

export const ClientCalculationDetails = React.memo<ClientCalculationDetailsProps>(({
    calculation,
    onBack,
    onUpdateStatus,
    onDelete,
}) => {
    const [newComment, setNewComment] = useState('');
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [messages, setMessages] = useState<Message[]>([]);
    const [loadingMessages, setLoadingMessages] = useState(false);
    const [previewImage, setPreviewImage] = useState<string | null>(null);
    const [pendingAttachments, setPendingAttachments] = useState<{ file: File, preview: string }[]>([]);
    const fileInputRef = React.useRef<HTMLInputElement>(null);
    const { user } = useAuth();

    React.useEffect(() => {
        if (calculation.id) {
            loadMessages();
            const unsubscribe = chatService.subscribeToMessages((msg) => {
                setMessages(prev => {
                    // Deduplication logic: replace temporary message with server-confirmed one
                    if (msg.sender_id === user?.id) {
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
            }, String(calculation.id));
            return () => unsubscribe();
        }
    }, [calculation.id, user?.id]);

    const loadMessages = async () => {
        try {
            setLoadingMessages(true);
            const data = await chatService.getCalculationMessages(calculation.id as string);
            setMessages(data);
        } catch (error) {
            toast.error('Ошибка загрузки истории правок');
        } finally {
            setLoadingMessages(false);
        }
    };

    const exportToExcel = (calc: Calculation) => {
        if (!calc.results) return;
        const wb = XLSX.utils.book_new();
        const zoneData: (string | number)[][] = [];
        calc.results.byZone.forEach(zone => {
            zoneData.push([zone.zoneName, '', '', '']);
            zoneData.push(['Инвентарь', 'Количество', 'Цена', 'Сумма']);
            zone.items.forEach(item => {
                zoneData.push([item.inventory, `${item.quantity} шт`, `${item.price}₽`, `${item.total}₽`]);
            });
            zoneData.push(['', '', '', '']);
        });
        const ws1 = XLSX.utils.aoa_to_sheet(zoneData);
        XLSX.utils.book_append_sheet(wb, ws1, 'Расчет по зонам');
        XLSX.writeFile(wb, `Расчет_${calc.organizationName}.xlsx`);
    };

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

    const totalCost = calculation.results?.summary.reduce((sum, item) => sum + (item.total * item.price), 0) || 0;
    const totalUnits = calculation.results?.summary.reduce((sum, item) => sum + item.total, 0) || 0;
    const isFinancialStage = ['invoice', 'paid', 'shipping', 'completed', 'closed'].includes(calculation.status);

    return (
        <div className="w-full max-w-[min(100%,1300px)] mx-auto space-y-[clamp(1.5rem,5vh,3.5rem)] animate-in fade-in duration-700 pb-20">
            {showDeleteConfirm && (
                <div className="fixed inset-0 bg-background/80 backdrop-blur-xl z-[100] flex items-center justify-center p-6 animate-in fade-in duration-300">
                    <div className="glass-card max-w-md w-full !p-10 text-center space-y-8 shadow-3xl border-primary/20">
                        <div className="w-20 h-20 bg-red-500/10 text-red-500 rounded-[2rem] flex items-center justify-center mx-auto mb-6">
                            <AlertTriangle size={36} />
                        </div>
                        <div className="space-y-3">
                            <h3 className="text-2xl font-black tracking-tight">Удалить проект?</h3>
                            <p className="text-[10px] font-black text-foreground/40 uppercase tracking-[0.2em] leading-relaxed italic">
                                Это действие безвозвратно удалит все данные расчета «{calculation.organizationName}»
                            </p>
                        </div>
                        <div className="flex flex-col gap-3">
                            <button onClick={() => onDelete(calculation.id)} className="btn-premium !bg-red-500 !text-white border-none">
                                <Trash2 className="w-5 h-5" /> Удалить
                            </button>
                            <button onClick={() => setShowDeleteConfirm(false)} className="w-full py-4 text-[10px] font-black uppercase tracking-[0.3em] text-foreground/30 hover:text-foreground transition-colors">
                                Отмена
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div className="flex flex-col xl:flex-row xl:items-center gap-10 justify-between">
                <div className="flex flex-wrap items-center gap-6">
                    <button onClick={onBack} className="group w-14 h-14 rounded-2xl bg-card border border-border-theme flex items-center justify-center hover:border-primary transition-all active:scale-90 shadow-sm">
                        <ChevronLeft className="w-6 h-6 text-foreground/40 group-hover:text-primary transition-colors" />
                    </button>
                    <div className="space-y-2">
                        <div className="flex flex-wrap items-center gap-3 sm:gap-4">
                            <h1 className="text-[clamp(1.5rem,4vw,2.5rem)]">{calculation.organizationName}</h1>
                            <ModernStatusBadge status={calculation.status} />
                        </div>
                        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-foreground/40 text-[10px] font-black uppercase tracking-[0.3em]">
                            <p className="flex items-center gap-2">
                                <Calendar className="w-4 h-4 text-primary" /> {calculation.createdDate}
                            </p>
                            <p className="flex items-center gap-2">
                                <Briefcase className="w-4 h-4 text-primary" /> {calculation.manager}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
                    {user?.role !== 'manager' && (
                        <button onClick={() => exportToExcel(calculation)} className="btn-premium-secondary">
                            <Download className="w-5 h-5" /> Спецификация
                        </button>
                    )}
                    {user?.role !== 'manager' && (calculation.status === 'draft' || calculation.status === 'changes') && (
                        <button onClick={() => onUpdateStatus(calculation.id, 'sent')} className="btn-premium">
                            <Send className="w-5 h-5" /> Отправить
                        </button>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 lg:gap-12">
                <div className="xl:col-span-8 space-y-12">
                    <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,240px),1fr))] gap-6">
                        {[
                            { label: 'Зоны', value: calculation.zonesCount, icon: Boxes, color: 'text-indigo-500', bg: 'bg-indigo-500/5' },
                            { label: 'Площадь', value: `${calculation.totalArea} м²`, icon: MapPin, color: 'text-blue-500', bg: 'bg-blue-500/5' },
                            { label: 'Тип объекта', value: calculation.type || 'Ресторан', icon: FileText, color: 'text-emerald-500', bg: 'bg-emerald-500/5' },
                        ].map((stat, i) => (
                            <div key={i} className="glass-card !bg-card !p-8 border-transparent hover:border-border-theme transition-all group">
                                <div className={`w-14 h-14 rounded-2xl ${stat.bg} ${stat.color} flex items-center justify-center mb-6 shadow-sm`}>
                                    <stat.icon size={24} />
                                </div>
                                <p className="text-[10px] font-black text-foreground/50 uppercase tracking-[0.2em] mb-2">{stat.label}</p>
                                <p className="text-2xl font-black">{stat.value}</p>
                            </div>
                        ))}
                    </div>

                    {calculation.results && (
                        <div className="space-y-8">
                            <div className="flex items-center justify-between ml-2">
                                <h3 className="text-xs font-black text-foreground/50 uppercase tracking-[0.3em]">Спецификация инвентаря</h3>
                                <div className="px-6 py-2.5 bg-primary/10 border border-primary/20 rounded-full text-primary text-[10px] font-black uppercase tracking-widest">
                                    {isFinancialStage ? `${totalCost.toLocaleString()} ₽` : `${totalUnits.toLocaleString()} ед.`}
                                </div>
                            </div>
                            <div className="space-y-6">
                                {calculation.results.summary.map((item, i) => (
                                    <CalculationBreakdown key={i} item={item} />
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                <div className="xl:col-span-4 space-y-8">
                    <div className="glass-card flex flex-col h-[650px] !p-6">
                        <div className="flex items-center justify-between mb-8 pb-4 border-b border-border-theme">
                            <h3 className="text-xs font-black uppercase tracking-[0.3em]">История изменений</h3>
                            <span className="w-10 h-10 flex items-center justify-center bg-card border border-border-theme rounded-xl text-[11px] font-black">
                                {messages.length}
                            </span>
                        </div>

                        <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-6 mb-6">
                            {loadingMessages ? (
                                <div className="h-full flex items-center justify-center"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
                            ) : messages.length === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center text-foreground/10 uppercase tracking-widest text-[10px] gap-4">
                                    <MessageCircle size={48} className="opacity-20" /> Диалог не начат
                                </div>
                            ) : (
                                messages.map((msg, idx) => (
                                    <div key={idx} className={`flex flex-col ${msg.sender_id === user?.id ? 'items-end' : 'items-start'}`}>
                                        <div className={`
                                            max-w-[90%] rounded-[1.5rem] relative
                                            ${msg.image_url && !msg.content ? 'p-1 bg-[#1a1a1a]' : 'p-4 sm:p-5'}
                                            ${msg.sender_id === user?.id
                                                ? (msg.image_url && !msg.content ? 'shadow-xl' : 'bg-primary text-white rounded-tr-none shadow-xl shadow-primary/20')
                                                : (msg.image_url && !msg.content ? 'shadow-lg' : 'bg-card border border-border-theme rounded-tl-none')}
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
                                                        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40 backdrop-blur-[2px]">
                                                            <Loader2 className="w-6 h-6 text-white animate-spin mb-1" />
                                                            <span className="text-[8px] text-white font-black uppercase tracking-widest">Загрузка</span>
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                            {msg.content && (
                                                <p className={`text-[13px] leading-relaxed ${msg.image_url ? 'mt-3' : ''}`}>
                                                    {msg.content}
                                                </p>
                                            )}
                                            <div className="flex items-center gap-2 mt-2 justify-end opacity-40">
                                                <span className="text-[8px] font-black uppercase tracking-widest">
                                                    {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>

                        <form
                            onSubmit={async (e) => {
                                e.preventDefault();
                                if ((!newComment.trim() && pendingAttachments.length === 0) || !user) return;
                                const receiverId = user.role === 'manager' ? calculation.user_id : calculation.manager_id;
                                if (!receiverId) return toast.error('Собеседник не определен');

                                const text = newComment.trim();
                                const attachments = [...pendingAttachments];
                                setNewComment('');
                                setPendingAttachments([]);

                                const timestamp = new Date().toISOString();
                                const optimisticMsgs: Message[] = [];

                                attachments.forEach((att, i) => {
                                    optimisticMsgs.push({
                                        id: `temp-${Date.now()}-${i}`,
                                        sender_id: user.id,
                                        receiver_id: receiverId,
                                        calculation_id: String(calculation.id),
                                        content: i === 0 ? text : '',
                                        image_url: att.preview,
                                        created_at: timestamp
                                    } as Message);
                                });

                                if (attachments.length === 0) {
                                    optimisticMsgs.push({
                                        id: `temp-${Date.now()}`,
                                        sender_id: user.id,
                                        receiver_id: receiverId,
                                        calculation_id: String(calculation.id),
                                        content: text,
                                        created_at: timestamp
                                    } as Message);
                                }

                                setMessages(prev => [...prev, ...optimisticMsgs]);

                                try {
                                    for (const att of attachments) {
                                        const url = await chatService.uploadAttachment(att.file);
                                        await chatService.sendMessage({
                                            sender_id: user.id,
                                            receiver_id: receiverId,
                                            calculation_id: String(calculation.id),
                                            content: text,
                                            image_url: url
                                        });
                                    }
                                    if (attachments.length === 0) {
                                        await chatService.sendMessage({
                                            sender_id: user.id,
                                            receiver_id: receiverId,
                                            calculation_id: String(calculation.id),
                                            content: text
                                        });
                                    }
                                } catch (error) {
                                    toast.error('Ошибка отправки');
                                    setMessages(prev => prev.filter(m => !optimisticMsgs.find(o => o.id === m.id)));
                                }
                            }}
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
                                        className="input-premium !py-4 !pr-14"
                                        placeholder="Напишите эксперту..."
                                    />
                                    <button type="submit" disabled={!newComment.trim() && pendingAttachments.length === 0} className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-primary text-white rounded-xl shadow-lg flex items-center justify-center hover:scale-105 active:scale-95 disabled:opacity-50 transition-all border-none cursor-pointer">
                                        <ArrowRight size={20} />
                                    </button>
                                </div>
                            </div>
                        </form>
                    </div>
                </div>
            </div>

            {previewImage && <ImagePreviewModal imageUrl={previewImage} onClose={() => setPreviewImage(null)} />}
        </div>
    );
});
