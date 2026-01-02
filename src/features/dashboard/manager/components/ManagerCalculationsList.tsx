import React, { useMemo, useState } from 'react';
import {
    Search,
    LayoutGrid,
    List as ListIcon,
    Calendar,
    MapPin,
    ChevronRight,
    Filter,
    ArrowUpRight,
    MessageSquare,
    Inbox,
    Briefcase,
    Globe
} from 'lucide-react';
import { type Calculation } from '../../dashboard.types';
import { ModernStatusBadge } from '../../client/components/ClientCalculationsList';

interface ManagerCalculationsListProps {
    myProjects: Calculation[];
    unassignedLeads: Calculation[];
    onSelect: (calc: Calculation) => void;
}

export const ManagerCalculationsList = React.memo<ManagerCalculationsListProps>(({
    myProjects,
    unassignedLeads,
    onSelect
}) => {
    const [searchQuery, setSearchQuery] = React.useState('');
    const [viewMode, setViewMode] = React.useState<'grid' | 'list'>('grid');
    const [activeTab, setActiveTab] = useState<'my' | 'unassigned' | 'all'>('my');

    const filtered = useMemo(() => {
        let baseList = [];
        if (activeTab === 'my') baseList = myProjects;
        else if (activeTab === 'unassigned') baseList = unassignedLeads;
        else baseList = [...myProjects, ...unassignedLeads];

        return baseList.filter(c =>
            c.organizationName.toLowerCase().includes(searchQuery.toLowerCase()) ||
            c.id.toString().includes(searchQuery)
        );
    }, [myProjects, unassignedLeads, activeTab, searchQuery]);

    const stats = useMemo(() => ({
        total: filtered.length,
        budget: filtered.reduce((s, c) => s + (c.totalCost || 0), 0)
    }), [filtered]);

    return (
        <div className="space-y-12 animate-in fade-in duration-700">
            {/* Header & Tabs */}
            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8">
                <div className="space-y-6">
                    <div className="space-y-2">
                        <h1 className="text-4xl lg:text-6xl font-black uppercase tracking-tighter">Воронка проектов</h1>
                        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-primary border-l-4 border-primary pl-6">
                            Централизованное управление всеми сделками
                        </p>
                    </div>

                    <div className="flex p-1.5 bg-card border border-border-theme rounded-full w-fit shadow-lg overflow-x-auto no-scrollbar max-w-full">
                        <button
                            onClick={() => setActiveTab('my')}
                            className={`flex items-center gap-3 px-8 py-3.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${activeTab === 'my' ? 'bg-primary text-white shadow-xl shadow-primary/20' : 'text-foreground/40 hover:text-primary'}`}
                        >
                            <Briefcase size={16} /> Мои проекты ({myProjects.length})
                        </button>
                        <button
                            onClick={() => setActiveTab('unassigned')}
                            className={`flex items-center gap-3 px-8 py-3.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${activeTab === 'unassigned' ? 'bg-orange-500 text-white shadow-xl shadow-orange-500/20' : 'text-foreground/40 hover:text-orange-500'}`}
                        >
                            <Inbox size={16} /> Входящие лиды ({unassignedLeads.length})
                        </button>
                        <button
                            onClick={() => setActiveTab('all')}
                            className={`flex items-center gap-3 px-8 py-3.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${activeTab === 'all' ? 'bg-foreground text-background shadow-xl' : 'text-foreground/40 hover:text-foreground'}`}
                        >
                            <Globe size={16} /> Показать всё
                        </button>
                    </div>
                </div>

                <div className="flex items-center gap-12 bg-card border border-border-theme p-8 rounded-[3rem] shadow-xl">
                    <div className="text-center px-4">
                        <p className="text-[9px] font-black text-foreground/30 uppercase tracking-widest mb-1">Выбрано</p>
                        <p className="text-3xl font-black leading-none">{stats.total}</p>
                    </div>
                    <div className="w-[1px] h-12 bg-border-theme" />
                    <div className="text-center px-4">
                        <p className="text-[9px] font-black text-foreground/30 uppercase tracking-widest mb-1">Бюджет воронки</p>
                        <p className="text-3xl font-black leading-none">{(stats.budget / 1000000).toFixed(1)}M</p>
                    </div>
                </div>
            </div>

            {/* Controls */}
            <div className="flex flex-wrap items-center justify-between gap-6 bg-card border border-border-theme p-5 rounded-[2.5rem] shadow-2xl">
                <div className="flex-1 min-w-[300px] relative">
                    <Search className="absolute left-8 top-1/2 -translate-y-1/2 w-6 h-6 text-foreground/20" />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Поиск по названию организации или ID..."
                        className="w-full bg-background border border-border-theme rounded-3xl pl-20 pr-10 py-5 text-[14px] font-black outline-none focus:border-primary transition-all shadow-inner"
                    />
                </div>
                <div className="flex items-center gap-4">
                    <button className="flex items-center gap-3 px-8 py-5 bg-background border border-border-theme rounded-3xl text-[11px] font-black uppercase tracking-widest hover:text-primary transition-all group">
                        <Filter size={16} className="group-hover:rotate-180 transition-transform" /> Фильтры
                    </button>
                    <div className="flex bg-background p-2 rounded-3xl border border-border-theme">
                        <button
                            onClick={() => setViewMode('grid')}
                            className={`p-4 rounded-2xl transition-all ${viewMode === 'grid' ? 'bg-primary text-white shadow-xl' : 'text-foreground/40 hover:text-primary'}`}
                        >
                            <LayoutGrid size={20} />
                        </button>
                        <button
                            onClick={() => setViewMode('list')}
                            className={`p-4 rounded-2xl transition-all ${viewMode === 'list' ? 'bg-primary text-white shadow-xl' : 'text-foreground/40 hover:text-primary'}`}
                        >
                            <ListIcon size={20} />
                        </button>
                    </div>
                </div>
            </div>

            {/* List */}
            {filtered.length === 0 ? (
                <div className="py-40 text-center bg-card/50 border-3 border-dashed border-border-theme rounded-[4rem]">
                    <div className="w-24 h-24 bg-primary/5 rounded-[2.5rem] flex items-center justify-center mx-auto mb-8 text-primary/20">
                        {activeTab === 'my' ? <Briefcase size={48} /> : activeTab === 'unassigned' ? <Inbox size={48} /> : <Search size={48} />}
                    </div>
                    <h3 className="text-xl font-black uppercase tracking-widest text-foreground/40">Ничего не найдено</h3>
                    <p className="text-[10px] font-bold text-foreground/20 uppercase tracking-[0.3em] mt-3">Измените параметры фильтрации или поиска</p>
                </div>
            ) : viewMode === 'grid' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-10">
                    {filtered.map(calc => (
                        <div
                            key={calc.id}
                            onClick={() => onSelect(calc)}
                            className="group bg-card border border-border-theme p-10 rounded-[4rem] hover:border-primary/40 hover:shadow-3xl hover:shadow-primary/5 transition-all cursor-pointer relative overflow-hidden"
                        >
                            <div className="flex justify-between items-start mb-10">
                                <div className={`w-16 h-16 rounded-3xl flex items-center justify-center transition-all duration-500 ${calc.manager_id ? 'bg-primary/10 text-primary group-hover:bg-primary group-hover:text-white' : 'bg-orange-500/10 text-orange-500 group-hover:bg-orange-500 group-hover:text-white'}`}>
                                    {calc.manager_id ? <Briefcase size={32} /> : <Inbox size={32} />}
                                </div>
                                <ModernStatusBadge status={calc.status} />
                            </div>

                            <div className="space-y-3 mb-10">
                                <h3 className="text-2xl font-black uppercase tracking-tight group-hover:text-primary transition-colors leading-tight truncate">{calc.organizationName}</h3>
                                <div className="flex items-center gap-4 text-[10px] font-black text-foreground/30 uppercase tracking-[0.15em]">
                                    <Calendar size={14} className="text-primary" />
                                    <span>{calc.createdDate}</span>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-8 pt-8 border-t border-border-theme">
                                <div className="space-y-2">
                                    <p className="text-[9px] font-black text-foreground/20 uppercase tracking-widest">Объект</p>
                                    <div className="flex items-center gap-2">
                                        <MapPin size={12} className="text-primary" />
                                        <p className="text-[12px] font-black truncate">{calc.type || '—'}</p>
                                    </div>
                                </div>
                                <div className="space-y-2 text-right">
                                    <p className="text-[9px] font-black text-foreground/20 uppercase tracking-widest">Бюджет</p>
                                    <p className="text-xl font-black tracking-tighter">{calc.totalCost?.toLocaleString()} ₽</p>
                                </div>
                            </div>

                            <div className="mt-10 flex items-center justify-between py-4 px-6 bg-background rounded-3xl border border-border-theme group-hover:border-primary/30 transition-all">
                                <div className="flex items-center gap-3">
                                    {calc.unreadComments > 0 && (
                                        <div className="flex items-center justify-center w-6 h-6 bg-orange-500 text-white rounded-full text-[10px] font-black animate-pulse">
                                            {calc.unreadComments}
                                        </div>
                                    )}
                                    <span className="text-[11px] font-black uppercase tracking-widest text-foreground/40 group-hover:text-primary transition-colors">Экспертиза</span>
                                </div>
                                <ChevronRight size={20} className="text-foreground/20 group-hover:text-primary group-hover:translate-x-2 transition-all" />
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="space-y-6">
                    {filtered.map(calc => (
                        <div
                            key={calc.id}
                            onClick={() => onSelect(calc)}
                            className="group bg-card border border-border-theme p-8 rounded-[3rem] hover:border-primary/40 hover:shadow-2xl transition-all cursor-pointer flex items-center justify-between gap-12"
                        >
                            <div className="flex items-center gap-10 flex-1 min-w-0">
                                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 ${calc.manager_id ? 'bg-primary/10 text-primary' : 'bg-orange-500/10 text-orange-500'}`}>
                                    {calc.manager_id ? <Briefcase size={28} /> : <Inbox size={28} />}
                                </div>
                                <div className="min-w-0 flex-1">
                                    <h4 className="text-xl font-black uppercase tracking-tight truncate mb-2">{calc.organizationName}</h4>
                                    <div className="flex flex-wrap items-center gap-6 text-[10px] font-black text-foreground/30 uppercase tracking-widest">
                                        <span className="flex items-center gap-2"><Calendar size={12} className="text-primary" /> {calc.createdDate}</span>
                                        <span className="w-1.5 h-1.5 bg-foreground/10 rounded-full" />
                                        <span className="flex items-center gap-2"><MapPin size={12} className="text-primary" /> {calc.type || '—'}</span>
                                        <span className="w-1.5 h-1.5 bg-foreground/10 rounded-full" />
                                        <span>{calc.totalArea} м²</span>
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center gap-16 text-right shrink-0">
                                {calc.unreadComments > 0 && (
                                    <div className="flex items-center gap-3 px-5 py-2.5 bg-orange-500/10 text-orange-500 rounded-2xl text-[10px] font-black shadow-inner">
                                        <MessageSquare size={14} /> {calc.unreadComments}
                                    </div>
                                )}
                                <div className="scale-110">
                                    <ModernStatusBadge status={calc.status} />
                                </div>
                                <div className="w-40">
                                    <p className="text-[22px] font-black tracking-tighter leading-none">{calc.totalCost?.toLocaleString()} ₽</p>
                                    <p className="text-[9px] font-black text-foreground/20 uppercase tracking-[0.2em] mt-2">Итоговая сумма</p>
                                </div>
                                <div className="w-12 h-12 rounded-full border border-border-theme flex items-center justify-center text-foreground/20 group-hover:bg-primary group-hover:border-primary group-hover:text-white group-hover:rotate-45 transition-all duration-500">
                                    <ArrowUpRight size={24} />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
});
