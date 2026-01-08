import React, { useState, useMemo } from 'react';
import {
    Plus, Search, MessageSquare, LayoutGrid,
    List as ListIcon, ArrowUpRight,
    TrendingUp, FileCheck, Layers, Map, Clock, Briefcase
} from 'lucide-react';
import { type Calculation, OBJECT_TYPES } from '../../dashboard.types';
import { CalculationEntity } from '@/core/domain/CalculationEntity';
import { CalculationViewModel } from '@/features/dashboard/presentation/CalculationViewModel';

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

import { ModernStatusBadge } from '../../components/ModernStatusBadge';

export const ClientCalculationsList = React.memo<ClientCalculationsListProps>(({
    calculations,
    onSelect,
    onNewCalculation
}) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

    // Convert DTOs to VMs
    const viewModels = useMemo(() =>
        calculations.map(c => new CalculationViewModel(new CalculationEntity(c))),
        [calculations]
    );

    const stats = useMemo(() => ({
        total: viewModels.length,
        invoiced: viewModels.filter(c => c.status === 'invoice' || c.status === 'paid').length,
        totalArea: viewModels.reduce((acc, c) => acc + (c.totalArea || 0), 0),
        pending: viewModels.filter(c => c.status === 'sent' || c.status === 'changes').length
    }), [viewModels]);

    const filteredCalculations = viewModels.filter(vm => {
        const matchesSearch = vm.organizationName.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesFilter = filterStatus === 'all' || vm.status === filterStatus;
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
                <StatCard title="Выставлено Счетов" value={stats.invoiced} icon={<FileCheck className="w-6 h-6" />} color="text-emerald-600" />
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
                        <option value="revision">Правки внесены</option>
                        <option value="invoice">Выставлен счет</option>
                        <option value="paid">Оплачено</option>
                        <option value="shipping">В доставке</option>
                        <option value="completed">Завершено</option>
                        <option value="closed">Архив</option>
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
                    {filteredCalculations.map((vm, index) => (
                        <div
                            key={vm.id}
                            onClick={() => onSelect(vm.rawData)}
                            className={`
                                relative glass-card cursor-pointer overflow-hidden transition-all duration-500
                                hover:-translate-y-2 hover:shadow-2xl hover:border-primary/30 group
                                ${viewMode === 'list' ? 'flex flex-col lg:flex-row lg:items-center gap-6 lg:gap-10 p-6 lg:p-8' : 'flex flex-col justify-between'}
                            `}
                            style={{ animationDelay: `${index * 50}ms` }}
                        >
                            <div className={`flex justify-between items-start ${viewMode === 'list' ? 'w-full lg:w-auto lg:min-w-[200px]' : 'mb-6'}`}>
                                <div className="flex items-center gap-4">
                                    <div className="p-4 rounded-2xl bg-primary/10 text-primary group-hover:scale-110 transition-transform duration-500">
                                        <FileCheck className="w-8 h-8 font-black" />
                                    </div>
                                    <div className="space-y-1">
                                        <span className="text-[10px] font-black text-foreground/30 uppercase tracking-widest">PROJ-ID</span>
                                        <p className="font-mono text-xl font-black text-foreground/40 leading-none">#{String(index + 1).padStart(3, '0')}</p>
                                    </div>
                                </div>
                                <div className={viewMode === 'list' ? 'lg:hidden' : ''}>
                                    <ModernStatusBadge status={vm.status} />
                                </div>
                            </div>

                            <div className="flex-1 space-y-6 w-full">
                                <div>
                                    <div className="flex flex-wrap items-center gap-3 mb-3">
                                        <span className="text-[10px] font-black text-primary uppercase tracking-[0.2em] bg-primary/5 px-3 py-1 rounded-full">
                                            {OBJECT_TYPES.find(t => t.value === vm.type)?.label || 'Объект'}
                                        </span>
                                        {viewMode === 'list' && (
                                            <div className="hidden lg:block">
                                                <ModernStatusBadge status={vm.status} />
                                            </div>
                                        )}
                                        {vm.isNew && (
                                            <span className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-red-500/10 text-red-500 text-[9px] font-black uppercase tracking-widest">
                                                <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                                                New
                                            </span>
                                        )}
                                    </div>
                                    <h3 className="text-2xl font-black tracking-tight leading-tight line-clamp-2 group-hover:text-primary transition-colors duration-300">
                                        {vm.organizationName}
                                    </h3>
                                </div>

                                <div className={`grid gap-4 py-6 border-y border-border-theme ${viewMode === 'list' ? 'grid-cols-2 md:grid-cols-4 lg:grid-cols-3 xl:grid-cols-4 w-full' : 'grid-cols-2 sm:grid-cols-3'}`}>
                                    <div>
                                        <p className="text-[9px] font-black text-foreground/50 uppercase tracking-widest mb-1.5">Площадь</p>
                                        <p className="text-sm font-black flex items-center gap-1">
                                            {vm.totalArea}
                                            <span className="text-[10px] text-foreground/40">м²</span>
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-[9px] font-black text-foreground/50 uppercase tracking-widest mb-1.5">Зоны</p>
                                        <p className="text-sm font-black">{vm.zonesCount}</p>
                                    </div>
                                    <div className="col-span-2 sm:col-span-1">
                                        <p className="text-[9px] font-black text-foreground/50 uppercase tracking-widest mb-1.5">Бюджет</p>
                                        <p className="text-sm font-black text-primary">
                                            {vm.totalCostDisplay}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
                                    <div className="flex flex-wrap items-center gap-4 sm:gap-6">
                                        <div className="flex items-center gap-2 text-foreground/40" title="Дата создания">
                                            <Clock className="w-4 h-4" />
                                            <span className="text-[10px] font-black uppercase tracking-widest text-foreground/60">
                                                {vm.formattedDate}
                                            </span>
                                        </div>

                                        {vm.manager && vm.manager !== 'Назначается' && (
                                            <div className="flex items-center gap-2 text-foreground/40 pl-4 border-l border-border-theme" title="Менеджер">
                                                <Briefcase className="w-4 h-4 text-primary" />
                                                <span className="text-[10px] font-black uppercase tracking-widest text-foreground/60 max-w-[100px] truncate">{vm.manager}</span>
                                            </div>
                                        )}

                                        {vm.commentsCount > 0 && (
                                            <div className="flex items-center gap-2 text-primary pl-4 border-l border-border-theme">
                                                <MessageSquare className="w-4 h-4" />
                                                <span className="text-[10px] font-black uppercase tracking-widest">{vm.commentsCount}</span>
                                            </div>
                                        )}
                                    </div>

                                    {viewMode !== 'list' && (
                                        <div className="text-[10px] font-black uppercase tracking-[0.2em] text-foreground/40 group-hover:translate-x-1 transition-transform duration-300 flex items-center gap-2 opacity-0 group-hover:opacity-100">
                                            Открыть <ArrowUpRight className="w-3.5 h-3.5" />
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
});
