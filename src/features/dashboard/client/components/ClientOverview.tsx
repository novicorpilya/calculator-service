import React, { useMemo } from 'react';
import {
    Calculator,
    Building2,
    TrendingUp,
    ArrowRight,
    History,
    Sparkles,
    ChevronRight,
    Play
} from 'lucide-react';
import { type Calculation } from '../../dashboard.types';
import { ModernStatusBadge } from './ClientCalculationsList';

interface ClientOverviewProps {
    calculations: Calculation[];
    venuesCount: number;
    onNewCalculation: () => void;
    onViewAllCalculations: () => void;
    onNavigateToVenues: () => void;
    onSelectCalculation: (calc: Calculation) => void;
}

export const ClientOverview = React.memo<ClientOverviewProps>(({
    calculations,
    venuesCount,
    onNewCalculation,
    onViewAllCalculations,
    onNavigateToVenues,
    onSelectCalculation
}) => {
    const recentCalculations = useMemo(() => calculations.slice(0, 3), [calculations]);

    const stats = useMemo(() => ({
        totalBudget: calculations.reduce((sum, c) => sum + (c.totalCost || 0), 0),
        activeProjects: calculations.filter(c => c.status === 'sent' || c.status === 'changes').length,
        completedProjects: calculations.filter(c => c.status === 'approved').length,
    }), [calculations]);

    return (
        <div className="space-y-12 animate-in fade-in duration-700">
            {/* Hero Section */}
            <div className="relative overflow-hidden bg-foreground text-background rounded-[3rem] p-8 sm:p-12 lg:p-16">
                <div className="relative z-10 max-w-2xl space-y-8">
                    <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full border border-primary/20">
                        <Sparkles size={14} className="animate-pulse" />
                        <span className="text-[10px] font-black uppercase tracking-widest">Профессиональная аналитика</span>
                    </div>

                    <div className="space-y-4">
                        <h1 className="text-[clamp(1.5rem,5vw,3.5rem)] font-black leading-tight tracking-tighter">
                            Оптимизируйте свой HoReCa бизнес
                        </h1>
                        <p className="text-[clamp(0.75rem,2vw,1.125rem)] text-background/60 font-medium leading-relaxed uppercase tracking-widest max-w-lg">
                            Создавайте точные расчеты инвентаря за считанные минуты на основе научных формул.
                        </p>
                    </div>

                    <div className="flex flex-wrap gap-4">
                        <button
                            onClick={onNewCalculation}
                            className="bg-primary text-white border-none px-8 py-5 rounded-2xl flex items-center gap-3 hover:scale-105 transition-transform group"
                        >
                            <span className="text-[12px] font-black uppercase tracking-widest">Новый расчет</span>
                            <Play size={16} className="fill-current" />
                        </button>
                        <button
                            onClick={onNavigateToVenues}
                            className="bg-background/10 text-background border border-background/20 px-8 py-5 rounded-2xl flex items-center gap-3 hover:bg-background/20 transition-all"
                        >
                            <span className="text-[12px] font-black uppercase tracking-widest">Мои заведения</span>
                            <Building2 size={16} />
                        </button>
                    </div>
                </div>

                {/* Decorative Elements */}
                <div className="absolute top-0 right-0 w-1/2 h-full bg-primary/20 blur-[120px] rounded-full translate-x-1/2 -translate-y-1/2" />
                <div className="absolute bottom-0 right-0 w-1/4 h-1/2 bg-blue-500/10 blur-[100px] rounded-full" />
                <div className="absolute -bottom-8 -right-8 opacity-10">
                    <Calculator size={300} strokeWidth={1} />
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="glass-card p-8 flex flex-col justify-between group hover:border-primary/30 transition-all">
                    <div className="flex justify-between items-start mb-6">
                        <div className="p-4 rounded-2xl bg-primary/5 text-primary">
                            <TrendingUp size={24} />
                        </div>
                        <span className="text-[10px] font-black text-foreground/20 uppercase tracking-widest">Всего</span>
                    </div>
                    <div>
                        <p className="text-[28px] font-black tracking-tighter">{stats.totalBudget.toLocaleString()} ₽</p>
                        <p className="text-[10px] font-black text-foreground/40 uppercase tracking-[0.2em] mt-2">Общая стоимость</p>
                    </div>
                </div>

                <div className="glass-card p-8 flex flex-col justify-between group hover:border-emerald-500/30 transition-all">
                    <div className="flex justify-between items-start mb-6">
                        <div className="p-4 rounded-2xl bg-emerald-500/5 text-emerald-500">
                            <History size={24} />
                        </div>
                        <span className="text-[10px] font-black text-foreground/20 uppercase tracking-widest">Активно</span>
                    </div>
                    <div>
                        <p className="text-[28px] font-black tracking-tighter">{stats.activeProjects}</p>
                        <p className="text-[10px] font-black text-foreground/40 uppercase tracking-[0.2em] mt-2">Проектов в работе</p>
                    </div>
                </div>

                <div className="glass-card p-8 flex flex-col justify-between group hover:border-blue-500/30 transition-all">
                    <div className="flex justify-between items-start mb-6">
                        <div className="p-4 rounded-2xl bg-blue-500/5 text-blue-500">
                            <Building2 size={24} />
                        </div>
                        <span className="text-[10px] font-black text-foreground/20 uppercase tracking-widest">Объекты</span>
                    </div>
                    <div>
                        <p className="text-[28px] font-black tracking-tighter">{venuesCount}</p>
                        <p className="text-[10px] font-black text-foreground/40 uppercase tracking-[0.2em] mt-2">Зарегистрировано</p>
                    </div>
                </div>

                <div className="glass-card p-8 flex flex-col justify-between group hover:border-orange-500/30 transition-all">
                    <div className="flex justify-between items-start mb-6">
                        <div className="p-4 rounded-2xl bg-orange-500/5 text-orange-500">
                            <Calculator size={24} />
                        </div>
                        <span className="text-[10px] font-black text-foreground/20 uppercase tracking-widest">Сметы</span>
                    </div>
                    <div>
                        <p className="text-[28px] font-black tracking-tighter">{calculations.length}</p>
                        <p className="text-[10px] font-black text-foreground/40 uppercase tracking-[0.2em] mt-2">Всего расчетов</p>
                    </div>
                </div>
            </div>

            {/* Recent Section */}
            <div className="space-y-8">
                <div className="flex items-center justify-between px-2">
                    <div className="space-y-1">
                        <h2 className="text-2xl font-black uppercase tracking-tight">Последние расчеты</h2>
                        <p className="text-[10px] font-black text-foreground/30 uppercase tracking-[0.2em]">Ваша недавняя активность</p>
                    </div>
                    <button
                        onClick={onViewAllCalculations}
                        className="flex items-center gap-2 text-[10px] font-black text-primary uppercase tracking-widest hover:gap-4 transition-all"
                    >
                        Смотреть все <ArrowRight size={14} />
                    </button>
                </div>

                <div className="grid grid-cols-1 gap-4">
                    {recentCalculations.length > 0 ? (
                        recentCalculations.map((calc) => (
                            <div
                                key={calc.id}
                                onClick={() => onSelectCalculation(calc)}
                                className="group bg-card border border-border-theme p-6 rounded-[2rem] hover:border-primary/30 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-6 cursor-pointer"
                            >
                                <div className="flex items-center gap-6">
                                    <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
                                        <History size={24} />
                                    </div>
                                    <div className="space-y-1 min-w-0">
                                        <div className="flex items-center gap-3">
                                            <h4 className="text-lg font-black uppercase tracking-tight truncate">{calc.organizationName}</h4>
                                            <ModernStatusBadge status={calc.status} />
                                        </div>
                                        <div className="flex items-center gap-4 text-[10px] font-black text-foreground/30 uppercase tracking-widest">
                                            <span>{calc.createdDate}</span>
                                            <span>•</span>
                                            <span>{calc.totalArea} м²</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center justify-between sm:justify-end gap-12 pt-4 sm:pt-0 border-t sm:border-t-0 border-border-theme">
                                    <div className="text-right">
                                        <p className="text-[10px] font-black text-foreground/30 uppercase tracking-widest mb-1">Сумма</p>
                                        <p className="text-lg font-black tracking-tight">{calc.totalCost?.toLocaleString() || '0'} ₽</p>
                                    </div>
                                    <div className="w-10 h-10 rounded-full border border-border-theme flex items-center justify-center text-foreground/20 group-hover:bg-primary group-hover:border-primary group-hover:text-white transition-all">
                                        <ChevronRight size={20} />
                                    </div>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="py-16 text-center bg-card/50 border-2 border-dashed border-border-theme rounded-[3rem]">
                            <p className="text-[10px] font-black text-foreground/30 uppercase tracking-[0.3em]">История расчетов пуста</p>
                            <button onClick={onNewCalculation} className="mt-4 text-primary text-[10px] font-black uppercase tracking-widest hover:underline">
                                Создать первый расчет
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
});
