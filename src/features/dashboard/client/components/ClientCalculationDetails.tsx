import React, { useState, useMemo } from 'react';
import { useServices } from '@/core/di/ServiceContainer';
import { logger } from '@/app/services';
import {
    ChevronLeft, Download, Send, Calendar,
    AlertCircle, CheckCircle, Trash2, AlertTriangle, Briefcase, FileText,
    CreditCard, Boxes, MapPin, CheckCircle2, Package, Clock,
    Search, MessageSquare, Calculator, Plus, Settings, RefreshCcw, X
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
import { useProjectChat } from '@/features/chat/hooks/useProjectChat';
import { useProductSelection } from '@/features/dashboard/hooks/useProductSelection';
import { generateInvoicePDF } from '../../utils/pdfInvoiceGenerator';
import { PaymentStatusView } from './PaymentStatusView';

interface ClientCalculationDetailsProps {
    calculation: Calculation;
    onBack: () => void;
    onUpdateStatus: (id: number | string, status: CalculationStatus, additional?: Partial<Calculation>) => void;
    onDelete: (id: number | string) => void;
    onEdit: (calc: Calculation) => void;
    onAssign?: (id: number | string) => void;
    onAdjustExpert?: (id: string | number, results: CalculationResults, adjustments: any, version: number) => Promise<void>;
    displayId?: number;
}

export const ClientCalculationDetails = React.memo<ClientCalculationDetailsProps>(({
    calculation,
    onBack,
    onUpdateStatus,
    onDelete,
    onEdit,
    onAssign,
    onAdjustExpert,
    displayId
}) => {
    const { user } = useAuth();
    const { calculationService } = useServices();

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
    const { messages, loadingMessages, clearHistory, sendMessage, resendMessage } = useProjectChat(entity, user);
    const {
        isAuditMode,
        setIsAuditMode,
        auditItemIndex,
        setAuditItemIndex,
        catalog,
        handleProductSelect,
        handleAddItem,
        handleRemoveItem,
        handleUpdateAdjustments
    } = useProductSelection({ user, entity, onUpdateStatus, onAdjustExpert });

    // Local State
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    const handleDownloadPDF = () => {
        try {
            generateInvoicePDF(entity);
            toast.success('Счет сформирован (PDF)');
        } catch (error) {
            logger.error('PDF Error', { error });
            toast.error('Ошибка генерации PDF');
        }
    };

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
                    <button onClick={handleDownloadPDF} className="btn-premium-secondary">
                        <Download className="w-5 h-5" /> {entity.status === 'invoice' ? 'Счет (PDF)' : 'Экспорт'}
                    </button>
                    {user?.role !== 'manager' && (
                        <div className="flex items-center gap-4">
                            {entity.isEditableByClient() && (
                                <button onClick={() => onEdit(calculation)} className="btn-premium-secondary">
                                    <FileText className="w-5 h-5" /> Редактировать
                                </button>
                            )}
                            {entity.status === 'draft' && (
                                <button onClick={() => onUpdateStatus(entity.id, 'sent')} className="btn-premium">
                                    <Send className="w-5 h-5" /> Отправить
                                </button>
                            )}
                            {entity.status === 'changes' && (
                                <button onClick={() => onUpdateStatus(entity.id, 'revision')} className="btn-premium">
                                    <RefreshCcw className="w-5 h-5" /> Правки внесены
                                </button>
                            )}
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
                    {(user?.role === 'manager' || user?.role === 'admin') && (entity.isAssignedTo(user.id) || user?.role === 'admin') && (
                        <>
                            {entity.canRequestChanges() && (
                                <button
                                    onClick={() => onUpdateStatus(entity.id, 'changes')}
                                    className="btn-premium-secondary !text-orange-500 !border-orange-500/20 hover:!bg-orange-500/5"
                                >
                                    <AlertCircle className="w-5 h-5" /> Требуют правок
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
                            {entity.isPaymentSent() && (
                                <div className="flex items-center gap-3">
                                    <button
                                        onClick={() => onUpdateStatus(entity.id, 'paid')}
                                        className="btn-premium !bg-emerald-600 !border-none"
                                    >
                                        <CheckCircle2 className="w-5 h-5" /> Подтвердить оплату
                                    </button>
                                    <button
                                        onClick={() => onUpdateStatus(entity.id, 'invoice')}
                                        className="btn-premium-secondary !text-red-500 !border-red-500/20 hover:!bg-red-500/5 px-4"
                                    >
                                        <X size={18} /> Оплата не принята
                                    </button>
                                </div>
                            )}
                            {entity.status === 'paid' && (
                                <button
                                    onClick={() => onUpdateStatus(entity.id, 'processing')}
                                    className="btn-premium !bg-blue-600 !border-none"
                                >
                                    <Package className="w-5 h-5" /> В комплектацию
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

            {(entity.canSubmitPayment() || entity.isPaymentSent() || (entity.isPaid() && calculation.receipt_path)) && (
                <PaymentStatusView
                    calculation={calculation}
                    userRole={user?.role as any}
                    onUploadReceipt={async (file) => {
                        const filePath = await calculationService.uploadReceipt(entity.id, file, entity.userId || user?.id || '');
                        await onUpdateStatus(entity.id, 'payment_review', {
                            receipt_path: filePath
                        } as any);
                    }}
                    onContactManager={() => {
                        // Switch to chat tab in ProjectChatSection
                        toast.info('Откройте раздел "Обсуждение" ниже');
                    }}
                />
            )}

            {/* Expertise Info Section */}
            {(entity.status === 'expert' || entity.status === 'revision') && (
                <div className="glass-card !bg-indigo-500/5 border-indigo-500/30 p-10 space-y-8 animate-in fade-in zoom-in duration-500">
                    <div className="flex items-center gap-6">
                        <div className="w-16 h-16 bg-indigo-500 text-white rounded-3xl flex items-center justify-center shadow-xl shadow-indigo-500/20">
                            <Search size={32} />
                        </div>
                        <div className="space-y-1">
                            <h3 className="text-2xl font-black tracking-tight">Проводится экспертиза</h3>
                            <p className="text-[10px] font-black text-foreground/40 uppercase tracking-widest italic">
                                Менеджер детально изучает проект и готовит финальное предложение.
                            </p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {[
                            { icon: Search, title: 'Аудит требований', desc: 'Проверка данных и анализ специфики объекта.' },
                            { icon: MessageSquare, title: 'Коммуникация', desc: 'Уточнение нюансов в рабочем чате.' },
                            { icon: Calculator, title: 'Корректировка', desc: 'Ручная настройка коэффициентов и оптимизация.' },
                            { icon: CreditCard, title: 'Формирование', desc: 'Подготовка финальных документов и счета.' }
                        ].map((item, i) => (
                            <div key={i} className="bg-card/40 p-6 rounded-[1.5rem] border border-border-theme space-y-3">
                                <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                                    <item.icon size={20} />
                                </div>
                                <div className="space-y-1">
                                    <h4 className="text-[11px] font-black uppercase tracking-wider">{item.title}</h4>
                                    <p className="text-[10px] text-foreground/50 leading-relaxed">{item.desc}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Pricing Management Panel - Visible only in Audit Mode for Managers */}
            {isAuditMode && (user?.role === 'manager' || user?.role === 'admin') && (
                <div className="glass-card !bg-card p-10 border-primary/20 space-y-8 shadow-2xl animate-in slide-in-from-top-4 duration-500">
                    <div className="flex items-center gap-4 mb-2">
                        <div className="p-3 bg-primary/10 text-primary rounded-2xl">
                            <Settings size={24} />
                        </div>
                        <h3 className="text-xl font-black uppercase tracking-tight">Панель управления ценообразованием</h3>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <div className="space-y-3">
                            <label className="text-[10px] font-black uppercase tracking-widest text-foreground/40 pl-1">Глобальная наценка (коэф.)</label>
                            <input
                                type="number"
                                step="0.01"
                                defaultValue={entity.managerAdjustments?.global_margin || 1.0}
                                onBlur={(e) => handleUpdateAdjustments({ ...entity.managerAdjustments, global_margin: parseFloat(e.target.value) || 1.0 })}
                                onKeyDown={(e) => e.key === 'Enter' && (e.target as HTMLInputElement).blur()}
                                className="w-full bg-background border border-border-theme p-4 rounded-2xl font-black focus:border-primary outline-none transition-all"
                            />
                            <p className="text-[9px] text-foreground/30 italic">Пример: 1.1 = +10% к сумме товаров</p>
                        </div>

                        <div className="space-y-3">
                            <label className="text-[10px] font-black uppercase tracking-widest text-foreground/40 pl-1">Доставка (₽)</label>
                            <input
                                type="number"
                                defaultValue={entity.managerAdjustments?.delivery_cost || 0}
                                onBlur={(e) => handleUpdateAdjustments({ ...entity.managerAdjustments, delivery_cost: parseFloat(e.target.value) || 0 })}
                                onKeyDown={(e) => e.key === 'Enter' && (e.target as HTMLInputElement).blur()}
                                className="w-full bg-background border border-border-theme p-4 rounded-2xl font-black focus:border-primary outline-none transition-all"
                            />
                            <p className="text-[9px] text-foreground/30 italic">Фиксированная стоимость логистики</p>
                        </div>

                        <div className="space-y-3">
                            <label className="text-[10px] font-black uppercase tracking-widest text-foreground/40 pl-1">Доп. услуги / Сборка (₽)</label>
                            <input
                                type="number"
                                defaultValue={entity.managerAdjustments?.service_cost || 0}
                                onBlur={(e) => handleUpdateAdjustments({ ...entity.managerAdjustments, service_cost: parseFloat(e.target.value) || 0 })}
                                onKeyDown={(e) => e.key === 'Enter' && (e.target as HTMLInputElement).blur()}
                                className="w-full bg-background border border-border-theme p-4 rounded-2xl font-black focus:border-primary outline-none transition-all"
                            />
                            <p className="text-[9px] text-foreground/30 italic">Монтаж, занос или другие услуги</p>
                        </div>
                    </div>

                    <div className="space-y-3">
                        <label className="text-[10px] font-black uppercase tracking-widest text-foreground/40 pl-1">Специальные требования и примечания</label>
                        <textarea
                            defaultValue={entity.managerAdjustments?.notes || ''}
                            onBlur={(e) => handleUpdateAdjustments({ ...entity.managerAdjustments, notes: e.target.value })}
                            className="w-full bg-background border border-border-theme p-6 rounded-[2rem] text-sm focus:border-primary outline-none transition-all min-h-[120px] resize-none"
                            placeholder="Особенности объекта, температурные режимы, требования HACCP..."
                        />
                    </div>
                </div>
            )}

            {entity.isPaymentSent() && user?.role !== 'manager' && (
                <div className="glass-card !bg-yellow-500/5 border-yellow-500/30 p-10 mb-8 space-y-4 animate-in fade-in duration-500">
                    <div className="flex items-center gap-6">
                        <div className="w-16 h-16 bg-yellow-500 text-white rounded-3xl flex items-center justify-center">
                            <Clock size={32} />
                        </div>
                        <div className="space-y-1">
                            <h3 className="text-2xl font-black tracking-tight">Оплата проверяется</h3>
                            <p className="text-[10px] font-black text-foreground/40 uppercase tracking-widest italic">
                                Менеджер подтвердит получение средств в течение рабочего дня.
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {entity.isProcessing() && (
                <div className="glass-card !bg-blue-500/5 border-blue-500/30 p-10 mb-8 space-y-4 animate-in fade-in duration-500">
                    <div className="flex items-center gap-6">
                        <div className="w-16 h-16 bg-blue-500 text-white rounded-3xl flex items-center justify-center">
                            <Package size={32} />
                        </div>
                        <div className="space-y-1">
                            <h3 className="text-2xl font-black tracking-tight">Комплектация заказа</h3>
                            <p className="text-[10px] font-black text-foreground/40 uppercase tracking-widest italic">
                                Мы готовим ваши товары к отгрузке. Следите за обновлениями в чате.
                            </p>
                        </div>
                    </div>
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
                                        <CalculationBreakdown item={item} hidePrices={!canSeePrices} />
                                        {isAuditMode && (user?.role === 'manager' || user?.role === 'admin') && (entity.status !== 'completed' && entity.status !== 'closed') && (
                                            <div className="absolute top-8 right-8 z-[60] flex gap-2 pointer-events-auto">
                                                <button
                                                    onClick={() => setAuditItemIndex(i)}
                                                    className="px-4 py-2 bg-primary text-white text-[9px] font-black uppercase rounded-lg shadow-xl shadow-primary/30 hover:scale-105 active:scale-95 transition-all flex items-center gap-2"
                                                >
                                                    <RefreshCcw size={12} /> Заменить
                                                </button>
                                                <button
                                                    onClick={() => handleRemoveItem(i)}
                                                    className="p-2 bg-red-500 text-white rounded-lg shadow-xl shadow-red-500/30 hover:scale-105 active:scale-95 transition-all"
                                                >
                                                    <Trash2 size={12} />
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                ))}

                                {isAuditMode && (user?.role === 'manager' || user?.role === 'admin') && (
                                    <button
                                        onClick={() => setAuditItemIndex(-1)}
                                        className="w-full py-8 border-2 border-dashed border-primary/20 rounded-[2rem] text-primary/40 hover:text-primary hover:border-primary/40 hover:bg-primary/5 transition-all flex flex-col items-center justify-center gap-3 group/add"
                                    >
                                        <div className="p-4 bg-primary/5 rounded-full group-hover/add:scale-110 transition-transform">
                                            <Plus size={32} />
                                        </div>
                                        <span className="text-[10px] font-black uppercase tracking-[0.3em]">Добавить позицию в расчет</span>
                                    </button>
                                )}
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
                        onResendMessage={resendMessage}
                    />
                </div>
            </div>

            {auditItemIndex !== null && entity.results && (
                <ProductPickerModal
                    isOpen={true}
                    onClose={() => setAuditItemIndex(null)}
                    onSelect={(master) => {
                        if (auditItemIndex === -1) {
                            handleAddItem(master);
                        } else {
                            handleProductSelect(master);
                        }
                    }}
                    catalog={catalog}
                    currentItem={auditItemIndex === -1 ? undefined : entity.results.summary[auditItemIndex]}
                />
            )}
        </div>
    );
});
