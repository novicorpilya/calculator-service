import React from 'react';
import { PieChart } from 'lucide-react';
import {
    ComposedChart,
    Bar,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
} from 'recharts';
import { type Calculation } from '../../../dashboard.types';
import { ChartContainer } from '../../../../../components/ui/charts/ChartContainer';

interface EfficiencyPoint {
    name: string;
    count: number;
    volume: number;
}

interface StatusEfficiencyChartProps {
    data: EfficiencyPoint[];
    calculations: Calculation[];
    totalProjects: number;
    conversion?: number;
}

export const StatusEfficiencyChart: React.FC<StatusEfficiencyChartProps> = ({ 
    data, 
    calculations,
    totalProjects,
    conversion = 0
}) => {
    return (
        <div className="glass-card p-10 relative group/funnel">
            <div className="absolute -top-10 -left-10 w-40 h-40 bg-primary/5 blur-[50px] rounded-full group-hover/funnel:bg-primary/10 transition-colors" />
            
            <div className="relative z-10 h-full flex flex-col">
                <div className="flex items-center justify-between mb-8">
                    <div className="space-y-1">
                        <h3 className="text-xl font-black uppercase tracking-tight flex items-center gap-3">
                            <PieChart className="text-primary" size={20} /> Эффективность статусов
                        </h3>
                        <div className="flex items-center gap-3 pl-8">
                            <span className="text-[10px] font-black text-foreground/40 uppercase tracking-widest bg-foreground/5 px-3 py-1 rounded-full border border-border-theme">
                                {totalProjects} Активных
                            </span>
                            <span className="text-[10px] font-black text-blue-500 uppercase tracking-widest bg-blue-500/10 px-3 py-1 rounded-full border border-blue-500/10">
                                {conversion}% Конверсия
                            </span>
                        </div>
                    </div>
                </div>
                
                <ChartContainer id="status-efficiency-chart" height={300}>
                    <ComposedChart data={data} margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="currentColor" className="opacity-[0.03]" />
                        <XAxis 
                            dataKey="name" 
                            axisLine={false} 
                            tickLine={false} 
                            tick={{fill: 'currentColor', fontSize: 9, fontWeight: 900}}
                            className="opacity-40"
                        />
                        <YAxis yAxisId="left" hide />
                        <YAxis yAxisId="right" hide />
                        <Tooltip 
                            contentStyle={{ 
                                backgroundColor: 'var(--card)', 
                                border: '1px solid var(--border-theme)',
                                borderRadius: '1rem',
                                padding: '12px',
                                boxShadow: '0 20px 40px -10px rgba(0,0,0,0.3)',
                                backdropFilter: 'blur(10px)'
                            }}
                            itemStyle={{ fontSize: '10px', fontWeight: 800, textTransform: 'uppercase' }}
                        />
                        <Bar 
                            yAxisId="left"
                            dataKey="count"
                            name="Сделок" 
                            barSize={40} 
                            fill="var(--primary)" 
                            radius={[10, 10, 0, 0]} 
                            opacity={0.8}
                            animationDuration={2000}
                        />
                        <Line 
                            yAxisId="right"
                            type="monotone" 
                            dataKey="volume"
                            name="Оборот (тыс. ₽)" 
                            stroke="#f59e0b" 
                            strokeWidth={4} 
                            dot={{ r: 4, fill: '#f59e0b', strokeWidth: 2, stroke: 'var(--card)' }}
                            animationDuration={3000}
                        />
                    </ComposedChart>
                </ChartContainer>

                <div className="mt-6 pt-6 border-t border-border-theme/30 grid grid-cols-2 lg:grid-cols-4 xl:grid-cols-8 gap-4">
                    {[
                        { label: 'Черновик', keys: ['draft'], color: 'bg-zinc-500' },
                        { label: 'Проверка', keys: ['sent', 'expert'], color: 'bg-orange-500' },
                        { label: 'Правки', keys: ['revision'], color: 'bg-blue-500' },
                        { label: 'Анализ', keys: ['changes'], color: 'bg-primary' },
                        { label: 'Счет', keys: ['invoice'], color: 'bg-emerald-500' },
                        { label: 'Оплата', keys: ['paid', 'payment_review', 'payment_rejected'], color: 'bg-purple-500' },
                        { label: 'Логистика', keys: ['processing', 'sent_to_warehouse', 'ready', 'shipping'], color: 'bg-indigo-500' },
                        { label: 'Готово', keys: ['completed', 'closed'], color: 'bg-rose-500' }
                    ].map((item, i) => {
                        const count = calculations.filter(c => item.keys.includes(c.status)).length;
                        const pct = totalProjects > 0 ? Math.round((count / totalProjects) * 100) : 0;
                        return (
                            <div key={i} className="space-y-1">
                                <div className="flex items-center gap-2">
                                    <div className={`w-1.5 h-1.5 rounded-full ${item.color}`} />
                                    <span className="text-[9px] font-black uppercase text-foreground/30 tracking-tight">{item.label}</span>
                                </div>
                                <p className="text-sm font-black leading-none">{count} <span className="text-[9px] opacity-20">{pct}%</span></p>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};
