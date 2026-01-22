import React from 'react';
import { Star, Briefcase, TrendingUp, Wallet, Award } from 'lucide-react';
import type { KPIData } from '../../hooks/useManagerKPI';

interface KPIStatsGridProps {
    data: KPIData | null;
}

export const KPIStatsGrid: React.FC<KPIStatsGridProps> = ({ data }) => {
    const formatCompactCurrency = (amount: number) => {
        if (amount >= 1000000) return `₽ ${(amount / 1000000).toFixed(1)}M`;
        if (amount >= 1000) return `₽ ${(amount / 1000).toFixed(0)}K`;
        return `₽ ${amount}`;
    };

    const stats = [
        {
            label: 'Ваш рейтинг',
            value: data?.avgRating.toFixed(1) || '0.0',
            sub: `${data?.ratingCount || 0} отзывов`,
            icon: Star,
            color: 'text-yellow-500',
            bg: 'bg-yellow-500/10',
        },
        {
            label: 'Завершено проектов',
            value: data?.totalProjects || 0,
            sub: 'за всё время',
            icon: Briefcase,
            color: 'text-blue-500',
            bg: 'bg-blue-500/10',
        },
        {
            label: 'Объем продаж',
            value: formatCompactCurrency(data?.totalBudget || 0),
            sub: 'в годовом эквиваленте',
            icon: TrendingUp,
            color: 'text-emerald-500',
            bg: 'bg-emerald-500/10',
        },
        {
            label: 'Бонус (1%)',
            value: `₽ ${(data?.commission || 0).toLocaleString()}`,
            sub: 'прогноз выплат',
            icon: Wallet,
            color: 'text-primary',
            bg: 'bg-primary/10',
        },
    ];

    return (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
            {stats.map((s, i) => (
                <div
                    key={i}
                    className="group relative glass-card !p-0 overflow-hidden hover:translate-y-[-4px] transition-all duration-500 border-none bg-background/40"
                >
                    <div
                        className={`absolute inset-x-0 bottom-0 h-1 ${s.bg.replace('/10', '')} opacity-40 group-hover:h-2 transition-all duration-500`}
                    />
                    <div className="p-4 sm:p-7">
                        <div className="flex items-center justify-between mb-4 sm:mb-6">
                            <div
                                className={`p-2.5 sm:p-4 rounded-xl sm:rounded-2xl ${s.bg} ${s.color} ring-2 sm:ring-4 ring-white dark:ring-white/5 transition-transform group-hover:rotate-6`}
                            >
                                <s.icon size={20} className="sm:hidden" />
                                <s.icon size={28} className="hidden sm:block" />
                            </div>
                            <div className="p-1 sm:p-1.5 rounded-lg bg-foreground/[0.03] text-foreground/10">
                                <Award size={12} className="sm:hidden" />
                                <Award size={14} className="hidden sm:block" />
                            </div>
                        </div>
                        <div className="space-y-0.5 sm:space-y-1">
                            <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-[0.15em] sm:tracking-[0.2em] text-foreground/40">
                                {s.label}
                            </span>
                            <div className="flex items-baseline gap-2">
                                <span className="text-2xl sm:text-4xl font-black tracking-tighter text-foreground/90">
                                    {s.value}
                                </span>
                            </div>
                            <div className="flex items-center gap-1.5 sm:gap-2 pt-1 sm:pt-2">
                                <div
                                    className={`w-1 h-1 rounded-full ${s.bg.replace('/10', '')}`}
                                />
                                <span className="text-[9px] sm:text-[10px] font-bold text-foreground/50 uppercase tracking-widest">
                                    {s.sub}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
};
