import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { ChartContainer } from '@/components/ui/charts/ChartContainer';
import { formatCurrency } from '@/core/domain/calculator.utils';

interface TrendChartProps {
    data: { name: string; value: number }[];
}

export const TrendChart: React.FC<TrendChartProps> = ({ data }) => {
    if (!data || data.length === 0) return null;

    return (
        <div className="bg-card border border-border-theme p-10 rounded-[3rem] space-y-8">
            <div className="space-y-1">
                <h3 className="text-xl font-black uppercase tracking-tight">Динамика расходов</h3>
                <p className="text-[10px] font-black text-foreground/50 uppercase tracking-[0.2em]">
                    Ежемесячный объем закупок
                </p>
            </div>

            <ChartContainer id="trend-area-chart" height={300}>
                <AreaChart data={data}>
                    <defs>
                        <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="var(--primary)" stopOpacity={0} />
                        </linearGradient>
                    </defs>
                    <CartesianGrid
                        strokeDasharray="3 3"
                        vertical={false}
                        stroke="var(--border-theme)"
                    />
                    <XAxis
                        dataKey="name"
                        axisLine={false}
                        tickLine={false}
                        tick={{
                            fontSize: 9,
                            fontWeight: 900,
                            fill: 'var(--foreground)',
                            opacity: 0.3,
                        }}
                        dy={10}
                        tickFormatter={(val: string) => val.substring(0, 3).toUpperCase()}
                    />
                    <YAxis
                        axisLine={false}
                        tickLine={false}
                        tick={{
                            fontSize: 9,
                            fontWeight: 900,
                            fill: 'var(--foreground)',
                            opacity: 0.3,
                        }}
                        tickFormatter={(val) => `${val / 1000}k`}
                    />
                    <Tooltip
                        contentStyle={{
                            backgroundColor: 'var(--card)',
                            border: '1px solid var(--border-theme)',
                            borderRadius: '1.5rem',
                            boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
                            color: 'var(--foreground)',
                        }}
                        labelStyle={{
                            fontSize: '10px',
                            fontWeight: '900',
                            textTransform: 'uppercase',
                            marginBottom: '4px',
                            color: 'var(--foreground)',
                        }}
                        itemStyle={{ fontSize: '12px', fontWeight: '900', color: 'var(--primary)' }}
                        formatter={(val: number | string | undefined) => [
                            formatCurrency(Number(val || 0)),
                            'Объем',
                        ]}
                    />
                    <Area
                        type="monotone"
                        dataKey="value"
                        stroke="var(--primary)"
                        strokeWidth={4}
                        fillOpacity={1}
                        fill="url(#colorValue)"
                    />
                </AreaChart>
            </ChartContainer>
        </div>
    );
};
