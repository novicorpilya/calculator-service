import React from 'react';
import { TrendingUp, Activity } from 'lucide-react';
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
} from 'recharts';
import { ChartContainer } from '../../../../../components/ui/charts/ChartContainer';

interface RevenuePoint {
    name: string;
    volume: number;
    count: number;
}

interface RevenuePulseChartProps {
    data: RevenuePoint[];
    totalBudget?: number;
}

export const RevenuePulseChart: React.FC<RevenuePulseChartProps> = ({ data, totalBudget = 0 }) => {
    return (
        <div className="bg-card border border-border-theme rounded-[3rem] p-10 space-y-8 relative group/chart shadow-2xl">
            <div className="absolute top-0 right-0 p-10 opacity-[0.02] group-hover:opacity-[0.05] transition-opacity duration-700">
                <Activity size={160} />
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
                <div className="space-y-1">
                    <h3 className="text-2xl font-black uppercase tracking-tight flex items-center gap-3">
                        <TrendingUp className="text-primary" size={24} /> Пульс оборота
                    </h3>
                    <p className="text-[10px] font-black text-foreground/30 uppercase tracking-[0.25em] pl-9">
                        Динамика объема сделок (тыс. ₽)
                    </p>
                </div>
                <div className="flex items-center gap-6 px-6 py-3 bg-foreground/[0.03] rounded-2xl border border-border-theme">
                    <div className="flex items-center gap-2.5">
                        <div className="w-2.5 h-2.5 rounded-full bg-primary shadow-lg shadow-primary/40" />
                        <span className="text-[10px] font-black uppercase text-foreground/50 tracking-widest">Общий объем</span>
                    </div>
                    <div className="w-[1px] h-4 bg-border-theme" />
                    <div className="text-[13px] font-black text-primary">
                        ₽ {(totalBudget / 1000000).toFixed(2)}M
                    </div>
                </div>
            </div>

            <ChartContainer id="revenue-pulse-chart" height={340} className="mt-6">
                <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                        <linearGradient id="colorVolume" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.4}/>
                            <stop offset="95%" stopColor="var(--primary)" stopOpacity={0}/>
                        </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="6 6" stroke="currentColor" className="opacity-[0.03]" vertical={false} />
                    <XAxis 
                        dataKey="name" 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{fill: 'currentColor', fontSize: 10, fontWeight: 900}}
                        className="opacity-30"
                        dy={15}
                    />
                    <YAxis hide domain={[0, 'auto']} />
                    <Tooltip 
                        cursor={{ stroke: 'var(--primary)', strokeWidth: 2, strokeDasharray: '5 5' }}
                        contentStyle={{ 
                            backgroundColor: 'var(--card)', 
                            border: '1px solid var(--border-theme)',
                            borderRadius: '1.5rem',
                            padding: '16px 20px',
                            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                            backdropFilter: 'blur(12px)'
                        }}
                        itemStyle={{ 
                            color: 'var(--primary)',
                            fontSize: '12px',
                            fontWeight: 900,
                            textTransform: 'uppercase',
                            letterSpacing: '0.1em'
                        }}
                        labelStyle={{
                            color: 'currentColor',
                            opacity: 0.4,
                            fontSize: '10px',
                            fontWeight: 900,
                            marginBottom: '8px',
                            textTransform: 'uppercase',
                            letterSpacing: '0.2em'
                        }}
                    />
                    <Area 
                        type="monotone" 
                        dataKey="volume" 
                        stroke="var(--primary)" 
                        strokeWidth={5}
                        fillOpacity={1} 
                        fill="url(#colorVolume)" 
                        animationDuration={2500}
                        activeDot={{ r: 8, stroke: 'var(--card)', strokeWidth: 4, fill: 'var(--primary)' }}
                    />
                </AreaChart>
            </ChartContainer>
        </div>
    );
};
