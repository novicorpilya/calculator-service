import React, { useState } from 'react';
import {
    ChevronLeft, Download, Send, Calendar, MapPin, Boxes,
    MessageCircle, FileText, ArrowRight,
    Trash2, AlertTriangle, Briefcase, Paperclip,
    X, Loader2, AlertCircle, CheckCircle
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { type Calculation, type CalculationStatus, type CalculationResults } from '../../dashboard.types';
import { chatService, type Message } from '@/services/chat.service';
import { toast } from 'sonner';
import { ImagePreviewModal } from '@/components/ui/ImagePreviewModal';
import { CalculationBreakdown } from './CalculationBreakdown';
import { ProductPickerModal } from './ProductPickerModal';
import { inventoryService, type InventoryItemMaster } from '@/services/inventory.service';
import { COMPANY_REQUISITES } from '../../dashboard.types';
import { useAuth } from '@/features/auth';
import { CreditCard, Copy, MoreVertical } from 'lucide-react';

interface ClientCalculationDetailsProps {
    calculation: Calculation;
    onBack: () => void;
    onUpdateStatus: (id: number | string, status: CalculationStatus, additional?: { results?: CalculationResults }) => void;
    onDelete: (id: number | string) => void;
    onEdit: (calc: Calculation) => void;
    onAssign?: (id: number | string) => void;
}

const ModernStatusBadge = React.memo<{ status: Calculation['status'] }>(({ status }) => {
    const config = {
        draft: { label: 'Черновик', color: 'bg-slate-400', ghost: 'bg-card text-foreground/60' },
        sent: { label: 'На проверке', color: 'bg-primary', ghost: 'bg-primary/10 text-primary' },
        changes: { label: 'Требуют правок', color: 'bg-orange-500', ghost: 'bg-orange-500/10 text-orange-600' },
        revision: { label: 'Правки внесены', color: 'bg-purple-500', ghost: 'bg-purple-500/10 text-purple-600' },
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
    onEdit,
    onAssign
}) => {
    const [newComment, setNewComment] = useState('');
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [showMoreMenu, setShowMoreMenu] = useState(false);
    const [messages, setMessages] = useState<Message[]>([]);
    const [loadingMessages, setLoadingMessages] = useState(false);
    const [previewImage, setPreviewImage] = useState<string | null>(null);
    const [pendingAttachments, setPendingAttachments] = useState<{ file: File, preview: string }[]>([]);
    const [isAuditMode, setIsAuditMode] = useState(false);
    const [auditItemIndex, setAuditItemIndex] = useState<number | null>(null);
    const [catalog, setCatalog] = useState<InventoryItemMaster[]>([]);
    const fileInputRef = React.useRef<HTMLInputElement>(null);
    const moreMenuRef = React.useRef<HTMLDivElement>(null);
    const { user } = useAuth();

    React.useEffect(() => {
        if (calculation.id) {
            loadMessages();
            if (user?.role === 'manager' || user?.role === 'admin') {
                inventoryService.getGlobalItems().then(setCatalog);
            }
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

    React.useEffect(() => {
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

    const loadMessages = async () => {
        try {
            setLoadingMessages(true);
            const data = await chatService.getCalculationMessages(calculation.id as string);
            setMessages(data);
        } catch (_error) {
            toast.error('Ошибка загрузки истории правок');
        } finally {
            setLoadingMessages(false);
        }
    };

    const handleClearChat = async () => {
        if (!calculation.id) return;

        const confirmed = window.confirm('Вы уверены, что хотите полностью очистить историю обсуждения этого проекта? Все сообщения и вложения будут удалены безвозвратно.');
        if (!confirmed) return;

        try {
            setLoadingMessages(true);
            await chatService.clearProjectHistory(String(calculation.id));
            setMessages([]);
            toast.success('История обсуждения очищена');
        } catch (_error) {
            toast.error('Не удалось очистить историю');
        } finally {
            setLoadingMessages(false);
        }
    };

    const exportToExcel = (calc: Calculation) => {
        if (!calc.results) return;
        const wb = XLSX.utils.book_new();
        const zoneData: (string | number)[][] = [];

        // Add Header/Requisites if it's an invoice stage
        if (calc.status === 'invoice') {
            zoneData.push(['СЧЕТ НА ОПЛАТУ', '', '', '']);
            zoneData.push(['Поставщик:', COMPANY_REQUISITES.name, '', '']);
            zoneData.push(['ИНН/КПП:', `${COMPANY_REQUISITES.inn}/${COMPANY_REQUISITES.kpp}`, '', '']);
            zoneData.push(['Банк:', COMPANY_REQUISITES.bank, '', '']);
            zoneData.push(['БИК:', COMPANY_REQUISITES.bik, '', '']);
            zoneData.push(['Р/С:', COMPANY_REQUISITES.account, '', '']);
            zoneData.push(['К/С:', COMPANY_REQUISITES.corrAccount, '', '']);
            zoneData.push(['', '', '', '']);
            zoneData.push(['Заказчик:', calc.organizationName, '', '']);
            zoneData.push(['', '', '', '']);
        }

        calc.results.byZone.forEach(zone => {
            zoneData.push([zone.zoneName.toUpperCase(), '', '', '']);
            if (isFinancialStage || user?.role !== 'client') {
                zoneData.push(['Инвентарь', 'Количество', 'Цена', 'Сумма']);
                zone.items.forEach(item => {
                    zoneData.push([item.inventory, `${item.quantity} шт`, `${item.price}₽`, `${item.total * item.price}₽`]);
                });
            } else {
                zoneData.push(['Инвентарь', 'Количество', 'Маркировка']);
                zone.items.forEach(item => {
                    zoneData.push([item.inventory, `${item.quantity} шт`, item.color]);
                });
            }
            zoneData.push(['', '', '', '']);
        });

        if (isFinancialStage) {
            zoneData.push(['', '', 'ИТОГО К ОПЛАТЕ:', `${totalCost.toLocaleString()} ₽`]);
        }

        const ws1 = XLSX.utils.aoa_to_sheet(zoneData);

        // Basic styling/width
        ws1['!cols'] = [{ wch: 40 }, { wch: 15 }, { wch: 15 }, { wch: 15 }];

        XLSX.utils.book_append_sheet(wb, ws1, calc.status === 'invoice' ? 'Счёт' : 'Спецификация');
        XLSX.writeFile(wb, `${calc.status === 'invoice' ? 'Счет' : 'Расчет'}_${calc.organizationName}.xlsx`);
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

    const handleProductSelect = async (master: InventoryItemMaster) => {
        if (auditItemIndex === null || !calculation.results) return;

        const newResults = JSON.parse(JSON.stringify(calculation.results));
        const oldItem = newResults.summary[auditItemIndex];

        // Update summary item
        newResults.summary[auditItemIndex] = {
            ...oldItem,
            inventory: master.name,
            sku: master.sku,
            price: master.price,
            supplier_id: master.supplier_id,
            stock: master.stock
        };

        // Propagate to byZone as well to keep data consistent
        newResults.byZone.forEach((zone: any) => {
            zone.items.forEach((item: any) => {
                if (item.inventory === oldItem.inventory && item.sku === oldItem.sku) {
                    item.inventory = master.name;
                    item.sku = master.sku;
                    item.price = master.price;
                    item.supplier_id = master.supplier_id;
                    item.stock = master.stock;
                }
            });
        });

        onUpdateStatus(calculation.id, calculation.status, { results: newResults });
        setAuditItemIndex(null);
        toast.success(`Товар заменен на ${master.name}`);
    };

    const totalCost = calculation.results?.summary.reduce((sum, item) => sum + (item.total * item.price), 0) || 0;
    const totalUnits = calculation.results?.summary.reduce((sum, item) => sum + item.total, 0) || 0;
    const isFinancialStage = ['invoice', 'paid', 'shipping', 'completed', 'closed'].includes(calculation.status);
    const canSeePrices = user?.role === 'manager' || user?.role === 'admin' || isFinancialStage;

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
                        <div className="flex items-center gap-4">
                            <button onClick={() => onEdit(calculation)} className="btn-premium-secondary">
                                <FileText className="w-5 h-5" /> Редактировать
                            </button>
                            <button onClick={() => onUpdateStatus(calculation.id, 'sent')} className="btn-premium">
                                <Send className="w-5 h-5" /> Отправить
                            </button>
                        </div>
                    )}
                    {user?.role === 'manager' && !calculation.manager_id && onAssign && (
                        <button
                            onClick={() => onAssign(calculation.id)}
                            className="btn-premium shadow-xl shadow-primary/20"
                        >
                            <Briefcase className="w-5 h-5" /> Принять проект
                        </button>
                    )}
                    {user?.role === 'manager' && calculation.manager_id && String(calculation.manager_id) === String(user.id) && (
                        <>
                            {['sent', 'revision'].includes(calculation.status) && (
                                <button
                                    onClick={() => onUpdateStatus(calculation.id, 'changes')}
                                    className="btn-premium-secondary !text-orange-500 !border-orange-500/20 hover:!bg-orange-500/5"
                                >
                                    <AlertCircle className="w-5 h-5" /> На правки
                                </button>
                            )}
                            {['sent', 'revision', 'changes'].includes(calculation.status) && (
                                <button
                                    onClick={() => onUpdateStatus(calculation.id, 'invoice')}
                                    className="btn-premium !bg-emerald-500 !border-none"
                                >
                                    <CheckCircle className="w-5 h-5" /> Выставить счет
                                </button>
                            )}
                            <button
                                onClick={() => setIsAuditMode(!isAuditMode)}
                                className={`btn-premium-secondary ${isAuditMode ? '!border-primary !text-primary' : ''}`}
                            >
                                <Briefcase className="w-5 h-5" /> {isAuditMode ? 'Выйти из аудита' : 'Аудит сметы'}
                            </button>
                        </>
                    )}
                </div>
            </div>

            {calculation.status === 'invoice' && (
                <div className="glass-card !bg-primary/5 border-primary/30 p-10 space-y-8 animate-in zoom-in duration-500">
                    <div className="flex items-center gap-6">
                        <div className="w-16 h-16 bg-primary text-white rounded-3xl flex items-center justify-center shadow-xl shadow-primary/20">
                            <CreditCard size={32} />
                        </div>
                        <div className="space-y-1">
                            <h3 className="text-2xl font-black tracking-tight">Реквизиты для оплаты</h3>
                            <p className="text-[10px] font-black text-foreground/40 uppercase tracking-widest italic">
                                Проект прошел аудит. Ожидаем оплату для запуска логистики.
                            </p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 bg-card/50 p-8 rounded-[2rem] border border-border-theme">
                        <div className="space-y-6">
                            {[
                                { label: 'Получатель', value: COMPANY_REQUISITES.name },
                                { label: 'ИНН', value: COMPANY_REQUISITES.inn },
                                { label: 'КПП', value: COMPANY_REQUISITES.kpp },
                                { label: 'Банк', value: COMPANY_REQUISITES.bank },
                            ].map((req, i) => (
                                <div key={i} className="flex justify-between items-center group/req">
                                    <div>
                                        <p className="text-[8px] font-black text-foreground/30 uppercase tracking-[0.2em] mb-1">{req.label}</p>
                                        <p className="text-[13px] font-black">{req.value}</p>
                                    </div>
                                    <button
                                        onClick={() => { navigator.clipboard.writeText(req.value); toast.success('Скопировано'); }}
                                        className="p-2 opacity-0 group-hover/req:opacity-100 hover:text-primary transition-all bg-transparent border-none cursor-pointer"
                                    >
                                        <Copy size={14} />
                                    </button>
                                </div>
                            ))}
                        </div>
                        <div className="space-y-6">
                            {[
                                { label: 'Бик', value: COMPANY_REQUISITES.bik },
                                { label: 'Р/С', value: COMPANY_REQUISITES.account },
                                { label: 'К/С', value: COMPANY_REQUISITES.corrAccount },
                                { label: 'Сумма счета', value: `${totalCost.toLocaleString()} ₽` },
                            ].map((req, i) => (
                                <div key={i} className="flex justify-between items-center group/req">
                                    <div>
                                        <p className="text-[8px] font-black text-foreground/30 uppercase tracking-[0.2em] mb-1">{req.label}</p>
                                        <p className={`text-[13px] font-black ${req.label === 'Сумма счета' ? 'text-primary' : ''}`}>{req.value}</p>
                                    </div>
                                    <button
                                        onClick={() => { navigator.clipboard.writeText(req.value); toast.success('Скопировано'); }}
                                        className="p-2 opacity-0 group-hover/req:opacity-100 hover:text-primary transition-all bg-transparent border-none cursor-pointer"
                                    >
                                        <Copy size={14} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>

                    <button onClick={() => window.print()} className="w-full btn-premium">
                        <Download className="w-5 h-5" /> Скачать счет (PDF)
                    </button>
                </div>
            )}

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
                                    {canSeePrices ? `${totalCost.toLocaleString()} ₽` : `${totalUnits.toLocaleString()} ед.`}
                                </div>
                            </div>
                            <div className="space-y-6">
                                {calculation.results.summary.map((item, i) => (
                                    <div key={i} className="relative group/audit">
                                        <CalculationBreakdown item={item} hidePrices={!canSeePrices} />
                                        {isAuditMode && (user?.role === 'manager' || user?.role === 'admin') && (
                                            <button
                                                onClick={() => setAuditItemIndex(i)}
                                                className="absolute top-8 right-8 z-20 px-4 py-2 bg-primary text-white text-[9px] font-black uppercase rounded-lg shadow-xl shadow-primary/30 hover:scale-105 active:scale-95 transition-all flex items-center gap-2"
                                            >
                                                Назначить товар
                                            </button>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                <div className="xl:col-span-4 space-y-8">
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
                                                    handleClearChat();
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
                                } catch (_error) {
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

            {auditItemIndex !== null && calculation.results && (
                <ProductPickerModal
                    isOpen={true}
                    onClose={() => setAuditItemIndex(null)}
                    onSelect={handleProductSelect}
                    catalog={catalog}
                    currentItem={calculation.results.summary[auditItemIndex]}
                />
            )}
        </div>
    );
});
