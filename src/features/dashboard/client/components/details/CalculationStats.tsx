import React from 'react';
import { Boxes, MapPin, FileText } from 'lucide-react';
import { CalculationViewModel } from '@/features/dashboard/presentation/CalculationViewModel';

interface CalculationStatsProps {
    entity: CalculationViewModel;
}

export const CalculationStats: React.FC<CalculationStatsProps> = ({ entity }) => {
    const stats = [
        {
            label: 'Зоны',
            value: entity.zonesCount,
            icon: Boxes,
            color: 'text-indigo-500',
            bg: 'bg-indigo-500/5',
        },
        {
            label: 'Площадь',
            value: `${entity.totalArea} м²`,
            icon: MapPin,
            color: 'text-blue-500',
            bg: 'bg-blue-500/5',
        },
        {
            label: 'Тип объекта',
            value: entity.type || 'Ресторан',
            icon: FileText,
            color: 'text-emerald-500',
            bg: 'bg-emerald-500/5',
        },
    ];

    return (
        <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,240px),1fr))] gap-6">
            {stats.map((stat, i) => (
                <div
                    key={i}
                    className="glass-card !bg-card !p-8 border-transparent hover:border-border-theme transition-all group"
                >
                    <div
                        className={`w-14 h-14 rounded-2xl ${stat.bg} ${stat.color} flex items-center justify-center mb-6 shadow-sm`}
                    >
                        <stat.icon size={24} />
                    </div>
                    <p className="text-[10px] font-black text-foreground/50 uppercase tracking-[0.2em] mb-2">
                        {stat.label}
                    </p>
                    <p className="text-2xl font-black">{stat.value}</p>
                </div>
            ))}
        </div>
    );
};
