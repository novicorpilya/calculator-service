import React from 'react';
import { PieChart, Pie, Cell, Tooltip, Legend } from 'recharts';
import { ChartContainer } from '@/components/ui/charts/ChartContainer';

interface CategoryChartProps {
    data: { category: string; value: number; percentage: number }[];
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

export const CategoryChart: React.FC<CategoryChartProps> = ({ data }) => {
    if (!data || data.length === 0) {
        return (
            <div className="h-[300px] flex items-center justify-center text-foreground/20 uppercase text-[10px] font-black tracking-widest bg-card/30 rounded-[2rem] border-2 border-dashed border-border-theme">
                Нет данных для анализа
            </div>
        );
    }

    return (
        <div className="bg-card border border-border-theme p-10 rounded-[3rem] space-y-8">
            <div className="space-y-1 text-center">
                <h3 className="text-xl font-black uppercase tracking-tight">
                    Распределение категорий
                </h3>
                <p className="text-[10px] font-black text-foreground/50 uppercase tracking-[0.2em]">
                    Объем закупок по типам товаров
                </p>
            </div>

            <ChartContainer id="category-pie-chart" height={350}>
                <PieChart>
                    <Pie
                        data={data}
                        cx="50%"
                        cy="50%"
                        innerRadius={80}
                        outerRadius={120}
                        paddingAngle={8}
                        dataKey="value"
                        nameKey="category"
                        stroke="none"
                    >
                        {data.map((_, index) => (
                            <Cell
                                key={`cell-${index}`}
                                fill={COLORS[index % COLORS.length]}
                                className="hover:opacity-80 transition-opacity outline-none"
                            />
                        ))}
                    </Pie>
                    <Tooltip
                        contentStyle={{
                            backgroundColor: 'var(--card)',
                            border: '1px solid var(--border-theme)',
                            borderRadius: '1.5rem',
                            padding: '12px 16px',
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
                        itemStyle={{
                            fontSize: '12px',
                            fontWeight: '900',
                            textTransform: 'uppercase',
                            letterSpacing: '0.05em',
                            color: 'var(--primary)',
                        }}
                    />
                    <Legend
                        verticalAlign="bottom"
                        align="center"
                        formatter={(value) => (
                            <span className="text-[10px] font-black text-foreground/60 uppercase tracking-widest ml-1">
                                {value}
                            </span>
                        )}
                    />
                </PieChart>
            </ChartContainer>
        </div>
    );
};
