import React, { useMemo } from 'react';
import {
    ClipboardList,
    ArrowRight,
    TrendingUp,
    Library,
    Star,
    BarChart3,
    PieChart,
    Activity,
    ArrowUpRight,
    ArrowDownRight,
    User
} from 'lucide-react';
import { type Calculation } from '../../dashboard.types';

interface ManagerOverviewProps {
    calculations: Calculation[];
    onNavigate: (page: string) => void;
}

export const ManagerOverview = React.memo<ManagerOverviewProps>(({ calculations, onNavigate }) => {

    const stats = useMemo(() => {
        const invoiced = calculations.filter(c => c.status === 'invoice');
        const pending = calculations.filter(c => c.status === 'sent' || c.status === 'revision');
        const inChanges = calculations.filter(c => c.status === 'changes');
        const implementation = calculations.filter(c => ['invoice', 'paid', 'shipping'].includes(c.status));

        return {
            totalBudget: calculations.reduce((sum, c) => sum + (c.totalCost || 0), 0),
            activeProjects: calculations.length,
            invoiced: invoiced.length,
            pending: pending.length,
            inChanges: inChanges.length,
            implementation: implementation.length,
            pendingCount: pending.length,
            changesCount: inChanges.length,
            approvedCount: invoiced.length, // Using invoiced instead of approved
            implementationCount: implementation.length,
            conversion: calculations.length > 0 ? Math.round(((invoiced.length + implementation.length) / calculations.length) * 100) : 0,
            avgDealSize: calculations.length > 0 ? Math.round(calculations.reduce((sum, c) => sum + (c.totalCost || 0), 0) / calculations.length) : 0
        };
    }, [calculations]);

    const recentItems = useMemo(() => calculations.slice(0, 5), [calculations]);

    return (
        <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-1000">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div className="space-y-2">
                    <p className="text-[10px] font-black uppercase tracking-[0.4em] text-primary">Live Dashboard</p>
                    <h1 className="text-4xl lg:text-6xl font-black uppercase tracking-tighter leading-none">Аналитика<br />Портфеля</h1>
                </div>
                <div className="flex items-center gap-4 bg-card border border-border-theme p-4 rounded-[2rem] shadow-xl">
                    <div className="flex -space-x-3">
                        {Array.from({ length: 4 }).map((_, i) => (
                            <div key={i} className="w-10 h-10 rounded-full border-2 border-card bg-foreground/5 flex items-center justify-center overflow-hidden">
                                <User size={20} className="text-foreground/20" />
                            </div>
                        ))}
                        <div className="w-10 h-10 rounded-full border-2 border-card bg-primary flex items-center justify-center text-[10px] font-black text-white">
                            +12
                        </div>
                    </div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-foreground/40 pr-4">Клиентов онлайн</p>
                </div>
            </div>

            {/* Main Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                    { label: 'Общий объем', value: `${(stats.totalBudget / 1000000).toFixed(2)}M`, sub: '₽ в обороте', icon: TrendingUp, color: 'text-emerald-500', trend: '+12%', isUp: true },
                    { label: 'Активные сделки', value: stats.activeProjects, sub: 'Всего проектов', icon: Activity, color: 'text-primary', trend: '+5', isUp: true },
                    { label: 'Конверсия', value: `${stats.conversion}%`, sub: 'В одобренные', icon: Star, color: 'text-blue-500', trend: '-2%', isUp: false },
                    { label: 'Средний чек', value: `${(stats.avgDealSize / 1000).toFixed(0)}K`, sub: '₽ на проект', icon: BarChart3, color: 'text-orange-500', trend: '+8%', isUp: true },
                ].map((stat, i) => (
                    <div key={i} className="group glass-card p-8 hover:border-primary/30 transition-all duration-500">
                        <div className="flex justify-between items-start mb-8">
                            <div className={`p-4 rounded-2xl bg-foreground/5 ${stat.color} group-hover:scale-110 transition-transform`}>
                                <stat.icon size={24} />
                            </div>
                            <div className={`flex items-center gap-1 text-[10px] font-black px-3 py-1.5 rounded-full ${stat.isUp ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'}`}>
                                {stat.isUp ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                                {stat.trend}
                            </div>
                        </div>
                        <div>
                            <p className="text-4xl font-black tracking-tighter mb-1 select-none">{stat.value}</p>
                            <p className="text-[10px] font-black text-foreground/30 uppercase tracking-[0.2em]">{stat.label}</p>
                            <p className="text-[9px] font-bold text-foreground/10 uppercase mt-1 italic">{stat.sub}</p>
                        </div>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                {/* Secondary Stats & Quick Actions */}
                <div className="xl:col-span-2 space-y-8">
                    {/* Status Distribution Visualizer */}
                    <div className="glass-card p-10 overflow-hidden relative">
                        <div className="relative z-10">
                            <h3 className="text-xl font-black uppercase tracking-tight mb-8 flex items-center gap-3">
                                <PieChart className="text-primary" size={20} /> Распределение по статусам
                            </h3>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                                {[
                                    { label: 'Входящие', count: stats.pendingCount, color: 'bg-orange-500', percent: Math.round((stats.pendingCount / stats.activeProjects) * 100) || 0 },
                                    { label: 'Анализ', count: stats.changesCount, color: 'bg-primary', percent: Math.round((stats.changesCount / stats.activeProjects) * 100) || 0 },
                                    { label: 'Одобрено', count: stats.approvedCount, color: 'bg-emerald-500', percent: Math.round((stats.approvedCount / stats.activeProjects) * 100) || 0 },
                                    { label: 'Реализация', count: stats.implementationCount, color: 'bg-indigo-500', percent: Math.round((stats.implementationCount / stats.activeProjects) * 100) || 0 },
                                ].map((item, i) => (
                                    <div key={i} className="space-y-4">
                                        <div className="flex items-end justify-between">
                                            <p className="text-2xl font-black leading-none">{item.count}</p>
                                            <p className="text-[10px] font-black text-foreground/30">{item.percent}%</p>
                                        </div>
                                        <div className="h-1.5 w-full bg-foreground/5 rounded-full overflow-hidden">
                                            <div className={`h-full ${item.color} transition-all duration-1000`} style={{ width: `${item.percent}%` }} />
                                        </div>
                                        <p className="text-[9px] font-black uppercase tracking-widest text-foreground/40">{item.label}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="absolute -bottom-20 -right-20 w-64 h-64 bg-primary/5 blur-[80px] rounded-full" />
                    </div>

                    {/* Action Hub */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div
                            onClick={() => onNavigate('pipeline')}
                            className="group relative overflow-hidden bg-primary p-8 rounded-[3rem] text-white cursor-pointer hover:shadow-2xl hover:shadow-primary/20 transition-all border-none"
                        >
                            <div className="relative z-10 space-y-6">
                                <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-md">
                                    <ClipboardList size={28} />
                                </div>
                                <div>
                                    <h2 className="text-3xl font-black uppercase tracking-tight leading-none">Воронка<br />Проектов</h2>
                                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/60 mt-2">Управление сделками</p>
                                </div>
                                <div className="flex items-center gap-4 text-[10px] font-black uppercase tracking-widest">
                                    Перейти <ArrowRight size={16} className="group-hover:translate-x-2 transition-transform" />
                                </div>
                            </div>
                            <ClipboardList className="absolute -bottom-4 -right-4 w-40 h-40 opacity-10 group-hover:scale-110 transition-transform duration-700" />
                        </div>

                        <div
                            onClick={() => onNavigate('kb')}
                            className="group relative overflow-hidden bg-foreground p-8 rounded-[3rem] text-background cursor-pointer hover:shadow-2xl transition-all border-none"
                        >
                            <div className="relative z-10 space-y-6">
                                <div className="w-14 h-14 bg-primary rounded-2xl flex items-center justify-center">
                                    <Library size={28} className="text-white" />
                                </div>
                                <div>
                                    <h2 className="text-3xl font-black uppercase tracking-tight leading-none">База<br />Знаний</h2>
                                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-background/40 mt-2">Нормативы и цены</p>
                                </div>
                                <div className="flex items-center gap-4 text-[10px] font-black uppercase tracking-widest text-background">
                                    Открыть <ArrowRight size={16} className="group-hover:translate-x-2 transition-transform" />
                                </div>
                            </div>
                            <Library className="absolute -bottom-4 -right-4 w-40 h-40 opacity-5 group-hover:rotate-12 transition-transform duration-700" />
                        </div>
                    </div>
                </div>

                {/* Live Activity Feed */}
                <div className="glass-card p-10 space-y-8">
                    <div className="flex items-center justify-between">
                        <h3 className="text-xl font-black uppercase tracking-tight flex items-center gap-3">
                            <Activity className="text-primary" size={20} /> Лог активности
                        </h3>
                        <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse shadow-lg shadow-emerald-500/50" />
                    </div>

                    <div className="space-y-6">
                        {recentItems.length > 0 ? recentItems.map((calc) => (
                            <div key={calc.id} className="group block space-y-3 relative pl-6">
                                <div className="absolute left-0 top-1.5 bottom-1.5 w-0.5 bg-border-theme group-hover:bg-primary transition-colors" />
                                <div className="space-y-1">
                                    <p className="text-[10px] font-black uppercase text-foreground/40">
                                        {(() => {
                                            try {
                                                const date = new Date(calc.createdDate);
                                                return isNaN(date.getTime()) ? calc.createdDate : new Intl.DateTimeFormat('ru-RU').format(date);
                                            } catch { return calc.createdDate; }
                                        })()}
                                    </p>
                                    <h4 className="text-[13px] font-black uppercase tracking-tight truncate group-hover:text-primary transition-colors">
                                        <span className="text-foreground/30 mr-2 opacity-50 font-mono">#{String(calc.project_number || calculations.indexOf(calc) + 1).padStart(3, '0')}</span>
                                        {calc.organizationName}
                                    </h4>
                                </div>
                                <div className="flex items-center justify-between">
                                    <p className="text-[10px] font-bold text-foreground/20 italic">{calc.type}</p>
                                    <p className="text-[11px] font-black">+{calc.totalCost?.toLocaleString() || 0} ₽</p>
                                </div>
                            </div>
                        )) : (
                            <div className="py-20 text-center opacity-20">
                                <p className="text-[10px] font-black uppercase tracking-widest">Нет действий</p>
                            </div>
                        )}
                    </div>

                    <button
                        onClick={() => onNavigate('pipeline')}
                        className="w-full py-5 rounded-2xl bg-foreground/5 text-[10px] font-black uppercase tracking-widest hover:bg-primary hover:text-white transition-all shadow-inner"
                    >
                        Смотреть всю историю
                    </button>
                </div>
            </div>
        </div>
    );
});
