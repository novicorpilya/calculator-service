import React, { useMemo } from 'react';
import { Plus, Briefcase, MessageSquare, ChevronRight } from 'lucide-react';
import { EmptyState } from '@/components/ui/EmptyState';
import { CardSkeleton } from '@/components/ui/Skeleton';
import { useAuth } from '@/features/auth';
import { useUnreadCount } from '@/features/chat/hooks';
import { type Calculation, OBJECT_TYPES } from '../../dashboard.types';
import { CalculationEntity } from '@/core/domain/CalculationEntity';
import { CalculationViewModel } from '@/features/dashboard/presentation/CalculationViewModel';
import { ModernStatusBadge } from '../../components/ModernStatusBadge';

interface ClientCalculationsListProps {
    calculations: Calculation[];
    onSelect: (calc: Calculation) => void;
    onNewCalculation: () => void;
    onClone?: (calc: Calculation) => void;
    isLoading?: boolean;
}

export const ClientCalculationsList = React.memo<ClientCalculationsListProps>(
    ({ calculations, onSelect, onNewCalculation, onClone, isLoading = false }) => {
        // Auth context for unread count
        const { user } = useAuth();
        const { projectCounts } = useUnreadCount(user?.id);

        // Convert DTOs to VMs
        const viewModels = useMemo(
            () => calculations.map((c) => new CalculationViewModel(new CalculationEntity(c))),
            [calculations]
        );

        return (
            <div className="space-y-[clamp(2rem,8vh,5rem)] animate-in fade-in slide-in-from-bottom-8 duration-1000">
                {/* Header Section - Fluid Flex */}
                <div className="flex flex-wrap items-end justify-between gap-8">
                    <div className="space-y-4 max-w-2xl">
                        <h1 className="text-[clamp(2rem,6vw,4rem)]">Мои проекты</h1>
                        <p className="text-foreground/70 font-bold leading-relaxed uppercase text-[10px] sm:text-xs tracking-widest border-l-4 border-primary pl-4 sm:pl-6">
                            Интеллектуальное управление HoReCa инвентарем
                        </p>
                    </div>
                    <button onClick={onNewCalculation} className="btn-premium w-full sm:w-auto">
                        <Plus className="w-5 h-5" /> Новый проект
                    </button>
                </div>

                {/* Main Content Area */}
                {isLoading ? (
                    <div className="grid grid-cols-1 sm:grid-cols-[repeat(auto-fit,minmax(min(100%,320px),1fr))] gap-4 sm:gap-6 lg:gap-8">
                        {Array.from({ length: 6 }).map((_, i) => (
                            <CardSkeleton key={i} />
                        ))}
                    </div>
                ) : viewModels.length === 0 ? (
                    <EmptyState
                        type="projects"
                        title="Проекты не найдены"
                        description="Начните с создания первого проекта для расчета инвентаря"
                        action={{
                            label: 'Создать расчет',
                            onClick: onNewCalculation,
                        }}
                    />
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-[repeat(auto-fit,minmax(min(100%,320px),1fr))] gap-4 sm:gap-6 lg:gap-8">
                        {viewModels.map((vm, index) => {
                            const unreadCount = projectCounts[String(vm.id)] || 0;
                            return (
                                <div
                                    key={vm.id}
                                    onClick={() => onSelect(vm.rawData)}
                                    className={`
                                        relative glass-card p-6 sm:p-8 rounded-[2.5rem] sm:rounded-[3rem] cursor-pointer overflow-hidden transition-all duration-500
                                        hover:-translate-y-2 hover:shadow-2xl group
                                        ${
                                            unreadCount > 0
                                                ? 'border-primary ring-2 ring-primary/20 shadow-brand-glow bg-primary/[0.02]'
                                                : 'border-border-theme/60'
                                        }
                                        flex flex-col justify-between h-full min-h-[400px]
                                    `}
                                    style={{ animationDelay: `${index * 50}ms` }}
                                >
                                    {/* Project ID Watermark */}
                                    <div className="absolute -right-2 top-0 text-[7rem] font-black text-foreground/[0.03] select-none pointer-events-none italic leading-none transition-transform duration-1000 group-hover:scale-110 group-hover:-translate-x-4">
                                        {String(index + 1).padStart(3, '0')}
                                    </div>

                                    {/* Header Section: Manager & Badges */}
                                    <div className="relative z-10 flex items-center justify-between gap-4 mb-8">
                                        {vm.managerName ? (
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center border border-primary/20">
                                                    <Briefcase className="w-5 h-5 text-primary" />
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="text-[8px] font-black text-foreground/40 uppercase tracking-[0.2em]">
                                                        Куратор
                                                    </span>
                                                    <span className="text-[11px] font-black uppercase tracking-widest text-foreground/80 group-hover:text-primary transition-colors">
                                                        {vm.managerName}
                                                    </span>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="flex items-center gap-3 opacity-40">
                                                <div className="w-10 h-10 rounded-2xl bg-foreground/5 flex items-center justify-center">
                                                    <Briefcase className="w-5 h-5" />
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="text-[8px] font-black uppercase tracking-[0.2em]">
                                                        Статус
                                                    </span>
                                                    <span className="text-[11px] font-black uppercase tracking-widest text-foreground/60">
                                                        Ожидание
                                                    </span>
                                                </div>
                                            </div>
                                        )}

                                        {unreadCount > 0 && (
                                            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-primary text-white text-[10px] font-black uppercase tracking-widest shadow-xl shadow-primary/20 animate-bounce-subtle">
                                                <MessageSquare className="w-3.5 h-3.5" />
                                                {unreadCount}
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex-1 space-y-8 w-full relative z-10">
                                        <div className="space-y-4">
                                            <div className="flex flex-wrap items-center gap-3">
                                                <span className="text-[9px] font-black text-primary uppercase tracking-[0.2em] bg-primary/5 px-4 py-1.5 rounded-xl border border-primary/10">
                                                    {OBJECT_TYPES.find((t) => t.value === vm.type)
                                                        ?.label || 'Объект'}
                                                </span>
                                                {vm.isPriceOutdated && (
                                                    <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/10 text-amber-500 text-[9px] font-black uppercase tracking-widest border border-amber-500/10">
                                                        OLD PRICES
                                                    </span>
                                                )}
                                            </div>
                                            <h3 className="text-xl sm:text-2xl font-black tracking-tighter leading-[1.1] group-hover:text-primary transition-colors duration-300 line-clamp-2">
                                                {vm.organizationName}
                                            </h3>
                                        </div>

                                        <div className="grid gap-4 sm:gap-6 py-6 sm:py-8 border-y border-border-theme/40 grid-cols-2 lg:grid-cols-3">
                                            <div className="space-y-1">
                                                <p className="text-[9px] font-black text-foreground/50 uppercase tracking-[0.2em]">
                                                    Площадь
                                                </p>
                                                <p className="text-base font-black flex items-center gap-1">
                                                    {vm.totalArea}
                                                    <span className="text-[10px] text-foreground/40 font-bold uppercase">
                                                        м²
                                                    </span>
                                                </p>
                                            </div>
                                            <div className="space-y-1">
                                                <p className="text-[9px] font-black text-foreground/50 uppercase tracking-[0.2em]">
                                                    Зоны
                                                </p>
                                                <p className="text-base font-black">
                                                    {vm.zonesCount}
                                                </p>
                                            </div>
                                            <div className="col-span-2 lg:col-span-1 space-y-1">
                                                <p className="text-[9px] font-black text-foreground/50 uppercase tracking-[0.2em]">
                                                    Бюджет
                                                </p>
                                                <p className="text-base font-black text-primary">
                                                    {vm.totalCostDisplay}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
                                            <div className="flex flex-col gap-1.5">
                                                <span className="text-[8px] font-black text-foreground/40 uppercase tracking-[0.3em]">
                                                    Статус
                                                </span>
                                                <ModernStatusBadge status={vm.status} />
                                            </div>

                                            <div className="flex items-center gap-4">
                                                <div className="flex flex-col items-end">
                                                    <span className="text-[8px] font-black text-foreground/40 uppercase tracking-[0.3em]">
                                                        Дата
                                                    </span>
                                                    <span className="text-[10px] font-black uppercase tracking-widest text-foreground/60">
                                                        {vm.formattedDate}
                                                    </span>
                                                </div>

                                                {onClone && (
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            onClone(vm.rawData);
                                                        }}
                                                        className="w-10 h-10 rounded-xl bg-card border border-border-theme flex items-center justify-center text-foreground/40 hover:text-primary hover:border-primary transition-all shadow-sm"
                                                        aria-label="Копировать проект"
                                                    >
                                                        <Plus className="w-5 h-5" />
                                                    </button>
                                                )}

                                                <div className="w-10 h-10 rounded-xl border border-border-theme flex items-center justify-center text-foreground/40 group-hover:bg-primary group-hover:border-primary group-hover:text-white transition-all shadow-sm shrink-0">
                                                    <ChevronRight size={20} />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        );
    }
);

ClientCalculationsList.displayName = 'ClientCalculationsList';
