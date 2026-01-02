import React, { useState, useMemo } from 'react';
import {
    Plus, Search, MessageSquare, LayoutGrid,
    List as ListIcon, ArrowUpRight,
    TrendingUp, FileCheck, Layers, Map, Clock, Briefcase
} from 'lucide-react';
import { type Calculation, OBJECT_TYPES } from '../../dashboard.types';

interface ClientCalculationsListProps {
    calculations: Calculation[];
    onSelect: (calc: Calculation) => void;
    onNewCalculation: () => void;
}

const StatCard: React.FC<{ title: string; value: string | number; icon: React.ReactNode; color: string }> = ({
    title, value, icon, color
}) => (
    <div className="glass-card flex flex-col justify-between group">
        <div className="flex justify-between items-start mb-6">
            <div className={`p-4 rounded-[1.25rem] ${color} bg-opacity-20 text-opacity-100 group-hover:scale-110 transition-transform`}>
                {icon}
            </div>
            <ArrowUpRight className="w-5 h-5 opacity-20 group-hover:opacity-100 transition-opacity" />
        </div>
        <div>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-foreground/60 mb-2">{title}</p>
            <h4 className="text-[clamp(1.5rem,4vw,2rem)] font-black leading-none">{value}</h4>
        </div>
    </div>
);

export const ModernStatusBadge: React.FC<{ status: Calculation['status'] }> = ({ status }) => {
    const config = {
        draft: { label: 'Черновик', color: 'bg-slate-400', ghost: 'bg-card text-foreground/60' },
        sent: { label: 'Отправлен', color: 'bg-primary', ghost: 'bg-primary/10 text-primary' },
        changes: { label: 'Правки', color: 'bg-orange-500', ghost: 'bg-orange-500/10 text-orange-600' },
        revision: { label: 'Правки внесены', color: 'bg-purple-500', ghost: 'bg-purple-500/10 text-purple-600' },
        approved: { label: 'Утвержден', color: 'bg-emerald-500', ghost: 'bg-emerald-500/10 text-emerald-600' },
    }[status];

    return (
        <div className={`px-4 py-1.5 rounded-full ${config.ghost} text-[10px] font-black uppercase tracking-widest flex items-center gap-2 border border-current border-opacity-10`}>
            <span className={`w-2 h-2 rounded-full ${config.color} animate-pulse`} />
            {config.label}
        </div>
    );
};

