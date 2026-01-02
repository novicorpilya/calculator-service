import React, { useState } from 'react';
import {
    ChevronLeft, Download, Send, Calendar, MapPin, Boxes,
    MessageCircle, FileText, ArrowRight, Wallet, Layout,
    RotateCcw, Trash2, AlertTriangle, Pencil, Briefcase, Paperclip
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { type Calculation, type CalculationStatus } from '../../dashboard.types';
import { chatService, type Message } from '@/services/chat.service';
import { toast } from 'sonner';
import { ImagePreviewModal } from '@/components/ui/ImagePreviewModal';

import { useAuth } from '@/features/auth';

interface ClientCalculationDetailsProps {
    calculation: Calculation;
    onBack: () => void;
    onUpdateStatus: (id: number | string, status: CalculationStatus) => void;
    onDelete: (id: number | string) => void;
    onEdit: (calc: Calculation) => void;
}

/**
 * Modern status indicator for projects with pulse animation.
 */
const ModernStatusBadge = React.memo<{ status: Calculation['status'] }>(({ status }) => {
    const config = {
        draft: { label: 'Черновик', color: 'bg-slate-400', ghost: 'bg-card text-foreground/60' },
        sent: { label: 'Отправлен', color: 'bg-primary', ghost: 'bg-primary/10 text-primary' },
        changes: { label: 'Правки', color: 'bg-orange-500', ghost: 'bg-orange-500/10 text-orange-600' },
        approved: { label: 'Утвержден', color: 'bg-emerald-500', ghost: 'bg-emerald-500/10 text-emerald-600' },
    }[status];

    return (
        <div className={`px-4 py-1.5 rounded-full ${config.ghost} text-[10px] font-black uppercase tracking-widest flex items-center gap-2 border border-current border-opacity-10`}>
            <span className={`w-2 h-2 rounded-full ${config.color} animate-pulse`} />
            {config.label}
        </div>
    );
});

/**
 * Detailed view for a specific calculation project.
 * Handles chat interaction, status workflow, and Excel exports.
 */
export const ClientCalculationDetails = React.memo<ClientCalculationDetailsProps>(({
    calculation,
    onBack,
    onUpdateStatus,
    onDelete,
    onEdit
}) => {
    const [newComment, setNewComment] = useState('');
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [messages, setMessages] = useState<Message[]>([]);
    const [loadingMessages, setLoadingMessages] = useState(false);
    const [previewImage, setPreviewImage] = useState<string | null>(null);
    const fileInputRef = React.useRef<HTMLInputElement>(null);
    const { user } = useAuth();

    React.useEffect(() => {
        if (calculation.id) {
            loadMessages();
            const unsubscribe = chatService.subscribeToMessages((msg) => {
                setMessages(prev => [...prev, msg]);
            }, calculation.id as string);
            return () => unsubscribe();
        }
    }, [calculation.id]);

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

    const totalCost = calculation.results?.summary.reduce((sum, item) => sum + (item.total * item.price), 0) || 0;

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

    const handleWithdraw = () => {
        onUpdateStatus(calculation.id, 'draft');
    };

    const handleSend = () => {
        onUpdateStatus(calculation.id, 'sent');
    };

    const handleApprove = () => {
        onUpdateStatus(calculation.id, 'approved');
    };

    const handleReject = () => {
        onUpdateStatus(calculation.id, 'changes');
    };

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        const receiverId = user?.role === 'manager' ? calculation.user_id : calculation.manager_id;

        if (!file || !user || !receiverId) return;

        if (!file.type.startsWith('image/')) {
            toast.error('Допускаются только изображения');
            return;
        }

        const toastId = toast.loading('Загрузка изображения...');

        try {
            const imageUrl = await chatService.uploadAttachment(file);
            await chatService.sendMessage({
                sender_id: user.id,
                receiver_id: receiverId,
                calculation_id: String(calculation.id),
                content: 'Изображение',
                image_url: imageUrl
            });
            toast.success('Изображение отправлено', { id: toastId });
        } catch (error) {
            toast.error('Ошибка загрузки', { id: toastId });
        } finally {
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    return (
        <div className="w-full max-w-[min(100%,1300px)] mx-auto space-y-[clamp(1.5rem,5vh,3.5rem)] animate-in fade-in duration-700 pb-20">
            {/* Confirmation Modal */}
            {showDeleteConfirm && (
                <div className="fixed inset-0 bg-background/80 backdrop-blur-xl z-[100] flex items-center justify-center p-6 animate-in fade-in duration-300">
                    <div className="glass-card max-w-md w-full !p-10 text-center space-y-8 shadow-3xl border-primary/20">
                        <div className="w-20 h-20 bg-red-500/10 text-red-500 rounded-[2rem] flex items-center justify-center mx-auto mb-6">
                            <AlertTriangle size={36} />
                        </div>
                        <div className="space-y-3">
                            <h3 className="text-2xl font-black tracking-tight">Удалить проект?</h3>
                            <p className="text-[10px] font-black text-foreground/40 uppercase tracking-[0.2em] leading-relaxed">
                                Это действие безвозвратно удалит все данные расчета «{calculation.organizationName}»
                            </p>
                        </div>
                        <div className="flex flex-col gap-3">
                            <button
                                onClick={() => onDelete(calculation.id)}
                                className="btn-premium !bg-red-500 !text-white hover:!bg-red-600 transition-all border-none"
                            >
                                <Trash2 className="w-5 h-5" /> Подтверждаю удаление
                            </button>
                            <button
                                onClick={() => setShowDeleteConfirm(false)}
                                className="w-full py-5 rounded-[1.5rem] text-[10px] font-black uppercase tracking-[0.3em] text-foreground/30 hover:text-foreground transition-colors"
                            >
                                Отмена
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Fluid Header Section */}
            <div className="flex flex-col xl:flex-row xl:items-center gap-10 justify-between">
                <div className="flex flex-wrap items-center gap-6">
                    <button
                        onClick={onBack}
                        className="group flex items-center justify-center w-14 h-14 rounded-2xl bg-card border border-border-theme shadow-sm hover:border-primary transition-all active:scale-90"
                    >
                        <ChevronLeft className="w-6 h-6 text-foreground/40 group-hover:text-primary transition-colors" />
                    </button>
                    <div className="space-y-2">
                        <div className="flex flex-wrap items-center gap-3 sm:gap-4">
                            <h1 className="text-[clamp(1.5rem,4vw,2.5rem)]">{calculation.organizationName}</h1>
                            <ModernStatusBadge status={calculation.status} />
                        </div>
                        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-foreground/40 text-[9px] sm:text-[10px] font-black uppercase tracking-[0.2em] sm:tracking-[0.3em]">
                            <p className="flex items-center gap-2 sm:gap-3">
                                <Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary" /> Проект от {calculation.createdDate}
                            </p>
                            <p className="flex items-center gap-2 sm:gap-3">
                                <Briefcase className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary" /> Эксперт: <span className={calculation.manager === 'Назначается' ? 'text-orange-500' : 'text-foreground'}>{calculation.manager}</span>
                            </p>
                        </div>
                    </div>
                </div>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4 w-full xl:w-auto">
                    {/* Secondary Actions */}
                    <div className="flex items-center gap-3 sm:mr-4">
                        {(calculation.status === 'draft' || calculation.status === 'changes') && (
                            <button
                                onClick={() => onEdit(calculation)}
                                className="group flex items-center gap-3 px-6 py-4 bg-card border border-border-theme rounded-2xl text-[10px] font-black uppercase tracking-widest hover:border-primary transition-all active:scale-95 text-primary"
                                title="Редактировать параметры расчета"
                            >
                                <Pencil className="w-4 h-4 transition-transform group-hover:scale-110" />
                                <span className="sm:hidden xl:inline">Редактировать</span>
                            </button>
                        )}
                        {calculation.status === 'sent' && (
                            <button
                                onClick={handleWithdraw}
                                className="group flex items-center gap-3 px-6 py-4 bg-card border border-border-theme rounded-2xl text-[10px] font-black uppercase tracking-widest hover:border-primary transition-all active:scale-95"
                                title="Отозвать расчет для редактирования"
                            >
                                <RotateCcw className="w-4 h-4 text-primary group-hover:rotate-[-45deg] transition-transform" />
                                <span className="sm:hidden xl:inline">Отозвать</span>
                            </button>
                        )}
                        {(calculation.status === 'draft' || calculation.status === 'sent' || calculation.status === 'changes') && (
                            <button
                                onClick={() => setShowDeleteConfirm(true)}
                                className="group flex items-center justify-center w-14 h-14 bg-card border border-border-theme rounded-2xl text-foreground/20 hover:text-red-500 hover:border-red-500 transition-all active:scale-95"
                                title="Удалить проект"
                            >
                                <Trash2 className="w-5 h-5" />
                            </button>
                        )}
                    </div>

                    <button
                        onClick={() => exportToExcel(calculation)}
                        className="btn-premium-secondary"
                    >
                        <Download className="w-5 h-5 group-hover:scale-110 transition-transform" />
                        <span>Спецификация</span>
                    </button>

                    {(calculation.status === 'draft' || calculation.status === 'changes') && (
                        <button
                            onClick={handleSend}
                            className="btn-premium"
                        >
                            <Send className="w-5 h-5 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                            <span>Отправить</span>
                        </button>
                    )}

                    {user?.role === 'manager' && calculation.status === 'sent' && (
                        <>
                            <button
                                onClick={handleReject}
                                className="btn-premium-warning"
                            >
                                <RotateCcw className="w-5 h-5 group-hover:rotate-180 transition-transform duration-500" />
                                <span>На доработку</span>
                            </button>
                            <button
                                onClick={handleApprove}
                                className="btn-premium-success"
                            >
                                <FileText className="w-5 h-5 group-hover:scale-110 transition-transform" />
                                <span>Утвердить</span>
                            </button>
                        </>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 lg:gap-12">
                {/* Information Core */}
                <div className="xl:col-span-8 space-y-12">
                    {/* Primary Stats Grid */}
                    <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,240px),1fr))] gap-6">
                        {[
                            { label: 'Конфигурация зон', value: calculation.zonesCount, icon: Boxes, color: 'text-indigo-500', bg: 'bg-indigo-500/5' },
                            { label: 'Общий метраж', value: `${calculation.totalArea} м²`, icon: MapPin, color: 'text-blue-500', bg: 'bg-blue-500/5' },
                            { label: 'Профиль объекта', value: calculation.type || 'Ресторан', icon: FileText, color: 'text-emerald-500', bg: 'bg-emerald-500/5' },
                        ].map((stat, i) => {
                            const Icon = stat.icon;
                            return (
                                <div key={i} className="glass-card !bg-card !p-6 sm:!p-8 border-transparent hover:border-border-theme transition-all group">
                                    <div className={`w-12 h-12 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl ${stat.bg} ${stat.color} flex items-center justify-center mb-4 sm:mb-6 group-hover:scale-110 transition-transform shadow-lg shadow-black/5`}>
                                        <Icon className="w-5 h-5 sm:w-6 sm:h-6" />
                                    </div>
                                    <p className="text-[9px] sm:text-[10px] font-black text-foreground/50 uppercase tracking-[0.2em] mb-2">{stat.label}</p>
                                    <p className="text-xl sm:text-2xl font-black">{stat.value}</p>
                                </div>
                            );
                        })}
                    </div>

                    {/* Zone Architecture Overview */}
                    <div className="glass-card space-y-8">
                        <div className="flex items-center gap-4 border-b border-border-theme pb-6">
                            <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
                                <Layout className="w-5 h-5" />
                            </div>
                            <h3 className="text-xs font-black text-foreground uppercase tracking-[0.3em]">Архитектура проекта</h3>
                        </div>
                        <div className="flex flex-wrap gap-4">
                            {calculation.zones.map((zone, idx) => (
                                <div key={idx} className="group flex items-center gap-4 bg-card px-6 py-4 rounded-2xl border border-border-theme hover:border-primary transition-all shadow-sm">
                                    <div className="w-2.5 h-2.5 rounded-full bg-primary animate-pulse" />
                                    <span className="text-[11px] font-black uppercase tracking-widest text-foreground/70">{zone}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Detailed Technical Specs */}
                    {calculation.results && (
                        <div className="space-y-8">
                            <div className="flex flex-wrap items-center justify-between gap-6 ml-2">
                                <h3 className="text-xs font-black text-foreground/50 uppercase tracking-[0.3em]">Техническая спецификация инвентаря</h3>
                                <div className="flex items-center gap-2 sm:gap-3 px-4 sm:px-6 py-2 sm:py-2.5 bg-primary/10 border border-primary/20 rounded-full">
                                    <Wallet className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary" />
                                    <span className="text-[9px] sm:text-[10px] font-black text-primary uppercase tracking-widest whitespace-nowrap">
                                        Итого: {totalCost.toLocaleString()} ₽
                                    </span>
                                </div>
                            </div>

                            <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,350px),1fr))] gap-6">
                                {calculation.results.summary.map((item, i) => (
                                    <div key={i} className="glass-card flex flex-col justify-between !bg-card border-transparent hover:border-primary/20 group transition-all duration-500">
                                        <div className="flex items-start justify-between mb-8">
                                            <div className="p-4 rounded-2xl bg-card border border-border-theme group-hover:bg-primary/5 transition-colors">
                                                <Boxes className="w-6 h-6 text-foreground/40 group-hover:text-primary transition-colors" />
                                            </div>
                                            <div className="text-right space-y-1">
                                                <p className="text-[9px] font-black text-foreground/40 uppercase tracking-[0.3em]">Позиция</p>
                                                <p className="text-[13px] font-black text-primary">{(item.total * item.price).toLocaleString()} ₽</p>
                                            </div>
                                        </div>
                                        <div className="space-y-6">
                                            <h4 className="text-xl font-black leading-tight">{item.inventory}</h4>
                                            <div className="flex items-end justify-between border-t border-border-theme pt-6 mt-6">
                                                <div className="flex items-baseline gap-2">
                                                    <span className="text-4xl font-black tracking-tighter">{item.total}</span>
                                                    <span className="text-foreground/40 text-[10px] font-black uppercase tracking-widest">Единиц</span>
                                                </div>
                                                <div className="text-[10px] font-black text-foreground/50 bg-card border border-border-theme px-3 py-1.5 rounded-xl">
                                                    {item.price.toLocaleString()} ₽ / ШТ
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Engagement & Communication Sidebar */}
                <div className="xl:col-span-4 space-y-8">
                    {/* Management Unit */}
                    <div className="glass-card !bg-foreground !text-background relative overflow-hidden group !p-6 sm:!p-10 shadow-3xl">
                        <div className="relative z-10 space-y-8 sm:space-y-10">
                            <div className="flex items-center gap-4 sm:gap-6">
                                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl sm:rounded-[2rem] bg-gradient-to-br from-primary to-indigo-600 flex items-center justify-center text-2xl sm:text-3xl font-black text-white shadow-2xl shadow-primary/40 group-hover:scale-105 transition-transform">
                                    {calculation.manager[0]}
                                </div>
                                <div className="space-y-1">
                                    <h4 className="text-xl sm:text-2xl font-black tracking-tight">{calculation.manager}</h4>
                                    <p className="text-[8px] sm:text-[9px] font-black text-primary uppercase tracking-[0.4em]">Менеджер проекта</p>
                                </div>
                            </div>
                            <button className="btn-premium w-full !bg-background !text-foreground hover:!bg-primary hover:!text-white border-transparent !py-4">
                                <MessageCircle className="w-5 h-5" /> Чат в Telegram
                            </button>
                        </div>
                        {/* Interactive Design Element */}
                        <div className="absolute top-0 right-0 w-[60%] h-full bg-primary/10 blur-[80px] rounded-full translate-x-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>

                    {/* Project Dialog Stream */}
                    <div className="glass-card flex flex-col h-[clamp(450px,65vh,800px)] !p-5 sm:!p-8">
                        <div className="flex items-center justify-between mb-8 sm:mb-10 pb-4 sm:pb-6 border-b border-border-theme">
                            <div className="space-y-1">
                                <h3 className="text-[10px] sm:text-xs font-black uppercase tracking-[0.3em]">Журнал правок</h3>
                                <p className="text-[8px] sm:text-[9px] font-semibold text-foreground/40 uppercase tracking-widest">Активная сессия</p>
                            </div>
                            <span className="w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center bg-card border border-border-theme text-foreground/60 rounded-lg sm:rounded-xl text-[10px] sm:text-[11px] font-black">
                                {calculation.comments.length}
                            </span>
                        </div>

                        <div className="space-y-8 mb-8 flex-1 overflow-y-auto pr-4 custom-scrollbar">
                            {loadingMessages ? (
                                <div className="h-full flex items-center justify-center">
                                    <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                                </div>
                            ) : messages.length === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center text-foreground/10 gap-6 opacity-50">
                                    <MessageCircle className="w-16 h-16" />
                                    <p className="text-[10px] font-black uppercase tracking-[0.4em]">Диалог не начат</p>
                                </div>
                            ) : (
                                messages.map((msg, idx) => (
                                    <div key={idx} className={`flex flex-col ${msg.sender_id !== user?.id ? 'items-start' : 'items-end'}`}>
                                        <div className={`
                                            max-w-[90%] p-6 rounded-3xl text-sm leading-relaxed transition-all
                                            ${msg.sender_id !== user?.id
                                                ? 'bg-card border border-border-theme rounded-tl-none font-medium'
                                                : 'bg-primary text-white rounded-tr-none font-black shadow-lg shadow-primary/10'
                                            }
                                        `}>
                                            <div className="flex items-center justify-between gap-8 mb-3">
                                                <p className={`text-[9px] font-black uppercase tracking-widest ${msg.sender_id !== user?.id ? 'text-primary' : 'text-white/50'}`}>
                                                    {msg.sender_id !== user?.id ? 'Эксперт' : 'Вы'}
                                                </p>
                                                <p className={`text-[8px] font-bold ${msg.sender_id !== user?.id ? 'text-foreground/40' : 'text-white/30'}`}>
                                                    {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </p>
                                            </div>
                                            {msg.image_url && (
                                                <div className="mb-3 rounded-xl overflow-hidden border border-white/10">
                                                    <img
                                                        src={msg.image_url}
                                                        alt="Attachment"
                                                        className="max-w-full h-auto object-cover hover:opacity-80 transition-opacity cursor-pointer"
                                                        onClick={() => setPreviewImage(msg.image_url!)}
                                                    />
                                                </div>
                                            )}
                                            {msg.content}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>

                        <form
                            onSubmit={async (e) => {
                                e.preventDefault();
                                if (!newComment.trim() || !user) return;

                                const receiverId = user.role === 'manager' ? calculation.user_id : calculation.manager_id;
                                if (!receiverId) {
                                    toast.error('Собеседник еще не определен (проект не закреплен)');
                                    return;
                                }

                                try {
                                    await chatService.sendMessage({
                                        sender_id: user.id,
                                        receiver_id: receiverId,
                                        calculation_id: String(calculation.id),
                                        content: newComment.trim()
                                    });
                                    setNewComment('');
                                } catch (error) {
                                    toast.error('Ошибка отправки');
                                }
                            }}
                            className="relative pt-8 border-t border-border-theme"
                        >
                            <input
                                type="file"
                                ref={fileInputRef}
                                className="hidden"
                                accept="image/*"
                                onChange={handleFileSelect}
                            />
                            <div className="flex items-center gap-3">
                                <button
                                    type="button"
                                    disabled={!(user?.role === 'manager' ? calculation.user_id : calculation.manager_id)}
                                    onClick={() => fileInputRef.current?.click()}
                                    className="p-4 bg-card border border-border-theme text-foreground/40 hover:text-primary transition-all rounded-2xl flex items-center justify-center shrink-0 active:scale-95"
                                >
                                    <Paperclip size={20} />
                                </button>
                                <div className="flex-1 relative">
                                    <input
                                        type="text"
                                        value={newComment}
                                        onChange={(e) => setNewComment(e.target.value)}
                                        className={`input-premium !py-5 !pr-16 ${!(user?.role === 'manager' ? calculation.user_id : calculation.manager_id) ? 'opacity-50 cursor-not-allowed' : ''}`}
                                        placeholder={!(user?.role === 'manager' ? calculation.user_id : calculation.manager_id) ? 'Ожидание назначения...' : 'Введите сообщение...'}
                                        disabled={!(user?.role === 'manager' ? calculation.user_id : calculation.manager_id)}
                                    />
                                    <button
                                        type="submit"
                                        disabled={!(user?.role === 'manager' ? calculation.user_id : calculation.manager_id)}
                                        className="absolute right-2.5 top-1/2 -translate-y-1/2 w-11 h-11 bg-primary text-white rounded-[1.125rem] shadow-xl shadow-primary/20 flex items-center justify-center hover:scale-105 active:scale-90 transition-all disabled:opacity-50 disabled:scale-100"
                                    >
                                        <ArrowRight className="w-6 h-6" />
                                    </button>
                                </div>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
            {/* Image Preview Modal */}
            {previewImage && (
                <ImagePreviewModal
                    imageUrl={previewImage}
                    onClose={() => setPreviewImage(null)}
                />
            )}
        </div >
    );
});
