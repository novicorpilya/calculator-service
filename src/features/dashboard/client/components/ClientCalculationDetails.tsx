import React, { useState, useMemo } from 'react';
import {
    ChevronLeft, Download, Send, Calendar,
    AlertCircle, CheckCircle, Trash2, AlertTriangle, Briefcase, FileText,
    CreditCard, Copy, Boxes, MapPin
} from 'lucide-react';
import { type Calculation, type CalculationStatus, type CalculationResults } from '../../dashboard.types';
import { CalculationEntity } from '@/core/domain/CalculationEntity';
import { CalculationViewModel } from '@/features/dashboard/presentation/CalculationViewModel';
import { toast } from 'sonner';
import { useAuth } from '@/features/auth';

// Components
import { ModernStatusBadge } from '../../components/ModernStatusBadge';
import { ProjectChatSection } from './ProjectChatSection';
import { CalculationBreakdown } from './CalculationBreakdown';
import { ProductPickerModal } from './ProductPickerModal';
import { exportToExcelWithPermissions } from '../../utils/excelExport';
import { useProjectChat } from '@/features/chat/hooks/useProjectChat';
import { useProductSelection } from '@/features/dashboard/hooks/useProductSelection';

// Hardcoded company requisites (as they were in the original file)
const COMPANY_REQUISITES = {
    name: "ООО «НОВИКОРП»",
    inn: "7720868200",
    kpp: "772001001",
    bank: "АО «ТИНЬКОФФ БАНК»",
    bik: "044525974",
    account: "40702810310001362623",
    corrAccount: "30101810145250000974"
};

interface ClientCalculationDetailsProps {
    calculation: Calculation;
    onBack: () => void;
    onUpdateStatus: (id: number | string, status: CalculationStatus, additional?: { results?: CalculationResults }) => void;
    onDelete: (id: number | string) => void;
    onEdit: (calc: Calculation) => void;
    onAssign?: (id: number | string) => void;
    displayId?: number;
}