export const ClientCalculationsList = React.memo<ClientCalculationsListProps>(({
    calculations,
    onSelect,
    onNewCalculation
}) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

    const stats = useMemo(() => ({
        total: calculations.length,
        approved: calculations.filter(c => c.status === 'approved').length,
        totalArea: calculations.reduce((acc, c) => acc + (c.totalArea || 0), 0),
        pending: calculations.filter(c => c.status === 'sent' || c.status === 'changes').length
    }), [calculations]);

    const filteredCalculations = calculations.filter(calc => {
        const matchesSearch = calc.organizationName.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesFilter = filterStatus === 'all' || calc.status === filterStatus;
        return matchesSearch && matchesFilter;
    });

    return (
        <div className="space-y-[clamp(2rem,8vh,5rem)] animate-in fade-in slide-in-from-bottom-8 duration-1000">
            {/* Header Section - Fluid Flex */}
            <div className="flex flex-wrap items-end justify-between gap-8">
                <div className="space-y-4 max-w-2xl">
                    <h1 className="text-[clamp(2rem,6vw,4rem)]">Мои проекты</h1>
                    <p className="text-foreground/70 font-bold leading-relaxed uppercase text-[10px] sm:text-xs tracking-widest border-l-4 border-primary pl-4 sm:pl-6">
                        Интеллектуальное управление HoReCa инвентарем
                    </p>
                </div>
                <button onClick={onNewCalculation} className="btn-premium w-full sm:w-auto">
                    <Plus className="w-5 h-5" /> Новый проект
                </button>
            </div>

            {/* Quick Stats Grid - Auto-fit */}
            <div className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-4 sm:gap-6">
                <StatCard title="Всего объектов" value={stats.total} icon={<Layers className="w-6 h-6" />} color="text-primary" />
                <StatCard title="Общая площадь" value={`${stats.totalArea} м²`} icon={<Map className="w-6 h-6" />} color="text-primary" />
                <StatCard title="Утверждено" value={stats.approved} icon={<FileCheck className="w-6 h-6" />} color="text-emerald-600" />
                <StatCard title="В работе" value={stats.pending} icon={<TrendingUp className="w-6 h-6" />} color="text-orange-600" />
            </div>

            {/* Filter Bar - Fluid Layout */}
            <div className="flex flex-wrap items-center justify-between gap-4 sm:gap-6 bg-card border border-border-theme p-3 sm:p-4 rounded-[1.5rem] sm:rounded-[2rem]">
                <div className="flex-1 min-w-[min(100%,240px)] relative">
                    <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-foreground/40" />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Поиск по названию..."
                        className="input-premium pl-16"
                    />
                </div>

                <div className="flex flex-wrap items-center gap-4 w-full lg:w-auto">
                    <select
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                        className="input-premium w-full lg:w-60 appearance-none cursor-pointer"
                    >
                        <option value="all">Все статусы</option>
                        <option value="draft">Черновики</option>
                        <option value="sent">На проверке</option>
                        <option value="changes">Требуют правок</option>
                        <option value="approved">Утверждены</option>
                    </select>

                    <div className="flex bg-card p-2 rounded-2xl border border-border-theme">
                        <button
                            onClick={() => setViewMode('grid')}
                            className={`p-3 rounded-xl transition-all ${viewMode === 'grid' ? 'bg-primary text-white shadow-xl' : 'text-foreground/40 hover:text-primary'}`}
                        >
                            <LayoutGrid className="w-5 h-5" />
                        </button>
                        <button
                            onClick={() => setViewMode('list')}
                            className={`p-3 rounded-xl transition-all ${viewMode === 'list' ? 'bg-primary text-white shadow-xl' : 'text-foreground/40 hover:text-primary'}`}
                        >
                            <ListIcon className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            </div>

            {filteredCalculations.length === 0 ? (
                <div className="text-center py-32 bg-card rounded-[3rem] border-4 border-dashed border-border-theme">
                    <div className="w-24 h-24 bg-background rounded-full flex items-center justify-center mx-auto mb-8">
                        <Search className="w-10 h-10 text-foreground/20" />
                    </div>
                    <h3 className="text-2xl font-black mb-2">Проекты не найдены</h3>
                    <p className="text-foreground/60 font-bold uppercase text-[10px] tracking-widest">Измените поиск или создайте новый проект</p>
                </div>
            ) : (
                <div className={viewMode === 'grid'
                    ? "grid grid-cols-[repeat(auto-fit,minmax(min(100%,300px),1fr))] gap-6 sm:gap-8"
                    : "space-y-6"
                }>
                    {filteredCalculations.map((calc, index) => (
                        <div
                            key={calc.id}
                            onClick={() => onSelect(calc)}
                            className={`
                                relative glass-card cursor-pointer overflow-hidden transition-all duration-500
                                hover:-translate-y-3 hover:shadow-2xl hover:border-primary/30
                                ${viewMode === 'list' ? 'flex flex-wrap items-center gap-10 p-8' : ''}
                            `}
                            style={{ animationDelay: `${index * 50}ms` }}
                        >
                            <div className={`flex justify-between items-start mb-8 ${viewMode === 'list' ? 'mb-0' : ''}`}>
                                <div className="p-5 rounded-2xl bg-primary/10 text-primary">
                                    <FileCheck className="w-8 h-8 font-black" />
                                </div>
                                <ModernStatusBadge status={calc.status} />
                            </div>

                            <div className="flex-1 space-y-6">
                                <div>
                                    <div className="flex items-center gap-3 mb-2">
                                        <span className="text-[10px] font-black text-primary uppercase tracking-[0.2em]">
                                            {OBJECT_TYPES.find(t => t.value === calc.type)?.label || 'Объект'}
                                        </span>
                                        {calc.unreadComments > 0 && (
                                            <span className="w-2.5 h-2.5 rounded-full bg-red-500 shadow-lg shadow-red-500/50" />
                                        )}
                                    </div>
                                    <h3 className="text-2xl font-black tracking-tight line-clamp-1">
                                        {calc.organizationName}
                                    </h3>
                                </div>

                                <div className="grid grid-cols-1 min-[400px]:grid-cols-3 gap-6 py-6 border-y border-border-theme">
                                    <div>
                                        <p className="text-[9px] font-black text-foreground/50 uppercase tracking-widest mb-1.5">Площадь</p>
                                        <p className="text-sm font-black">{calc.totalArea} м²</p>
                                    </div>
                                    <div>
                                        <p className="text-[9px] font-black text-foreground/50 uppercase tracking-widest mb-1.5">Зоны</p>
                                        <p className="text-sm font-black">{calc.zonesCount}</p>
                                    </div>
                                    <div>
                                        <p className="text-[9px] font-black text-foreground/50 uppercase tracking-widest mb-1.5">Бюджет</p>
                                        <p className="text-sm font-black text-primary">
                                            {calc.totalCost ? `${calc.totalCost.toLocaleString()} ₽` : '—'}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between pt-2">
                                    <div className="flex items-center gap-6">
                                        <div className="flex items-center gap-2 text-foreground/40">
                                            <Clock className="w-4 h-4" />
                                            <span className="text-[10px] font-black uppercase tracking-widest text-foreground/60">{calc.createdDate}</span>
                                        </div>
                                        {calc.manager && calc.manager !== 'Назначается' && (
                                            <div className="flex items-center gap-2 text-foreground/40 border-l border-border-theme pl-6">
                                                <Briefcase className="w-4 h-4 text-primary" />
                                                <span className="text-[10px] font-black uppercase tracking-widest text-foreground/60">{calc.manager}</span>
                                            </div>
                                        )}
                                        {calc.comments.length > 0 && (
                                            <div className="flex items-center gap-2 text-primary">
                                                <MessageSquare className="w-4 h-4" />
                                                <span className="text-[10px] font-black uppercase tracking-widest">{calc.comments.length}</span>
                                            </div>
                                        )}
                                    </div>
                                    <div className="text-[10px] font-black uppercase tracking-[0.2em] text-foreground/40 group-hover:text-primary transition-colors">
                                        Подробнее <ArrowUpRight className="inline w-4 h-4 ml-1" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
});
