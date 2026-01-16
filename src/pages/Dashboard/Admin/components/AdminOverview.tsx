import React from 'react';
import { TrendingUp, Wallet, Briefcase, Activity, CheckCircle2, Users, AlertCircle, ChevronRight } from 'lucide-react';
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
        <div className="space-y-12 animate-in fade-in duration-700">
            {/* Senior Analytics Pulse */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="glass-card group hover:border-primary/50 transition-all duration-500">
                    <div className="flex items-start justify-between mb-4">
                        <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                            <TrendingUp size={24} />
                        </div>
                        <span className="text-[10px] font-black text-emerald-500 bg-emerald-500/10 px-2 py-1 rounded-full uppercase tracking-widest">
                            +12%
                        </span>
                    </div>
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-foreground/40 mb-1">
                        Общий бюджет проектов
                    </p>
                    <p className="text-3xl font-black tracking-tighter">
                        {stats?.totalGlobalBudget
                            ? Math.round(stats.totalGlobalBudget).toLocaleString()
                            : '0'}{' '}
                        <span className="text-sm text-foreground/30 ml-1">₽</span>
                    </p>
                </div>

                <div className="glass-card group hover:border-indigo-500/50 transition-all duration-500">
                    <div className="flex items-start justify-between mb-4">
                        <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-500 group-hover:scale-110 transition-transform">
                            <Wallet size={24} />
                        </div>
                    </div>
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-foreground/40 mb-1">
                        Выставлено счетов
                    </p>
                    <p className="text-3xl font-black tracking-tighter">
                        {stats?.revenuePipeline
                            ? Math.round(stats.revenuePipeline).toLocaleString()
                            : '0'}{' '}
                        <span className="text-sm text-foreground/30 ml-1">₽</span>
                    </p>
                </div>

                <div className="glass-card group hover:border-emerald-500/50 transition-all duration-500">
                    <div className="flex items-start justify-between mb-4">
                        <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-500 group-hover:scale-110 transition-transform">
                            <Briefcase size={24} />
                        </div>
                    </div>
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-foreground/40 mb-1">
                        Активные проекты
                    </p>
                    <p className="text-3xl font-black tracking-tighter">
                        {stats?.activeProjects || 0}
                    </p>
                </div>

                <div className="glass-card group hover:border-amber-500/50 transition-all duration-500">
                    <div className="flex items-start justify-between mb-4">
                        <div className="w-12 h-12 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-500 group-hover:scale-110 transition-transform">
                            <Activity size={24} />
                        </div>
                    </div>
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-foreground/40 mb-1">
                        Всего расчетов
                    </p>
                    <p className="text-3xl font-black tracking-tighter">
                        {stats?.totalProjects || 0}
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                {/* Pipeline Health */}
                <div className="xl:col-span-2 space-y-6">
                    <h3 className="text-xs font-black uppercase tracking-[0.3em] text-foreground/40 ml-2">
                        Здоровье воронки продаж
                    </h3>
                    <div className="glass-card !p-8">
                        <div className="space-y-8">
                            {[
                                {
                                    label: 'Черновики',
                                    count: stats?.stages?.draft || 0,
                                    color: 'bg-foreground/10',
                                },
                                {
                                    label: 'На проверке экспертом',
                                    count: stats?.stages?.expert || 0,
                                    color: 'bg-indigo-500',
                                },
                                {
                                    label: 'Подбор поставщиков',
                                    count: stats?.stages?.suppliers || 0,
                                    color: 'bg-amber-500',
                                },
                                {
                                    label: 'Выставление счета',
                                    count: stats?.stages?.invoice || 0,
                                    color: 'bg-emerald-500',
                                },
                                {
                                    label: 'Завершено',
                                    count: stats?.stages?.completed || 0,
                                    color: 'bg-primary',
                                },
                            ].map((stage, idx) => {
                                const percentage = stats?.totalProjects
                                    ? (stage.count / stats.totalProjects) * 100
                                    : 0;
                                return (
                                    <div key={idx} className="space-y-2">
                                        <div className="flex justify-between items-end">
                                            <span className="text-[11px] font-black uppercase tracking-widest">
                                                {stage.label}
                                            </span>
                                            <span className="text-lg font-black">
                                                {stage.count}
                                            </span>
                                        </div>
                                        <div className="h-3 bg-background border border-border-theme rounded-full overflow-hidden p-0.5">
                                            <div
                                                className={`h-full ${stage.color} rounded-full transition-all duration-1000 ease-out shadow-sm`}
                                                style={{ width: `${Math.max(percentage, 2)}%` }}
                                            />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* System Vitality */}
                <div className="space-y-6">
                    <h3 className="text-xs font-black uppercase tracking-[0.3em] text-foreground/40 ml-2">
                        Витальность системы
                    </h3>
                    <div className="glass-card !p-6 space-y-6">
                        <div className="flex items-center gap-4 p-4 rounded-2xl bg-emerald-500/5 border border-emerald-500/10">
                            <CheckCircle2 className="text-emerald-500 w-5 h-5 shrink-0" />
                            <div>
                                <p className="text-[10px] font-black uppercase tracking-widest leading-none mb-1">
                                    База данных
                                </p>
                                <p className="text-[10px] font-bold text-foreground/40 uppercase">
                                    Статус: В норме (Latency 24ms)
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-4 p-4 rounded-2xl bg-indigo-500/5 border border-indigo-500/10">
                            <Users className="text-indigo-500 w-5 h-5 shrink-0" />
                            <div>
                                <p className="text-[10px] font-black uppercase tracking-widest leading-none mb-1">
                                    Менеджеры онлайн
                                </p>
                                <p className="text-[10px] font-bold text-foreground/40 uppercase">
                                    {users.filter((u) => u.role === 'manager').length} активных
                                    специалистов
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-4 p-4 rounded-2xl bg-amber-500/5 border border-amber-500/10">
                            <AlertCircle className="text-amber-500 w-5 h-5 shrink-0" />
                            <div>
                                <p className="text-[10px] font-black uppercase tracking-widest leading-none mb-1">
                                    Просроченные инвайты
                                </p>
                                <p className="text-[10px] font-bold text-foreground/40 uppercase">
                                    {invitations.filter((i) => i.status === 'expired').length}{' '}
                                    ссылок требуют внимания
                                </p>
                            </div>
                        </div>

                        <button
                            onClick={() => onNavigate('team')}
                            className="w-full btn-premium py-4 group"
                        >
                            Управление командой{' '}
                            <ChevronRight
                                size={14}
                                className="group-hover:translate-x-1 transition-transform"
                            />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