export const ClientCalculationDetails = React.memo<ClientCalculationDetailsProps>(({
    calculation,
    onBack,
    onUpdateStatus,
    onDelete,
    onEdit,
    onAssign,
    displayId
}) => {
    const { user } = useAuth();
    // Removed useServices as it's now handled in useProductSelection

    // Initialize Domain Entity and VM
    const entity = useMemo(() => new CalculationEntity(calculation), [calculation]);
    const vm = useMemo(() => new CalculationViewModel(entity), [entity]);

    const formattedDate = vm.formattedDate;

    // Use Entity business logic for totals and permissions
    const isFinancialStage = ['invoice', 'paid', 'shipping', 'completed', 'closed'].includes(entity.status);
    const canSeePrices = user?.role === 'manager' || user?.role === 'admin' || isFinancialStage;

    // Metrics
    const totalCost = entity.totalCost;
    const totalUnits = entity.totalItems;

    // Custom Hooks
    const { messages, loadingMessages, clearHistory, sendMessage } = useProjectChat(entity, user);
    const {
        isAuditMode,
        setIsAuditMode,
        auditItemIndex,
        setAuditItemIndex,
        catalog,
        handleProductSelect
    } = useProductSelection({ user, entity, onUpdateStatus });

    // Local State
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);


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
                                Это действие безвозвратно удалит все данные расчета «{entity.organizationName}»
                            </p>
                        </div>
                        <div className="flex flex-col gap-3">
                            <button onClick={() => onDelete(entity.id)} className="btn-premium !bg-red-500 !text-white border-none">
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
                            <h1 className="text-[clamp(1.5rem,4vw,2.5rem)]">
                                {displayId && <span className="text-foreground/30 mr-2 opacity-50 font-mono">#{String(displayId).padStart(3, '0')}</span>}
                                {entity.organizationName}
                            </h1>
                            <ModernStatusBadge status={entity.status} />
                        </div>
                        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-foreground/40 text-[10px] font-black uppercase tracking-[0.3em]">
                            <p className="flex items-center gap-2">
                                <Calendar className="w-4 h-4 text-primary" /> {formattedDate}
                            </p>
                            <p className="flex items-center gap-2">
                                <Briefcase className="w-4 h-4 text-primary" /> {entity.manager}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
                    {user?.role !== 'manager' && (
                        <button onClick={() => exportToExcelWithPermissions(entity, canSeePrices)} className="btn-premium-secondary">
                            <Download className="w-5 h-5" /> Спецификация
                        </button>
                    )}
                    {user?.role !== 'manager' && entity.isEditableByClient() && (
                        <div className="flex items-center gap-4">
                            <button onClick={() => onEdit(calculation)} className="btn-premium-secondary">
                                <FileText className="w-5 h-5" /> Редактировать
                            </button>
                            <button onClick={() => onUpdateStatus(entity.id, 'sent')} className="btn-premium">
                                <Send className="w-5 h-5" /> Отправить
                            </button>
                        </div>
                    )}
                    {user?.role === 'manager' && entity.canBeAssigned() && onAssign && (
                        <button
                            onClick={() => onAssign(entity.id)}
                            className="btn-premium shadow-xl shadow-primary/20"
                        >
                            <Briefcase className="w-5 h-5" /> Принять проект
                        </button>
                    )}
                    {user?.role === 'manager' && entity.isAssignedTo(user.id) && (
                        <>
                            {entity.canRequestChanges() && (
                                <button
                                    onClick={() => onUpdateStatus(entity.id, 'changes')}
                                    className="btn-premium-secondary !text-orange-500 !border-orange-500/20 hover:!bg-orange-500/5"
                                >
                                    <AlertCircle className="w-5 h-5" /> На правки
                                </button>
                            )}
                            {entity.canMoveToInvoice() && (
                                <button
                                    onClick={() => onUpdateStatus(entity.id, 'invoice')}
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

            {entity.isInvoiced() && (
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
                            { label: 'Зоны', value: entity.zonesCount, icon: Boxes, color: 'text-indigo-500', bg: 'bg-indigo-500/5' },
                            { label: 'Площадь', value: `${entity.totalArea} м²`, icon: MapPin, color: 'text-blue-500', bg: 'bg-blue-500/5' },
                            { label: 'Тип объекта', value: entity.type || 'Ресторан', icon: FileText, color: 'text-emerald-500', bg: 'bg-emerald-500/5' },
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

                    {entity.results && (
                        <div className="space-y-8">
                            <div className="flex items-center justify-between ml-2">
                                <h3 className="text-xs font-black text-foreground/50 uppercase tracking-[0.3em]">Спецификация инвентаря</h3>
                                <div className="px-6 py-2.5 bg-primary/10 border border-primary/20 rounded-full text-primary text-[10px] font-black uppercase tracking-widest">
                                    {canSeePrices ? `${totalCost.toLocaleString()} ₽` : `${totalUnits.toLocaleString()} ед.`}
                                </div>
                            </div>
                            <div className="space-y-6">
                                {entity.results.summary.map((item, i) => (
                                    <div key={i} className="relative group/audit">
                                        <CalculationBreakdown
                                            item={item}
                                            hidePrices={!canSeePrices}
                                        />
                                        {isAuditMode && user?.role === 'manager' && (entity.status !== 'completed' && entity.status !== 'closed') && (
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

                            {/* Zone Visualization (Read Only) */}
                            {entity.results.byZone && (
                                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 delay-300">
                                    <h3 className="text-xs font-black uppercase tracking-[0.3em] pl-1 opacity-40">Детализация по зонам</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {entity.byZone.map((zone, i) => (
                                            <div key={i} className="glass-card !p-6 relative group overflow-hidden">
                                                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                                                    <div className="w-16 h-16 rounded-full" style={{ backgroundColor: zone.color }}></div>
                                                </div>
                                                <h4 className="font-bold text-lg mb-1">{zone.zoneName}</h4>
                                                <div className="text-[10px] uppercase tracking-widest opacity-50 mb-4">{zone.type}</div>
                                                <div className="space-y-2">
                                                    {zone.items.slice(0, 3).map((item: any, j: number) => (
                                                        <div key={j} className="flex items-center justify-between text-xs py-1 border-b border-white/5 last:border-0">
                                                            <span className="opacity-80 truncate pr-4">{item.inventory}</span>
                                                            <span className="font-mono opacity-50 whitespace-nowrap">{item.quantity} шт</span>
                                                        </div>
                                                    ))}
                                                    {zone.items.length > 3 && (
                                                        <div className="text-[10px] text-primary pt-2 font-bold uppercase tracking-widest opacity-80 group-hover:opacity-100 transition-opacity">
                                                            + еще {zone.items.length - 3} позиций
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                <div className="xl:col-span-4 space-y-8">
                    <ProjectChatSection
                        messages={messages}
                        loadingMessages={loadingMessages}
                        user={user}
                        onSendMessage={sendMessage}
                        onClearHistory={clearHistory}
                    />
                </div>
            </div>

            {auditItemIndex !== null && entity.results && (
                <ProductPickerModal
                    isOpen={true}
                    onClose={() => setAuditItemIndex(null)}
                    onSelect={handleProductSelect}
                    catalog={catalog}
                    currentItem={entity.results.summary[auditItemIndex]}
                />
            )}
        </div>
    );
});
