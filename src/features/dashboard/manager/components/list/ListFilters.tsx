import React from 'react';
import { Search, X, Filter, ChevronDown, Eye, Archive, ArrowUpDown, LayoutGrid, List as ListIcon, Loader2 } from 'lucide-react';
import { type CalculationStatus } from '../../../dashboard.types';

interface ListFiltersProps {
    search: string;
    status?: CalculationStatus;
    hideArchived: boolean;
    sortOrder: 'asc' | 'desc';
    viewMode: 'grid' | 'list';
    isFetching: boolean;
    onSearchChange: (value: string) => void;
    onStatusChange: (status?: CalculationStatus) => void;
    onHideArchivedToggle: () => void;
    onSortToggle: () => void;
    onViewModeChange: (mode: 'grid' | 'list') => void;
}

export const ListFilters: React.FC<ListFiltersProps> = ({
    search,
    status,
    hideArchived,
    sortOrder,
    viewMode,
    isFetching,
    onSearchChange,
    onStatusChange,
    onHideArchivedToggle,
    onSortToggle,
    onViewModeChange,
}) => {
    return (
        <div className="flex flex-col gap-6 bg-card border border-border-theme p-6 rounded-[2.5rem] shadow-2xl relative overflow-hidden group/filters">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/[0.02] to-transparent pointer-events-none" />
            
            <div className="flex flex-wrap items-center justify-between gap-6 relative z-10">
                {/* Search Stack */}
                <div className="flex-1 min-w-[300px] relative group/search">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground/20 group-focus-within/search:text-primary transition-colors" />
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => onSearchChange(e.target.value)}
                        placeholder="Поиск по названию или #ID..."
                        className="w-full bg-background border border-border-theme rounded-2xl pl-11 pr-12 py-3.5 text-[13px] font-bold outline-none focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all shadow-inner"
                    />
                    {search && (
                        <button 
                            onClick={() => onSearchChange('')}
                            className="absolute right-4 top-1/2 -translate-y-1/2 p-1 hover:bg-foreground/5 rounded-lg transition-colors"
                        >
                            <X size={14} className="text-foreground/30" />
                        </button>
                    )}
                    {isFetching && (
                        <div className="absolute right-12 top-1/2 -translate-y-1/2">
                            <Loader2 className="w-4 h-4 animate-spin text-primary" />
                        </div>
                    )}
                </div>

                {/* Status Filter & Sort */}
                <div className="flex flex-wrap items-center gap-3">
                    {/* Status Selector */}
                    <div className="relative group/status">
                        <Filter className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground/30" />
                        <select 
                            value={status || ''}
                            onChange={(e) => onStatusChange(e.target.value as CalculationStatus || undefined)}
                            className="appearance-none bg-background border border-border-theme rounded-2xl pl-11 pr-10 py-3.5 text-[11px] font-black uppercase tracking-widest outline-none focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all cursor-pointer min-w-[180px]"
                        >
                            <option value="">Все статусы</option>
                            <option value="draft">Черновик</option>
                            <option value="sent">На проверке</option>
                            <option value="changes">Требуют правок</option>
                            <option value="invoice">Счет выставлен</option>
                            <option value="paid">Оплачено</option>
                            <option value="processing">Сборка</option>
                            <option value="shipping">Отгрузка</option>
                            <option value="completed">Завершено</option>
                            <option value="closed">Архив</option>
                        </select>
                        <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground/20 pointer-events-none group-focus-within/status:rotate-180 transition-transform" />
                    </div>

                    {/* Archive Toggle */}
                    <button
                        onClick={onHideArchivedToggle}
                        className={`flex items-center gap-2 px-5 py-3.5 border rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all shadow-sm ${
                            !hideArchived 
                                ? 'bg-slate-500/10 border-slate-500/30 text-slate-500' 
                                : 'bg-background border-border-theme text-foreground/40 hover:text-primary hover:border-primary'
                        }`}
                        title={hideArchived ? 'Показать архивные проекты' : 'Скрыть архивные проекты'}
                    >
                        {hideArchived ? <Eye size={14} /> : <Archive size={14} />}
                        {hideArchived ? 'Показать архив' : 'Архив'}
                    </button>

                    <button
                        onClick={onSortToggle}
                        className="flex items-center gap-2 px-5 py-3.5 bg-background border border-border-theme rounded-2xl text-[11px] font-black uppercase tracking-widest hover:text-primary hover:border-primary transition-all shadow-sm"
                    >
                        <ArrowUpDown size={14} />{' '}
                        {sortOrder === 'desc' ? 'Сначала новые' : 'Сначала старые'}
                    </button>

                    <div className="flex bg-background p-1 rounded-2xl border border-border-theme shadow-sm">
                        <button
                            onClick={() => onViewModeChange('grid')}
                            className={`p-2.5 rounded-xl transition-all ${viewMode === 'grid' ? 'bg-primary text-white shadow-lg shadow-primary/20 scale-105' : 'text-foreground/40 hover:text-primary'}`}
                        >
                            <LayoutGrid size={18} />
                        </button>
                        <button
                            onClick={() => onViewModeChange('list')}
                            className={`p-2.5 rounded-xl transition-all ${viewMode === 'list' ? 'bg-primary text-white shadow-lg shadow-primary/20 scale-105' : 'text-foreground/40 hover:text-primary'}`}
                        >
                            <ListIcon size={18} />
                        </button>
                    </div>
                </div>
            </div>

            {/* Active Filter Badges */}
            {(search || status) && (
                <div className="flex flex-wrap items-center gap-3 pt-4 mt-4 border-t border-border-theme/40 relative z-10 animate-in fade-in slide-in-from-top-2">
                     <span className="text-[9px] font-black text-foreground/20 uppercase tracking-[0.2em] mr-2">Активные фильтры:</span>
                     {search && (
                         <div className="flex items-center gap-2 px-3 py-1.5 bg-primary/5 border border-primary/20 text-primary rounded-xl text-[10px] font-bold">
                             Поиск: "{search}"
                             <button onClick={() => onSearchChange('')}><X size={12} /></button>
                         </div>
                     )}
                     {status && (
                         <div className="flex items-center gap-2 px-3 py-1.5 bg-primary/5 border border-primary/20 text-primary rounded-xl text-[10px] font-bold">
                             Статус: {status}
                             <button onClick={() => onStatusChange(undefined)}><X size={12} /></button>
                         </div>
                     )}
                     <button 
                        onClick={() => { onSearchChange(''); onStatusChange(undefined); }}
                        className="text-[10px] font-black text-foreground/40 uppercase tracking-widest hover:text-red-500 transition-colors ml-auto"
                     >
                        Сбросить все
                     </button>
                </div>
            )}
        </div>
    );
};
