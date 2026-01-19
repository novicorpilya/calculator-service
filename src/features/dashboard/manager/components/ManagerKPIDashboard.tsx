import React from 'react';
import { Target, RotateCcw } from 'lucide-react';
import { useManagerKPI } from '../hooks/useManagerKPI';
import { KPIStatsGrid } from './kpi/KPIStatsGrid';
import { PerformanceBreakdown } from './kpi/PerformanceBreakdown';
import { RecentReviews } from './kpi/RecentReviews';

import { KPISkeleton } from './kpi/KPISkeleton';

export const ManagerKPIDashboard: React.FC<{ managerId: string }> = ({ managerId }) => {
    const { 
        data, 
        loading, 
        isRefreshing, 
        refreshData
    } = useManagerKPI(managerId);

    if (loading) {
        return <KPISkeleton />;
    }

    return (
        <div className="space-y-10 animate-in fade-in slide-in-from-top-4 duration-1000">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-2 border-b border-border-theme/50">
                <div>
                    <div className="flex items-center gap-3 mb-1">
                        <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20">
                            <Target size={20} className="animate-pulse" />
                        </div>
                        <h1 className="text-3xl font-black tracking-tighter text-foreground/90">Личный KPI</h1>
                    </div>
                    <p className="text-xs font-bold text-foreground/30 uppercase tracking-[0.2em]">Ваш дашборд эффективности</p>
                </div>
                
                <button 
                    onClick={refreshData}
                    disabled={isRefreshing}
                    className="group flex items-center gap-2 px-4 py-2 bg-background border border-border-theme rounded-2xl text-[10px] font-black uppercase tracking-widest hover:border-primary/50 hover:text-primary transition-all disabled:opacity-50"
                >
                    <RotateCcw size={14} className={isRefreshing ? 'animate-spin' : 'group-hover:rotate-180 transition-transform duration-500'} />
                    <span>Обновить данные</span>
                </button>
            </div>

            {/* Stats Grid */}
            <KPIStatsGrid data={data} />

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
                <PerformanceBreakdown data={data} />
                <RecentReviews data={data} />
            </div>

            <style>{`
                @keyframes blob {
                    0% { transform: scale(1) translate(0px, 0px); }
                    33% { transform: scale(1.1) translate(30px, -50px); }
                    66% { transform: scale(0.9) translate(-20px, 20px); }
                    100% { transform: scale(1) translate(0px, 0px); }
                }
                .animate-blob {
                    animation: blob 7s infinite;
                }
                .animation-delay-2000 {
                    animation-delay: 2s;
                }
                .custom-scrollbar::-webkit-scrollbar {
                    width: 4px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: rgba(0,0,0,0.05);
                    border-radius: 10px;
                }
            `}</style>
        </div>
    );
};
