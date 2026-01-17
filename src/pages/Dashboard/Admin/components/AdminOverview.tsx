import React from 'react';
import { 
    TrendingUp, 
    Wallet, 
    Briefcase, 
    Activity, 
    Users, 
    AlertCircle, 
    ChevronRight,
    ArrowUpRight,
    Ban,
    Clock
} from 'lucide-react';
import type { SystemStats } from '@/services/admin.service';
import type { User } from '@/features/auth/auth.types';
import type { Invitation } from '@/services/admin.service';

interface AdminOverviewProps {
    stats: SystemStats | null;
    users: User[];
    invitations: Invitation[];
    onNavigate: (page: string) => void;
}

export const AdminOverview: React.FC<AdminOverviewProps> = ({ stats, users, invitations, onNavigate }) => {
    return (
        <div className="space-y-8 animate-in fade-in duration-700 pb-20 relative">
             {/* Header Section */}
             <div className="flex flex-col gap-2 relative z-10">
                <h2 className="text-2xl font-black tracking-tight flex items-center gap-3">
                   <div className="p-3 bg-gradient-to-br from-primary/20 to-primary/5 rounded-2xl text-primary ring-1 ring-primary/20">
                        <Activity size={24} />
                   </div>
                   Обзор Системы
                </h2>
                <p className="text-muted-foreground text-sm font-medium ml-1">
                    Ключевые показатели и метрики активности
                </p>
            </div>

            {/* Senior Analytics Pulse */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 relative z-10">
                <div className="group bg-card hover:bg-card/80 border border-border-theme hover:border-emerald-500/30 rounded-[2rem] p-6 transition-all duration-500 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 opacity-0 group-hover:opacity-100 transition-opacity" />
                    
                    <div className="flex items-start justify-between mb-4 relative z-10">
                        <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-500 group-hover:scale-110 transition-transform shadow-sm">
                            <TrendingUp size={24} />
                        </div>
                        {stats?.budgetGrowth !== undefined && (
                            <div className={`flex items-center gap-1 text-[10px] font-black px-2 py-1 rounded-full uppercase tracking-widest bg-emerald-500/10 text-emerald-500 ring-1 ring-emerald-500/20`}>
                                <ArrowUpRight size={10} />
                                {Math.round(stats.budgetGrowth)}%
                            </div>
                        )}
                    </div>
                    <div className="relative z-10">
                         <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground mb-2">
                            Общий бюджет
                        </p>
                        <p className="text-3xl font-black tracking-tighter">
                            {stats?.totalGlobalBudget
                                ? new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 0 }).format(stats.totalGlobalBudget)
                                : '0'}
                            <span className="text-lg text-muted-foreground/40 font-bold ml-1">₽</span>
                        </p>
                    </div>
                </div>

                <div className="group bg-card hover:bg-card/80 border border-border-theme hover:border-indigo-500/30 rounded-[2rem] p-6 transition-all duration-500 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 opacity-0 group-hover:opacity-100 transition-opacity" />
                    
                    <div className="flex items-start justify-between mb-4 relative z-10">
                        <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-500 group-hover:scale-110 transition-transform shadow-sm">
                            <Wallet size={24} />
                        </div>
                    </div>
                    <div className="relative z-10">
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground mb-2">
                            Выручка (Pipeline)
                        </p>
                        <p className="text-3xl font-black tracking-tighter">
                            {stats?.revenuePipeline
                                ? new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 0 }).format(stats.revenuePipeline)
                                : '0'}
                            <span className="text-lg text-muted-foreground/40 font-bold ml-1">₽</span>
                        </p>
                    </div>
                </div>

                <div className="group bg-card hover:bg-card/80 border border-border-theme hover:border-amber-500/30 rounded-[2rem] p-6 transition-all duration-500 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 opacity-0 group-hover:opacity-100 transition-opacity" />

                    <div className="flex items-start justify-between mb-4 relative z-10">
                        <div className="w-12 h-12 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-500 group-hover:scale-110 transition-transform shadow-sm">
                            <Briefcase size={24} />
                        </div>
                         <div className="flex items-center gap-1 text-[10px] font-black px-2 py-1 rounded-full uppercase tracking-widest bg-amber-500/10 text-amber-500 ring-1 ring-amber-500/20">
                            Active
                        </div>
                    </div>
                    <div className="relative z-10">
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground mb-2">
                            В работе
                        </p>
                        <p className="text-3xl font-black tracking-tighter">
                            {stats?.activeProjects || 0}
                            <span className="text-sm text-muted-foreground/40 font-bold ml-2">проектов</span>
                        </p>
                    </div>
                </div>

                <div className="group bg-card hover:bg-card/80 border border-border-theme hover:border-primary/30 rounded-[2rem] p-6 transition-all duration-500 relative overflow-hidden">
                     <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 opacity-0 group-hover:opacity-100 transition-opacity" />

                    <div className="flex items-start justify-between mb-4 relative z-10">
                        <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform shadow-sm">
                            <Activity size={24} />
                        </div>
                    </div>
                     <div className="relative z-10">
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground mb-2">
                            Всего расчетов
                        </p>
                        <p className="text-3xl font-black tracking-tighter">
                            {stats?.totalProjects || 0}
                            <span className="text-sm text-muted-foreground/40 font-bold ml-2">за все время</span>
                        </p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 relative z-10">
                {/* Pipeline Health */}
                <div className="xl:col-span-2 space-y-6">
                    <h3 className="text-xs font-black uppercase tracking-[0.3em] text-muted-foreground ml-2">
                        Здоровье воронки
                    </h3>
                    <div className="bg-card border border-border-theme rounded-[2.5rem] p-8 overflow-hidden relative">
                         <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3" />

                        <div className="space-y-6 relative z-10">
                            {[
                                {
                                    label: 'Черновики',
                                    count: stats?.stages?.draft || 0,
                                    color: 'bg-primary/20',
                                    textColor: 'text-primary'
                                },
                                {
                                    label: 'Отправлены',
                                    count: stats?.stages?.sent || 0,
                                    color: 'bg-blue-500/20',
                                    textColor: 'text-blue-500'
                                },
                                {
                                    label: 'Экспертиза',
                                    count: stats?.stages?.expert || 0,
                                    color: 'bg-indigo-500/20',
                                    textColor: 'text-indigo-500'
                                },
                                {
                                    label: 'Завершены',
                                    count: stats?.stages?.completed || 0,
                                    color: 'bg-emerald-500/20',
                                    textColor: 'text-emerald-500'
                                },
                            ].map((stage) => {
                                const percentage =
                                    (stats?.totalProjects || 0) > 0
                                        ? Math.round((stage.count / (stats?.totalProjects || 1)) * 100)
                                        : 0;

                                return (
                                    <div key={stage.label} className="group">
                                        <div className="flex justify-between items-end mb-2">
                                            <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground/80 group-hover:text-foreground transition-colors">
                                                {stage.label}
                                            </span>
                                            <div className="flex items-center gap-2">
                                                <span className={`text-xs font-black ${stage.textColor}`}>
                                                    {stage.count}
                                                </span>
                                                <span className="text-[10px] font-bold text-muted-foreground/40">
                                                    ({percentage}%)
                                                </span>
                                            </div>
                                        </div>
                                        <div className="h-3 w-full bg-muted/50 rounded-full overflow-hidden">
                                            <div
                                                className={`h-full rounded-full transition-all duration-1000 ease-out group-hover:brightness-110 ${stage.color.replace('/20', '')}`}
                                                style={{ width: `${percentage}%` }}
                                            />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                         <div className="mt-8 pt-6 border-t border-border-theme/50 flex justify-end">
                            <button
                                onClick={() => onNavigate('projects')}
                                className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:text-primary transition-colors group"
                            >
                                Перейти к проектам
                                <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Team & Activity Pulse */}
                <div className="space-y-6">
                    <h3 className="text-xs font-black uppercase tracking-[0.3em] text-muted-foreground ml-2">
                        Активность
                    </h3>
                    <div className="bg-card border border-border-theme rounded-[2.5rem] p-6 relative overflow-hidden flex flex-col gap-4 min-h-[300px]">
                        
                        {/* Users Stats */}
                         <div className="flex items-center justify-between p-4 rounded-2xl bg-muted/20 border border-white/5 hover:border-primary/20 transition-all cursor-pointer group" onClick={() => onNavigate('team')}>
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-indigo-500/10 text-indigo-500 rounded-xl group-hover:scale-110 transition-transform">
                                    <Users size={20} />
                                </div>
                                <div>
                                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Пользователи</p>
                                    <p className="text-xl font-black">{users.length}</p>
                                </div>
                            </div>
                            <ChevronRight size={16} className="text-muted-foreground/30 group-hover:text-primary group-hover:translate-x-1 transition-all" />
                        </div>

                         {/* Pending Invites */}
                         <div className="flex items-center justify-between p-4 rounded-2xl bg-muted/20 border border-white/5 hover:border-amber-500/20 transition-all cursor-pointer group" onClick={() => onNavigate('team')}>
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-amber-500/10 text-amber-500 rounded-xl group-hover:scale-110 transition-transform">
                                    <Clock size={20} />
                                </div>
                                <div>
                                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Ожидают</p>
                                    <p className="text-xl font-black">{invitations.filter((i) => i.status === 'pending').length}</p>
                                </div>
                            </div>
                            {invitations.filter((i) => i.status === 'pending').length > 0 && (
                                <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse" />
                            )}
                        </div>

                         {/* Blocked Users */}
                        <div className="flex items-center justify-between p-4 rounded-2xl bg-muted/20 border border-white/5 hover:border-red-500/20 transition-all cursor-pointer group" onClick={() => onNavigate('team')}>
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-red-500/10 text-red-500 rounded-xl group-hover:scale-110 transition-transform">
                                    <Ban size={20} />
                                </div>
                                <div>
                                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Блокировки</p>
                                    <p className="text-xl font-black">{users.filter(u => u.status === 'blocked').length}</p>
                                </div>
                            </div>
                        </div>

                        <div className="mt-auto">
                            <button
                                onClick={() => onNavigate('team')}
                                className="w-full py-3 rounded-xl bg-gradient-to-r from-primary/10 to-primary/5 hover:from-primary/20 hover:to-primary/10 text-xs font-black uppercase tracking-widest text-primary transition-all flex items-center justify-center gap-2 group border border-primary/20"
                            >
                                <AlertCircle size={14} className="group-hover:rotate-12 transition-transform" />
                                Управление командой
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
