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
                <div className="space-y-1">
                    <h3 className="text-2xl font-black uppercase tracking-tight flex items-center gap-3">
                        <Layers className="text-orange-500" size={24} /> Экспертиза
                    </h3>
                    <p className="text-[10px] font-black text-foreground/30 uppercase tracking-[0.25em]">
                        Фокус портфеля
                    </p>
                </div>
                <div className="px-4 py-2 bg-orange-500/10 rounded-xl border border-orange-500/10">
                    <p className="text-[11px] font-black text-orange-500 uppercase">
                        ₽ {(avgDealSize / 1000).toFixed(0)}K <span className="opacity-40 ml-1">Средний</span>
                    </p>
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
