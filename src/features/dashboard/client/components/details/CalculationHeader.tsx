import React from 'react';
import { 
    ChevronLeft, 
    Download, 
    Send, 
    RefreshCcw, 
    FileText, 
    Briefcase, 
    Calendar, 
    AlertCircle, 
    CheckCircle, 
    CheckCircle2, 
    Package, 
    Truck, 
    X, 
    Trash2 
} from 'lucide-react';
import { ModernStatusBadge } from '@/features/dashboard/components/ModernStatusBadge';
import type { CalculationViewModel } from '@/features/dashboard/presentation/CalculationViewModel';
import type { User } from '@/features/auth';
import type { Calculation, CalculationStatus } from '@/features/dashboard/dashboard.types';
import type { CalculationEntity } from '@/core/domain/CalculationEntity';

interface CalculationHeaderProps {
    vm: CalculationViewModel;
    entity: CalculationEntity;
    calculation: Calculation;
    user: User | null;
    displayId?: number;
    formattedDate: string;
    onBack: () => void;
    onDelete: (id: string | number) => void;
    onEdit: (calc: Calculation) => void;
    onUpdateStatus: (id: string | number, status: CalculationStatus, additional?: Partial<Calculation>) => void;
    onDownloadPDF: () => void;
    onAssign?: (id: string | number) => void;
    isAuditMode: boolean;
    setIsAuditMode: (val: boolean) => void;
    setShowDeleteConfirm: (val: boolean) => void;
}

export const CalculationHeader: React.FC<CalculationHeaderProps> = ({
    vm,
    entity,
    calculation,
    user,
    displayId,
    formattedDate,
    onBack,
    onEdit,
    onUpdateStatus,
    onDownloadPDF,
    onAssign,
    isAuditMode,
    setIsAuditMode,
    setShowDeleteConfirm,
}) => {
    return (
        <div className="flex flex-col xl:flex-row xl:items-center gap-10 justify-between">
            <div className="flex flex-wrap items-center gap-6">
                <button
                    onClick={onBack}
                    className="group w-14 h-14 rounded-2xl bg-card border border-border-theme flex items-center justify-center hover:border-primary transition-all active:scale-90 shadow-sm"
                >
                    <ChevronLeft className="w-6 h-6 text-foreground/40 group-hover:text-primary transition-colors" />
                </button>
                <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-3 sm:gap-4">
                        <h1 className="text-[clamp(1.5rem,4vw,2.5rem)]">
                            {displayId && (
                                <span className="text-foreground/30 mr-2 opacity-50 font-mono">
                                    #{String(displayId).padStart(3, '0')}
                                </span>
                            )}
                            {vm.organizationName}
                        </h1>
                        <ModernStatusBadge status={vm.status} />
                    </div>
                    <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-foreground/40 text-[10px] font-black uppercase tracking-[0.3em]">
                        <p className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-primary" /> {formattedDate}
                        </p>
                        <p className="flex items-center gap-2">
                            <Briefcase className="w-4 h-4 text-primary" /> {vm.manager}
                        </p>
                    </div>
                </div>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
                <button onClick={onDownloadPDF} className="btn-premium-secondary">
                    <Download className="w-5 h-5" />{' '}
                    {vm.status === 'invoice' ? 'Счет (PDF)' : 'Экспорт'}
                </button>
                {user?.role !== 'manager' && (
                    <div className="flex items-center gap-4">
                        {entity.isEditableByClient() && (
                            <button
                                onClick={() => onEdit(calculation)}
                                className="btn-premium-secondary"
                            >
                                <FileText className="w-5 h-5" /> Редактировать
                            </button>
                        )}
                        {vm.status === 'draft' && (
                            <button
                                onClick={() => onUpdateStatus(entity.id, 'sent')}
                                className="btn-premium"
                            >
                                <Send className="w-5 h-5" /> Отправить
                            </button>
                        )}
                        {vm.status === 'changes' && (
                            <button
                                onClick={() => onUpdateStatus(entity.id, 'revision')}
                                className="btn-premium"
                            >
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
                {(user?.role === 'manager' || user?.role === 'admin') &&
                    (user && entity.isAssignedTo(user.id) || user?.role === 'admin') && (
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
                                        <CheckCircle2 className="w-5 h-5" /> Подтвердить
                                        оплату
                                    </button>
                                    <button
                                        onClick={() => onUpdateStatus(entity.id, 'invoice')}
                                        className="btn-premium-secondary !text-red-500 !border-red-500/20 hover:!bg-red-500/5 px-4"
                                    >
                                        <X size={18} /> Оплата не принята
                                    </button>
                                </div>
                            )}
                            {vm.status === 'paid' && (
                                <button
                                    onClick={() => onUpdateStatus(entity.id, 'processing')}
                                    className="btn-premium !bg-blue-600 !border-none"
                                >
                                    <Package className="w-5 h-5" /> В комплектацию
                                </button>
                            )}
                            {vm.status === 'processing' && (
                                <button
                                    onClick={() => onUpdateStatus(entity.id, 'sent_to_warehouse')}
                                    className="btn-premium !bg-violet-600 !border-none"
                                >
                                    <Package className="w-5 h-5" /> Заказ отправлен
                                </button>
                            )}
                            {vm.status === 'sent_to_warehouse' && (
                                <button
                                    onClick={() => onUpdateStatus(entity.id, 'ready')}
                                    className="btn-premium !bg-green-600 !border-none"
                                >
                                    <Package className="w-5 h-5" /> Готов к отгрузке
                                </button>
                            )}
                            {vm.status === 'ready' && (
                                <button
                                    onClick={() => onUpdateStatus(entity.id, 'shipping')}
                                    className="btn-premium !bg-amber-600 !border-none"
                                >
                                    <Truck className="w-5 h-5" /> Доставить клиенту
                                </button>
                            )}
                            {vm.status === 'shipping' && (
                                <button
                                    onClick={() => onUpdateStatus(entity.id, 'completed')}
                                    className="btn-premium !bg-emerald-600 !border-none"
                                >
                                    <CheckCircle2 className="w-5 h-5" /> Доставлен клиенту
                                </button>
                            )}
                            <button
                                onClick={() => setIsAuditMode(!isAuditMode)}
                                className={`btn-premium-secondary ${isAuditMode ? '!border-primary !text-primary' : ''}`}
                            >
                                <Briefcase className="w-5 h-5" />{' '}
                                {isAuditMode ? 'Выйти из аудита' : 'Аудит сметы'}
                            </button>
                            <button
                                onClick={() => setShowDeleteConfirm(true)}
                                className="btn-premium-status !text-red-500 hover:!bg-red-500/10 border-red-500/20"
                                title="Удалить расчет"
                            >
                                <Trash2 size={18} />
                            </button>
                        </>
                    )}
            </div>
        </div>
    );
};
