import React from 'react';
import { ChevronLeft, Send, FileText, Briefcase, Calendar, Trash2, MessageCircle } from 'lucide-react';
import { ModernStatusBadge } from '@/features/dashboard/components/ModernStatusBadge';
import { useNavigate } from 'react-router-dom';
import type { CalculationViewModel } from '@/features/dashboard/presentation/CalculationViewModel';
import type { User } from '@/features/auth/index.ts';
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
    onUpdateStatus: (
        id: string | number,
        status: CalculationStatus,
        additional?: Partial<Calculation>
    ) => void;
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
    setShowDeleteConfirm,
}) => {
    const navigate = useNavigate();

    const handleDirectChat = () => {
        if (!vm.managerId) return;
        navigate(`/dashboard/client?page=chat&contact=${vm.managerId}`);
    };

    return (
        <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-8 pb-6 border-b border-foreground/5">
            <div className="flex flex-col md:flex-row items-start md:items-center gap-6 lg:gap-8">
                {/* Advanced Back Button */}
                <button
                    onClick={onBack}
                    className="group relative flex items-center gap-2 px-3 sm:px-4 py-2.5 rounded-xl bg-foreground/[0.03] border border-foreground/10 hover:border-primary/50 hover:bg-primary/5 transition-all duration-300 active:scale-95 shadow-sm"
                    aria-label="Вернуться к списку проектов"
                >
                    <ChevronLeft className="w-5 h-5 text-foreground/40 group-hover:text-primary transition-colors group-hover:-translate-x-0.5" />
                    <span className="hidden sm:inline text-[10px] font-black uppercase tracking-widest text-foreground/40 group-hover:text-primary transition-colors">
                        Назад
                    </span>
                </button>

                <div className="space-y-3">
                    {/* Breadcrumbs / System Label */}
                    <div className="flex items-center gap-3">
                        <div className="px-2 py-0.5 rounded-md bg-primary/10 border border-primary/20">
                            <span className="text-[9px] font-black text-primary uppercase tracking-[0.2em]">
                                Проект {displayId && `ID-${String(displayId).padStart(3, '0')}`}
                            </span>
                        </div>
                        <div className="h-px w-8 bg-foreground/10" />
                        <span className="text-[9px] font-black text-foreground/20 uppercase tracking-[0.2em]">
                            Управление расчетами
                        </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-4 lg:gap-6">
                        <h1 className="text-3xl lg:text-4xl font-black tracking-tight text-foreground">
                            {vm.organizationName}
                        </h1>
                        <ModernStatusBadge status={vm.status} />
                    </div>

                    {/* Meta Data Row: High Fidelity */}
                    <div className="flex flex-wrap items-center gap-x-8 gap-y-3">
                        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-foreground/[0.02] border border-foreground/5">
                            <Calendar className="w-3.5 h-3.5 text-primary/60" />
                            <span className="text-[10px] font-black text-foreground/50 uppercase tracking-widest">
                                {formattedDate}
                            </span>
                        </div>
                        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-foreground/[0.02] border border-foreground/5">
                            <Briefcase className="w-3.5 h-3.5 text-primary/60" />
                            <span className="text-[10px] font-black text-foreground/50 uppercase tracking-widest">
                                {vm.managerName || 'Не назначен'}
                            </span>
                            {user?.role === 'client' && vm.managerId && (
                                <button
                                    onClick={handleDirectChat}
                                    className="ml-2 p-1.5 rounded-md bg-primary text-white hover:scale-105 active:scale-95 transition-all shadow-lg shadow-primary/20 flex items-center gap-1.5 border-none cursor-pointer"
                                    title="Написать менеджеру лично"
                                >
                                    <MessageCircle size={12} strokeWidth={3} />
                                    <span className="text-[9px] font-black uppercase tracking-tighter">Личный чат</span>
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                {/* Client Actions */}
                {user?.role !== 'manager' && (
                    <div className="flex items-center gap-3">
                        {entity.isEditableByClient() && (
                            <button
                                onClick={() => onEdit(calculation)}
                                className="btn-premium-secondary"
                            >
                                <FileText className="w-5 h-5" /> Редактировать
                            </button>
                        )}
                        {/* Client sends back after changes */}
                        {entity.isPendingClientChanges() && (
                            <button
                                onClick={() => onUpdateStatus(entity.id, 'revision')} // or 'sent' depending on workflow
                                className="btn-premium flex items-center gap-2"
                            >
                                <Send className="w-5 h-5" /> Исправлено, отправить
                            </button>
                        )}
                        {vm.status === 'draft' && (
                            <button
                                onClick={() => onUpdateStatus(entity.id, 'sent')}
                                className="btn-premium"
                            >
                                <Send className="w-5 h-5" /> Отправить расчет
                            </button>
                        )}
                    </div>
                )}

                {/* Admin/Delete Action */}
                {user?.role === 'admin' && (
                    <button
                        onClick={() => setShowDeleteConfirm(true)}
                        className="w-12 h-12 flex items-center justify-center rounded-xl bg-red-500/5 border border-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition-all shadow-sm"
                        title="Удалить расчет"
                    >
                        <Trash2 size={20} />
                    </button>
                )}
            </div>
        </div>
    );
};
