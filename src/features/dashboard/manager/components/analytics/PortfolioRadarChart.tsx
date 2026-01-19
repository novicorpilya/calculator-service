import React from 'react';
import { Layers } from 'lucide-react';
import {
    Radar,
    RadarChart,
    PolarGrid,
    PolarAngleAxis,
    Tooltip,
} from 'recharts';
import { ChartContainer } from '../../../../../components/ui/charts/ChartContainer';

interface RadarPoint {
    subject: string;
    A: number;
    fullMark: number;
}

interface PortfolioRadarChartProps {
    data: RadarPoint[];
    avgDealSize?: number;
}

export const PortfolioRadarChart: React.FC<PortfolioRadarChartProps> = ({ data, avgDealSize = 0 }) => {
    return (
        <div className="bg-card border border-border-theme rounded-[3.5rem] p-10 space-y-10 relative group/radar shadow-2xl">
            <div className="flex items-center justify-between relative z-10">
                <div className="space-y-1.5">
                    <h3 className="text-2xl font-black uppercase tracking-tight flex items-center gap-3">
                        <div className="p-2.5 bg-orange-500/10 rounded-xl">
                            <Layers className="text-orange-500" size={22} />
                        </div>
                        Экспертиза
                    </h3>
                    <div className="flex items-center gap-3 pl-14">
                        <p className="text-[10px] font-black text-foreground/30 uppercase tracking-[0.25em]">
                            Фокус портфеля
                        </p>
                    </div>
                </div>
                
                <div className="relative group/badge">
                    <div className="px-4 py-2.5 bg-foreground/[0.02] rounded-2xl border border-border-theme/50 backdrop-blur-sm flex flex-col items-end transition-all hover:bg-foreground/[0.04]">
                        <span className="text-[7px] font-black uppercase text-foreground/30 tracking-[0.2em] leading-none mb-1">Средний чек</span>
                        <div className="flex items-center gap-2">
                            <div className="w-1 h-1 rounded-full bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.6)]" />
                            <p className="text-[12px] font-black text-foreground/80 tracking-tight">
                                ₽ {(avgDealSize / 1000).toFixed(0)}K
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            <ChartContainer id="portfolio-radar-chart" height={360}>
                <RadarChart cx="50%" cy="50%" outerRadius="75%" data={data}>
                    <PolarGrid stroke="currentColor" className="opacity-[0.05]" />
                    <PolarAngleAxis 
                        dataKey="subject" 
                        tick={{fill: 'currentColor', fontSize: 9, fontWeight: 900}}
                        className="opacity-40"
                    />
                    <Radar
                        name="Проекты"
                        dataKey="A"
                        stroke="var(--primary)"
                        fill="var(--primary)"
                        fillOpacity={0.4}
                        strokeWidth={3}
                        animationDuration={2500}
                    />
                    <Tooltip 
                        contentStyle={{ 
                            backgroundColor: 'var(--card)', 
                            border: '1px solid var(--border-theme)',
                            borderRadius: '1rem',
                            fontSize: '10px',
                            fontWeight: 900,
                            textTransform: 'uppercase'
                        }}
                    />
                </RadarChart>
            </ChartContainer>
        </div>
    );
};
