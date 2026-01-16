import React, { useMemo } from 'react';
import {
    ArrowRight,
    Activity,
    ArrowUpRight,
    Users,
    Clock,
    Zap,
    MessageSquare,
} from 'lucide-react';
import {
    RevenuePulseChart,
    PortfolioRadarChart,
    StatusEfficiencyChart,
} from './analytics';

import { type Calculation } from '../../dashboard.types';
import { OBJECT_TYPES } from '../../dashboard.types';

interface ManagerOverviewProps {
    calculations: Calculation[];
    onNavigate: (page: string) => void;
}

export const ManagerOverview = React.memo<ManagerOverviewProps>(({ calculations, onNavigate }) => {
    const [timeRange, setTimeRange] = React.useState<'week' | 'month' | 'quarter' | 'all'>('all');

    const filteredData = useMemo(() => {
        if (timeRange === 'all') return calculations;

        const now = new Date();
        const cutoff = new Date();

        if (timeRange === 'week') cutoff.setDate(now.getDate() - 7);
        else if (timeRange === 'month') cutoff.setMonth(now.getMonth() - 1);
        else if (timeRange === 'quarter') cutoff.setMonth(now.getMonth() - 3);

        return calculations.filter(c => new Date(c.createdDate) >= cutoff);
    }, [calculations, timeRange]);

    const stats = useMemo(() => {
        const invoiced = filteredData.filter((c) => c.status === 'invoice');
        const pending = filteredData.filter((c) => c.status === 'sent' || c.status === 'revision');
        const inChanges = filteredData.filter((c) => c.status === 'changes');
        const implementation = filteredData.filter((c) =>
            ['invoice', 'paid', 'shipping'].includes(c.status)
        );

        return {
            totalBudget: filteredData.reduce((sum, c) => sum + (c.totalCost || 0), 0),
            activeProjects: filteredData.length,
            invoiced: invoiced.length,
            pending: pending.length,
            inChanges: inChanges.length,
            implementation: implementation.length,
            pendingCount: pending.length,
            changesCount: inChanges.length,
            approvedCount: invoiced.length,
            implementationCount: implementation.length,
            conversion:
                filteredData.length > 0
                    ? Math.round(
                          ((invoiced.length + implementation.length) / filteredData.length) * 100
                      )
                    : 0,
            avgDealSize:
                filteredData.length > 0
                    ? Math.round(
                          filteredData.reduce((sum, c) => sum + (c.totalCost || 0), 0) /
                              filteredData.length
                      )
                    : 0,
        };
    }, [filteredData]);

    const chartData = useMemo(() => {
        const months = ['Янв', 'Фев', 'Мар', 'Апр', 'Май', 'Июн', 'Июл', 'Авг', 'Сен', 'Окт', 'Ноя', 'Дек'];
        const currentYear = new Date().getFullYear();
        
        // Volume by month
        const monthlyData = months.map((m, i) => {
            const projectsInMonth = filteredData.filter(c => {
                const date = new Date(c.createdDate);
                return date.getMonth() === i && date.getFullYear() === currentYear;
            });
            
            return {
                name: m,
                volume: projectsInMonth.reduce((sum, c) => sum + (c.totalCost || 0), 0) / 1000,
                count: projectsInMonth.length
            };
        });

        // Specialization (Radar)
        const typeData = OBJECT_TYPES.map(type => {
            const count = filteredData.filter(c => c.type === type.value).length;
            return {
                subject: type.label.split(' ')[1] || type.label,
                A: count,
                fullMark: Math.max(...OBJECT_TYPES.map(t => filteredData.filter(c => c.type === t.value).length), 5)
            };
        });

        // Status Efficiency (Composed Bar + Line)
        const statusMap: Record<string, { label: string; order: number; keys: string[] }> = {
            draft: { label: 'Черновик', order: 1, keys: ['draft'] },
            expert: { label: 'Проверка', order: 2, keys: ['sent', 'expert'] },
            revision: { label: 'Правки', order: 3, keys: ['revision'] },
            changes: { label: 'Анализ', order: 4, keys: ['changes'] },
            invoice: { label: 'Счет', order: 5, keys: ['invoice'] },
            paid: { label: 'Оплата', order: 6, keys: ['paid'] }, // including payment_review if needed
            shipping: { label: 'Доставка', order: 7, keys: ['shipping', 'ready'] },
        };

        const statusEfficiencyData = Object.entries(statusMap)
            .sort((a, b) => a[1].order - b[1].order)
            .map(([, info]) => {
                const projects = filteredData.filter((c) => info.keys.includes(c.status));
                return {
                    name: info.label,
                    count: projects.length,
                    volume: Math.round(projects.reduce((sum, c) => sum + (c.totalCost || 0), 0) / 1000),
                };
            });

        return { monthlyData, typeData, statusEfficiencyData };
    }, [filteredData]);

    const recentItems = useMemo(() => {
        return [...filteredData]
            .sort((a, b) => new Date(b.createdDate).getTime() - new Date(a.createdDate).getTime())
            .slice(0, 6);
    }, [filteredData]);

    const formatRelativeTime = (dateStr: string) => {
        try {
            const date = new Date(dateStr);
            if (isNaN(date.getTime())) return dateStr;
            const now = new Date();
            const diffMs = now.getTime() - date.getTime();
            const diffMin = Math.floor(diffMs / 60000);
            const diffHr = Math.floor(diffMin / 60);
            const diffDays = Math.floor(diffHr / 24);

            if (diffMin < 1) return 'только что';
            if (diffMin < 60) return `${diffMin} м. назад`;
            if (diffHr < 24) return `${diffHr} ч. назад`;
            return `${diffDays} д. назад`;
        } catch {
            return dateStr;
        }
    };

    return (
        <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-1000">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div className="space-y-2">
                    <p className="text-[10px] font-black uppercase tracking-[0.4em] text-primary">
                        Live Dashboard
                    </p>
                    <h1 className="text-4xl lg:text-6xl font-black uppercase tracking-tighter leading-none">
                        Аналитика
                        <br />
                        Портфеля
                    </h1>
                </div>
                <div className="flex flex-col sm:flex-row items-center gap-4 bg-card border border-border-theme p-2 sm:p-3 rounded-[2.5rem] shadow-2xl backdrop-blur-md">
                    <div className="flex items-center gap-1 bg-foreground/5 p-1 rounded-[1.5rem]">
                        {[
                            { id: 'week', label: 'Нед' },
                            { id: 'month', label: 'Мес' },
                            { id: 'quarter', label: 'Кв' },
                            { id: 'all', label: 'Всё' }
                        ].map((range) => (
                            <button
                                key={range.id}
                                onClick={() => setTimeRange(range.id as typeof timeRange)}
                                className={`px-4 py-2 rounded-[1.2rem] text-[10px] font-black uppercase tracking-widest transition-all duration-300 ${
                                    timeRange === range.id 
                                        ? 'bg-primary text-white shadow-lg shadow-primary/30' 
                                        : 'text-foreground/40 hover:text-foreground/60 hover:bg-foreground/5'
                                }`}
                            >
                                {range.label}
                            </button>
                        ))}
                    </div>
                    
                    <div className="hidden sm:flex items-center gap-4 pr-4 border-l border-border-theme pl-4">
                        <div className="border-l border-border-theme pl-4">
                            <p className="text-[10px] font-black uppercase tracking-widest text-foreground/40 leading-tight">
                                Live
                            </p>
                            <div className="flex items-center gap-1.5">
                                <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                                <span className="text-[9px] font-bold text-emerald-500 uppercase tracking-tighter">Sync</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Analytics Section */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                {/* Volume Pulse Chart */}
                <div className="xl:col-span-2 min-w-0 self-start">
                    <RevenuePulseChart 
                        data={chartData.monthlyData} 
                        totalBudget={stats.totalBudget}
                    />
                </div>

                {/* Categories Radar */}
                <div className="min-w-0 self-start">
                    <PortfolioRadarChart data={chartData.typeData} />
                </div>

                    <div className="xl:col-span-2 space-y-8 min-w-0 self-start">
                        <StatusEfficiencyChart 
                            data={chartData.statusEfficiencyData}
                            calculations={filteredData}
                            totalProjects={stats.activeProjects}
                            conversion={stats.conversion}
                        />
                    </div>

                {/* Pulse Activity Feed */}
                <div className="bg-card border border-border-theme rounded-[3.5rem] p-10 space-y-10 relative group/pulse shadow-2xl self-start">
                    <div className="absolute top-0 right-0 p-10 opacity-[0.02] -rotate-12 group-hover/pulse:rotate-0 transition-transform duration-1000">
                        <Activity size={120} />
                    </div>
                    
                    <div className="flex items-center justify-between relative z-10">
                        <h3 className="text-2xl font-black uppercase tracking-tight flex items-center gap-4">
                            <div className="p-3 bg-primary/10 rounded-xl">
                                <Activity className="text-primary" size={20} />
                            </div>
                            Активность
                        </h3>
                        <div className="flex items-center gap-2 pl-4 pr-3 py-1.5 bg-emerald-500/10 rounded-full border border-emerald-500/10">
                            <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                            <span className="text-[9px] font-black uppercase text-emerald-500 tracking-widest">Live</span>
                        </div>
                    </div>

                    <div className="space-y-6 relative z-10">
                        {recentItems.length > 0 ? (
                            recentItems.map((calc, idx) => (
                                <div 
                                    key={calc.id} 
                                    className="group/item relative flex gap-5 p-5 rounded-[2rem] hover:bg-foreground/[0.03] transition-all duration-300 border border-transparent hover:border-border-theme cursor-pointer"
                                    onClick={() => onNavigate(`pipeline?id=${calc.id}`)}
                                >
                                    <div className="flex flex-col items-center gap-3">
                                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border shadow-sm transition-all group-hover/item:shadow-xl ${calc.status === 'sent' ? 'bg-orange-500 dark:bg-orange-500/20 text-white dark:text-orange-500 border-orange-500/10' : 'bg-primary dark:bg-primary/20 text-white dark:text-primary border-primary/10'}`}>
                                            {calc.status === 'sent' ? <Zap size={22} /> : <MessageSquare size={22} />}
                                        </div>
                                        {idx < recentItems.length - 1 && (
                                            <div className="w-[2px] flex-1 bg-border-theme/60 rounded-full" />
                                        )}
                                    </div>
                                    
                                    <div className="flex-1 min-w-0 py-1">
                                        <div className="flex items-center justify-between mb-2">
                                            <p className="text-[10px] font-black text-foreground/30 uppercase tracking-[0.2em] flex items-center gap-1.5">
                                                <Clock size={12} className="opacity-50" /> {formatRelativeTime(calc.createdDate)}
                                            </p>
                                            <div className="px-3 py-1 bg-foreground/5 rounded-lg border border-border-theme group-hover/item:border-primary/30 transition-colors">
                                                <p className="text-[11px] font-black text-primary">
                                                    ₽ {calc.totalCost?.toLocaleString() || 0}
                                                </p>
                                            </div>
                                        </div>
                                        <h4 className="text-base font-black uppercase tracking-tight truncate group-hover/item:text-primary transition-colors">
                                            {calc.organizationName}
                                        </h4>
                                        <div className="flex items-center gap-2 mt-1.5">
                                            <span className="px-2 py-0.5 bg-foreground/5 rounded-md text-[9px] font-black uppercase text-foreground/40 tracking-widest border border-border-theme">
                                                {calc.type}
                                            </span>
                                            <span className="text-[10px] font-bold text-foreground/20 italic">
                                                #{String(calc.project_number || idx + 1).padStart(3, '0')}
                                            </span>
                                        </div>
                                    </div>
                                    
                                    <div className="self-center p-2 rounded-xl bg-foreground/5 opacity-0 group-hover/item:opacity-100 group-hover/item:translate-x-1 transition-all">
                                        <ArrowUpRight size={20} className="text-primary" />
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="py-24 text-center opacity-10">
                                <Users size={60} className="mx-auto mb-6" />
                                <p className="text-xs font-black uppercase tracking-[0.3em]">
                                    Нет активных событий
                                </p>
                            </div>
                        )}
                    </div>

                    <button
                        onClick={() => onNavigate('pipeline')}
                        className="relative z-10 w-full py-6 rounded-2xl bg-foreground/[0.03] border border-border-theme text-[11px] font-black uppercase tracking-[0.2em] hover:bg-primary hover:text-white hover:shadow-2xl hover:shadow-primary/30 transition-all group/btn flex items-center justify-center gap-4"
                    >
                        Показать всю историю
                        <ArrowRight size={18} className="group-hover/btn:translate-x-2 transition-transform" />
                    </button>
                </div>
            </div>
        </div>
    );
});
