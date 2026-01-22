import React, { useMemo } from 'react';
import {
    Plus,
    ArrowRight,
    History,
    ChevronRight,
    Sparkles,
    Play,
    Building2,
    TrendingUp,
    Calculator,
} from 'lucide-react';
import { type Calculation } from '../../dashboard.types';
import { EmptyState } from '@/components/ui/EmptyState';
import { CardSkeleton } from '@/components/ui/Skeleton';
import { ModernStatusBadge } from '../../components/ModernStatusBadge';

import { CalculationEntity } from '@/core/domain/CalculationEntity';
import { CalculationViewModel } from '@/features/dashboard/presentation/CalculationViewModel';

interface ClientOverviewProps {
    calculations: Calculation[];
    onNewCalculation: () => void;
    onViewAllCalculations: () => void;
    onSelectCalculation: (calc: Calculation) => void;
    onCloneCalculation?: (calc: Calculation) => void;
    onBudgetPlanner?: () => void;
    isLoading?: boolean;
}

export const ClientOverview = React.memo<ClientOverviewProps>(
    ({
        calculations,
        onNewCalculation,
        onViewAllCalculations,
        onSelectCalculation,
        onCloneCalculation,
        onBudgetPlanner,
        isLoading = false,
    }) => {
        const recentVms = useMemo(() => {
            return calculations
                .slice()
                .sort(
                    (a, b) => new Date(b.createdDate).getTime() - new Date(a.createdDate).getTime()
                )
                .slice(0, 3)
                .map((c) => new CalculationViewModel(new CalculationEntity(c)));
        }, [calculations]);

        const stats = useMemo(() => {
            return {
                total: calculations.length,
                pending: calculations.filter((c) => c.status === 'sent' || c.status === 'expert')
                    .length,
                completed: calculations.filter(
                    (c) => c.status === 'completed' || c.status === 'closed'
                ).length,
                totalBudget: calculations.reduce((acc, c) => acc + (c.totalCost || 0), 0),
            };
        }, [calculations]);

        return (
            <div className="space-y-12 sm:space-y-16 animate-in fade-in slide-in-from-bottom-8 duration-1000">
                {/* Global Hero / Welcome */}
                <div className="relative overflow-hidden bg-foreground rounded-[3rem] p-8 sm:p-14 text-background shadow-2xl">
                    <div className="relative z-10 max-w-2xl space-y-6 sm:space-y-8">
                        <div className="inline-flex items-center gap-3 px-4 py-2 rounded-full bg-primary/20 border border-primary/20 text-primary animate-bounce-subtle">
                            <Sparkles size={16} />
                            <span className="text-[10px] font-black uppercase tracking-widest">
                                Premium Access
                            </span>
                        </div>
                        <h1 className="text-4xl sm:text-7xl font-black tracking-tighter leading-[0.9] uppercase italic">
                            Ваш бизнес <br />в деталях
                        </h1>
                        <p className="text-sm sm:text-base font-bold text-background/60 uppercase tracking-widest leading-relaxed max-w-md">
                            Профессиональный расчет снабжения и инвентаря для предприятий HoReCa.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4 pt-4 sm:pt-6">
                            <button
                                onClick={onNewCalculation}
                                className="btn-premium group !px-8 !py-5"
                            >
                                <Plus size={20} /> Создать расчет
                            </button>
                            <button
                                onClick={onBudgetPlanner}
                                className="px-8 py-5 rounded-2xl border border-background/10 hover:bg-background hover:text-foreground transition-all text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-3 group"
                            >
                                <Play size={16} className="group-hover:fill-current" /> Планировщик
                            </button>
                        </div>
                    </div>

                    {/* Background Accents */}
                    <div className="absolute top-0 right-0 w-1/3 h-full bg-gradient-to-l from-primary/10 to-transparent pointer-events-none" />
                    <div className="absolute -right-20 -bottom-20 w-80 h-80 bg-primary/20 rounded-full blur-[100px] pointer-events-none animate-pulse" />
                </div>

                {/* Quick Stats Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                    {[
                        {
                            label: 'Всего проектов',
                            value: stats.total,
                            icon: Building2,
                            color: 'text-blue-500',
                        },
                        {
                            label: 'Ожидают',
                            value: stats.pending,
                            icon: TrendingUp,
                            color: 'text-orange-500',
                        },
                        {
                            label: 'Завершено',
                            value: stats.completed,
                            icon: History,
                            color: 'text-green-500',
                        },
                        {
                            label: 'Проекты',
                            value: stats.totalBudget.toLocaleString() + ' ₽',
                            icon: Calculator,
                            color: 'text-primary',
                        },
                    ].map((stat, i) => (
                        <div
                            key={i}
                            className="glass-card p-6 sm:p-8 rounded-[2rem] flex flex-col justify-between gap-6 hover:border-primary/30 transition-all group"
                        >
                            <div className="w-12 h-12 rounded-2xl bg-foreground/5 flex items-center justify-center text-foreground group-hover:bg-primary group-hover:text-white transition-all">
                                <stat.icon size={24} />
                            </div>
                            <div className="space-y-1">
                                <p className="label-caps">{stat.label}</p>
                                <p className="text-2xl sm:text-3xl font-black tracking-tight">
                                    {stat.value}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Smart Reorder Block */}
                {recentVms.length > 0 && onCloneCalculation && (
                    <div className="relative overflow-hidden group glass-card p-8 sm:p-12 rounded-[3rem] border-primary/20 hover:border-primary/40 transition-all">
                        {/* Background Decoration */}
                        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 blur-[80px] rounded-full -mr-20 -mt-20 group-hover:bg-primary/10 transition-colors" />

                        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-8">
                            <div className="space-y-4">
                                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-[8px] font-black uppercase tracking-widest">
                                    <History size={12} /> Smart Reorder
                                </div>
                                <h3 className="text-2xl sm:text-4xl font-black tracking-tighter uppercase italic">
                                    Повторить последний <br className="hidden sm:block" /> расчет?
                                </h3>
                                <p className="text-[10px] sm:text-[11px] font-black text-foreground/40 uppercase tracking-[0.2em] leading-relaxed max-w-sm">
                                    Быстрое создание нового проекта на основе данных:{' '}
                                    <span className="text-primary">
                                        {recentVms[0].organizationName}
                                    </span>
                                </p>
                            </div>

                            <div className="flex flex-col sm:flex-row items-center gap-4">
                                <div className="text-right hidden sm:block">
                                    <p className="label-caps mb-1">Последний итог</p>
                                    <p className="text-2xl font-black text-foreground">
                                        {recentVms[0].totalCostDisplay}
                                    </p>
                                </div>
                                <button
                                    onClick={() => onCloneCalculation(recentVms[0].rawData)}
                                    className="btn-premium !px-10 !py-5 w-full sm:w-auto shadow-xl shadow-primary/20 group-hover:scale-105"
                                >
                                    Дублировать проект
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Recent Section */}
                <div className="space-y-8">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-2">
                        <div className="space-y-1">
                            <h2 className="text-2xl font-black uppercase tracking-tight">
                                Последние расчеты
                            </h2>
                            <p className="label-caps">Ваша недавняя активность</p>
                        </div>
                        <button
                            onClick={onViewAllCalculations}
                            className="flex items-center gap-2 text-[10px] font-black text-primary uppercase tracking-widest hover:gap-4 transition-all w-fit"
                        >
                            Смотреть все <ArrowRight size={14} />
                        </button>
                    </div>

                    <div className="grid grid-cols-1 gap-4">
                        {isLoading ? (
                            Array.from({ length: 3 }).map((_, i) => (
                                <CardSkeleton key={i} className="!max-w-none" />
                            ))
                        ) : recentVms.length > 0 ? (
                            recentVms.map((vm, index) => (
                                <div
                                    key={vm.id}
                                    onClick={() => onSelectCalculation(vm.rawData)}
                                    className="group glass-card p-6 sm:p-8 rounded-[2rem] sm:rounded-[2.5rem] hover:border-primary/40 transition-all flex flex-col lg:flex-row lg:items-center justify-between gap-6 cursor-pointer relative overflow-hidden"
                                >
                                    <div className="flex items-center gap-6 relative z-10">
                                        <div className="w-14 h-14 rounded-2xl bg-primary/10 flex flex-col items-center justify-center text-primary shrink-0 border border-primary/10">
                                            <History size={20} className="mb-0.5" />
                                            <span className="text-[8px] font-black opacity-60">
                                                #{String(index + 1).padStart(3, '0')}
                                            </span>
                                        </div>
                                        <div className="space-y-1 min-w-0">
                                            <div className="flex flex-wrap items-center gap-3">
                                                <h4 className="text-lg sm:text-xl font-black uppercase tracking-tight truncate max-w-[200px] sm:max-w-md">
                                                    {vm.organizationName}
                                                </h4>
                                                <ModernStatusBadge status={vm.status} />
                                            </div>
                                            <div className="flex items-center gap-4 label-caps">
                                                <span>{vm.formattedDate}</span>
                                                <span className="opacity-20">•</span>
                                                <span>{vm.totalArea} м²</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex flex-wrap items-center justify-between lg:justify-end gap-6 pt-6 lg:pt-0 border-t lg:border-t-0 border-border-theme/40 relative z-10">
                                        {vm.isPriceOutdated && (
                                            <div className="px-3 py-1.5 bg-amber-500/10 text-amber-500 rounded-xl text-[8px] font-black uppercase tracking-widest border border-amber-500/20">
                                                Обновить цены
                                            </div>
                                        )}
                                        {onCloneCalculation && (
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    onCloneCalculation(vm.rawData);
                                                }}
                                                className="px-5 py-2.5 bg-foreground/5 hover:bg-primary hover:text-white rounded-xl text-[9px] font-black uppercase tracking-widest transition-all"
                                            >
                                                Повторить
                                            </button>
                                        )}
                                        <div className="text-left lg:text-right">
                                            <p className="label-caps mb-1">Сумма</p>
                                            <p className="text-xl font-black tracking-tight text-primary">
                                                {vm.totalCostDisplay}
                                            </p>
                                        </div>
                                        <div className="w-12 h-12 rounded-2xl border border-border-theme flex items-center justify-center text-foreground/20 group-hover:bg-primary group-hover:border-primary group-hover:text-white transition-all shadow-sm">
                                            <ChevronRight size={20} />
                                        </div>
                                    </div>

                                    {/* Watermark for Card */}
                                    <div className="absolute right-0 top-1/2 -translate-y-1/2 text-[8rem] font-black text-foreground/[0.02] italic pointer-events-none group-hover:scale-110 transition-transform duration-1000">
                                        {index + 1}
                                    </div>
                                </div>
                            ))
                        ) : (
                            <EmptyState
                                type="data"
                                title="История пуста"
                                description="Вы еще не создали ни одного расчета инвентаря"
                                action={{
                                    label: 'Создать первый расчет',
                                    onClick: onNewCalculation,
                                }}
                            />
                        )}
                    </div>
                </div>
            </div>
        );
    }
);

ClientOverview.displayName = 'ClientOverview';
