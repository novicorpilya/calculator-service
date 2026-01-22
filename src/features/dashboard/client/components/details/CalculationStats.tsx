import React from 'react';
import { Boxes, MapPin, FileText } from 'lucide-react';
import { CalculationViewModel } from '@/features/dashboard/presentation/CalculationViewModel';

interface CalculationStatsProps {
    entity: CalculationViewModel;
}

export const CalculationStats: React.FC<CalculationStatsProps> = ({ entity }) => {
    const stats = [
        {
            label: 'Конфигурация объекта',
            value: `${entity.zonesCount} зон`,
            subValue: `${entity.totalArea.toLocaleString()} м² площадь`,
            icon: Boxes,
            color: 'text-indigo-400',
            bg: 'bg-indigo-500/5',
            border: 'border-indigo-500/10',
        },
        {
            label: 'Типология бизнеса',
            value:
                entity.type === 'restaurant'
                    ? 'Ресторан / Кафе'
                    : entity.type === 'hotel'
                      ? 'Отель / HoReCa'
                      : entity.type === 'mall'
                        ? 'Торговый центр'
                        : 'Коммерческий объект',
            subValue: 'Профиль объекта',
            icon: FileText,
            color: 'text-emerald-400',
            bg: 'bg-emerald-500/5',
            border: 'border-emerald-500/10',
        },
        {
            label: 'Нагрузка объекта',
            value: `${entity.rawData.staffCount || 0} штатных единиц`,
            subValue: `Поток: ${entity.rawData.dailyVisitors?.toLocaleString() || 0} гостей в сутки`,
            icon: MapPin,
            color: 'text-blue-400',
            bg: 'bg-blue-500/5',
            border: 'border-blue-500/10',
        },
    ];

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {stats.map((stat, i) => (
                <div
                    key={i}
                    className={`relative overflow-hidden glass-card !bg-white/[0.02] border ${stat.border} !p-6 hover:bg-white/[0.04] transition-all duration-500 group`}
                >
                    <div className="flex items-start justify-between mb-4">
                        <div
                            className={`w-10 h-10 rounded-xl ${stat.bg} ${stat.color} flex items-center justify-center shadow-inner`}
                        >
                            <stat.icon size={20} />
                        </div>
                    </div>

                    <div className="space-y-1">
                        <p className="text-[10px] font-black text-foreground/40 uppercase tracking-[0.2em]">
                            {stat.label}
                        </p>
                        <p className="text-xl font-black tracking-tight text-foreground/90 leading-tight">
                            {stat.value}
                        </p>
                        <p className="text-[11px] font-bold text-foreground/50 italic whitespace-nowrap overflow-hidden text-ellipsis">
                            {stat.subValue}
                        </p>
                    </div>

                    {/* Subtle bottom glow */}
                    <div
                        className={`absolute -bottom-px left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity`}
                    />
                </div>
            ))}
        </div>
    );
};
