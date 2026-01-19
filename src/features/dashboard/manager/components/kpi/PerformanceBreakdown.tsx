import React from 'react';
import { Activity, Crown } from 'lucide-react';
import type { KPIData } from '../../hooks/useManagerKPI';

interface PerformanceBreakdownProps {
    data: KPIData | null;
}

export const PerformanceBreakdown: React.FC<PerformanceBreakdownProps> = ({ data }) => {
    const items = [
        { 
            label: 'Конверсия в успех', 
            value: `${(data?.conversionRate || 0).toFixed(0)}%`, 
            progress: data?.conversionRate || 0, 
            color: 'bg-indigo-500', 
            status: (data?.conversionRate || 0) > 50 ? 'Выше цели' : 'Требует внимания'
        },
        { 
            label: 'SLA (Скорость ответа)', 
            value: `${data?.slaScore || 0}%`, 
            progress: data?.slaScore || 0, 
            color: 'bg-emerald-500', 
            status: 'В норме'
        },
        { 
            label: 'Средний чек', 
            value: `₽ ${((data?.avgCheck || 0) / 1000).toFixed(0)}K`, 
            progress: Math.min(100, ((data?.avgCheck || 0) / 150000) * 100), 
            color: 'bg-primary', 
            status: 'Средний чек'
        }
    ];

    return (
        <div className="glass-card !p-8 flex flex-col h-full bg-background/60">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h3 className="text-xl font-black tracking-tighter mb-1">Эффективность</h3>
                    <p className="text-[10px] font-bold text-foreground/30 uppercase tracking-widest">Ключевые показатели</p>
                </div>
                <Activity className="text-primary/40" size={20} />
            </div>

            <div className="space-y-6 flex-1">
                {items.map((item, id) => (
                    <div key={id} className="space-y-2">
                        <div className="flex justify-between items-end">
                            <span className="text-[11px] font-black uppercase text-foreground/50">{item.label}</span>
                            <span className="text-xl font-black">{item.value}</span>
                        </div>
                        <div className="h-2 w-full bg-foreground/[0.05] rounded-full overflow-hidden">
                            <div 
                                className={`h-full ${item.color} rounded-full transition-all duration-1000`}
                                style={{ width: `${item.progress}%` }}
                            />
                        </div>
                    </div>
                ))}
            </div>

            <div className="mt-10 p-6 rounded-[2rem] bg-indigo-500/5 border border-indigo-500/10">
                <div className="flex items-center gap-5">
                    <div className="w-14 h-14 rounded-2xl bg-indigo-500 flex items-center justify-center text-white">
                        <Crown size={28} />
                    </div>
                    <div className="flex-1 space-y-2">
                        <div className="flex justify-between items-center text-[10px] font-black uppercase text-indigo-500/80">
                            <span>Цель по выручке</span>
                            <span>{(((data?.totalBudget || 0) / 2000000) * 100).toFixed(0)}%</span>
                        </div>
                        <div className="h-1.5 w-full bg-indigo-500/10 rounded-full overflow-hidden">
                            <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${Math.min(100, ((data?.totalBudget || 0) / 2000000) * 100)}%` }} />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
