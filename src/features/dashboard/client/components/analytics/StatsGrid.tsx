import React from 'react';
import { TrendingUp, Package, Trophy, Clock } from 'lucide-react';
import { formatCurrency } from '@/core/domain/calculator.utils';

interface StatsGridProps {
    stats: {
        totalVolume: number;
        orderCount: number;
        vipStatus: string;
        avgDeliveryDays?: number;
    };
}

export const StatsGrid: React.FC<StatsGridProps> = ({ stats }) => {
    const items = [
        {
            label: 'Объем заказов (год)',
            value: formatCurrency(stats.totalVolume),
            icon: TrendingUp,
            color: 'text-primary',
            bg: 'bg-primary/10',
        },
        {
            label: 'Всего заказов',
            value: stats.orderCount,
            icon: Package,
            color: 'text-blue-500',
            bg: 'bg-blue-500/10',
        },
        {
            label: 'Статус клиента',
            value: stats.vipStatus,
            icon: Trophy,
            color: 'text-amber-500',
            bg: 'bg-amber-500/10',
        },
        {
            label: 'Ср. срок отгрузки',
            value: stats.avgDeliveryDays ? `${stats.avgDeliveryDays} дн.` : '—',
            icon: Clock,
            color: 'text-emerald-500',
            bg: 'bg-emerald-500/10',
        },
    ];

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {items.map((item, idx) => (
                <div
                    key={idx}
                    className="group bg-card border border-border-theme p-5 sm:p-8 rounded-[2rem] sm:rounded-[2.5rem] hover:border-primary/30 transition-all hover:shadow-[0_20px_40px_rgba(0,0,0,0.05)]"
                >
                    <div className="flex items-start justify-between mb-6">
                        <div
                            className={`w-14 h-14 rounded-2xl ${item.bg} flex items-center justify-center ${item.color} group-hover:scale-110 transition-transform`}
                        >
                            <item.icon size={24} />
                        </div>
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-foreground/50 uppercase tracking-[0.2em] mb-2">
                            {item.label}
                        </p>
                        <h4 className="text-3xl font-black tracking-tighter">{item.value}</h4>
                    </div>
                </div>
            ))}
        </div>
    );
};
