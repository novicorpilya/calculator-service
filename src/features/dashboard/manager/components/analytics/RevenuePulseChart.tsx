import React from 'react';
import { TrendingUp, Activity } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
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
        <div className="bg-card border border-border-theme rounded-[2rem] sm:rounded-[3rem] p-5 sm:p-10 space-y-6 sm:space-y-8 relative group/chart shadow-2xl">
            <div className="absolute top-0 right-0 p-6 sm:p-10 opacity-[0.02] group-hover:opacity-[0.05] transition-opacity duration-700">
                <Activity size={100} className="sm:hidden" />
                <Activity size={160} className="hidden sm:block" />
            </div>

            <div className="flex flex-col gap-4 sm:gap-6 relative z-10">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="space-y-1">
                        <h3 className="text-lg sm:text-2xl font-black uppercase tracking-tight flex items-center gap-2 sm:gap-3">
                            <TrendingUp className="text-primary" size={20} /> Пульс оборота
                        </h3>
                        <p className="text-[9px] sm:text-[10px] font-black text-foreground/50 uppercase tracking-[0.2em] sm:tracking-[0.25em] pl-7 sm:pl-9">
                            Динамика объема сделок (тыс. ₽)
                        </p>
                    </div>

                    <div className="flex items-center gap-2 sm:gap-4 flex-wrap">
                        <div className="flex items-center gap-3 sm:gap-6 px-4 sm:px-6 py-2 sm:py-3 bg-foreground/[0.03] rounded-xl sm:rounded-[1.5rem] border border-border-theme">
                            <div className="flex items-center gap-2 sm:gap-2.5">
                                <div className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-primary shadow-lg shadow-primary/40" />
                                <span className="text-[9px] sm:text-[10px] font-black uppercase text-foreground/40 tracking-widest">
                                    Итого
                                </span>
                            </div>
                            <div className="w-[1px] h-3 sm:h-4 bg-border-theme" />
                            <div className="text-[11px] sm:text-[13px] font-black text-primary">
                                ₽ {(totalBudget / 1000).toFixed(0)}K
                            </div>
                        </div>

                        <div className="hidden lg:flex items-center gap-3 px-4 py-2.5 bg-foreground/[0.02] rounded-2xl border border-border-theme/50 backdrop-blur-sm group/stat transition-all hover:bg-foreground/[0.04]">
                            <div className="flex flex-col items-end">
                                <span className="text-[7px] font-black uppercase text-foreground/50 tracking-[0.2em] leading-none mb-1">
                                    Средний чек
                                </span>
                                <div className="flex items-center gap-2">
                                    <div className="w-1 h-1 rounded-full bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.6)]" />
                                    <p className="text-[12px] font-black text-foreground/80 tracking-tight">
                                        ₽{' '}
                                        {data.length > 0
                                            ? (
                                                  data.reduce((acc, d) => acc + d.volume, 0) /
                                                  data.length
                                              ).toFixed(1)
                                            : 0}
                                        K
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <ChartContainer id="revenue-pulse-chart" height={340} className="mt-6">
                <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                        <linearGradient id="colorVolume" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.4} />
                            <stop offset="95%" stopColor="var(--primary)" stopOpacity={0} />
                        </linearGradient>
                    </defs>
                    <CartesianGrid
                        strokeDasharray="6 6"
                        stroke="currentColor"
                        className="opacity-[0.03]"
                        vertical={false}
                    />
                    <XAxis
                        dataKey="name"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: 'currentColor', fontSize: 10, fontWeight: 900 }}
                        className="opacity-30"
                        dy={15}
                    />
                    <YAxis hide domain={[0, 'auto']} />
                    <Tooltip
                        cursor={{
                            stroke: 'var(--primary)',
                            strokeWidth: 2,
                            strokeDasharray: '5 5',
                        }}
                        contentStyle={{
                            backgroundColor: 'var(--card)',
                            border: '1px solid var(--border-theme)',
                            borderRadius: '1.5rem',
                            padding: '16px 20px',
                            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                            backdropFilter: 'blur(12px)',
                        }}
                        itemStyle={{
                            color: 'var(--primary)',
                            fontSize: '12px',
                            fontWeight: 900,
                            textTransform: 'uppercase',
                            letterSpacing: '0.1em',
                        }}
                        labelStyle={{
                            color: 'currentColor',
                            opacity: 0.4,
                            fontSize: '10px',
                            fontWeight: 900,
                            marginBottom: '8px',
                            textTransform: 'uppercase',
                            letterSpacing: '0.2em',
                        }}
                    />
                    <Area
                        type="monotone"
                        dataKey="volume"
                        name="Оборот"
                        stroke="var(--primary)"
                        strokeWidth={5}
                        fillOpacity={1}
                        fill="url(#colorVolume)"
                        animationDuration={2500}
                        activeDot={{
                            r: 8,
                            stroke: 'var(--card)',
                            strokeWidth: 4,
                            fill: 'var(--primary)',
                        }}
                    />
                </AreaChart>
            </ChartContainer>
        </div>
    );
};
