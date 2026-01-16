import React, { useMemo, useRef } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import {
    Search,
    LayoutGrid,
    List as ListIcon,
    Calendar,
    ChevronRight,
    ChevronLeft,
    ArrowUpRight,
    MessageSquare,
    Inbox,
    Briefcase,
    Globe,
    Loader2,
    ArrowUpDown,
    Filter,
    ChevronDown,
    X,
} from 'lucide-react';
import { type Calculation, type CalculationStatus } from '../../dashboard.types';
import { ModernStatusBadge } from '../../components/ModernStatusBadge';
import { CalculationEntity } from '@/core/domain/CalculationEntity';
import { CalculationViewModel } from '@/features/dashboard/presentation/CalculationViewModel';
import { usePaginatedCalculations } from '../../hooks/usePaginatedCalculations';
import { useUnreadCount } from '@/features/chat/hooks';
import { STATUS_UI_CONFIG } from '../../constants/status.constants';

interface ManagerCalculationsListProps {
    userId: string;
    onSelect: (calc: Calculation) => void;
}

// Memoized Card Component
const CalculationCard = React.memo<{
    vm: CalculationViewModel;
    index: number;
    unreadCount: number;
    onSelect: (calc: Calculation) => void;
}>(({ vm, index, unreadCount, onSelect }) => {
    const statusConfig = STATUS_UI_CONFIG[vm.status] || STATUS_UI_CONFIG.draft;
    const statusBg = statusConfig.bg;
    const isUnassigned = !vm.managerId;

    return (
        <div
            onClick={() => onSelect(vm.rawData)}
            className={`
                group relative glass-card p-8 rounded-[3rem] cursor-pointer transition-all duration-500
                hover:-translate-y-2 hover:shadow-2xl border-border-theme/60 overflow-hidden flex flex-col justify-between h-full
            `}
        >
            {/* Status Accent Bar */}
            <div className={`absolute top-0 left-0 right-0 h-1.5 ${statusBg.replace('/10', '/40').replace('/5', '/20')} opacity-40 group-hover:opacity-100 transition-opacity`} />
            
            {/* ID Watermark */}
            <div className="absolute -right-4 top-0 text-[6rem] font-black text-foreground/[0.03] select-none pointer-events-none italic leading-none transition-transform duration-1000 group-hover:scale-110 group-hover:-translate-x-6">
                {String(index + 1).padStart(3, '0')}
            </div>

            <div className="relative z-10">
                <div className="flex justify-between items-start mb-8">
                    <div className="flex items-center gap-3">
                        <div
                            className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-500 border shadow-sm ${
                                isUnassigned 
                                    ? 'bg-orange-500/10 text-orange-500 border-orange-500/20 group-hover:bg-orange-500 group-hover:text-white' 
                                    : 'bg-primary/10 text-primary border-primary/10 group-hover:bg-primary group-hover:text-white'
                            }`}
                        >
                            {isUnassigned ? <Inbox size={22} /> : <Briefcase size={22} />}
                        </div>
                        <div className="flex flex-col">
                            <span className={`text-[8px] font-black uppercase tracking-[0.2em] ${isUnassigned ? 'text-orange-500/60' : 'text-foreground/30'}`}>
                                {isUnassigned ? 'Входящий' : 'В работе'}
                            </span>
                            <span className="text-[10px] font-black uppercase tracking-widest text-foreground/40 group-hover:text-foreground/60 transition-colors">
                                Проект #{String(index + 1).padStart(3, '0')}
                            </span>
                        </div>
                    </div>
                    <ModernStatusBadge status={vm.status} />
                </div>

                <div className="space-y-4 mb-8">
                    <div className="space-y-1">
                        <div className="flex items-center gap-2">
                             <span className="text-[9px] font-black text-primary uppercase tracking-[0.2em] bg-primary/5 px-3 py-1 rounded-lg border border-primary/10">
                                {vm.type || 'Объект'}
                            </span>
                        </div>
                        <h3 className="text-2xl font-black tracking-tighter leading-[1.1] group-hover:text-primary transition-colors duration-300">
                            {vm.organizationName}
                        </h3>
                    </div>

                    <div className="flex items-center gap-4 text-[10px] font-black text-foreground/30 uppercase tracking-widest">
                        <div className="flex items-center gap-1.5">
                            <Calendar size={12} className="text-primary/40 group-hover:text-primary transition-colors" />
                            <span>{vm.formattedDate}</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="relative z-10">
                <div className="grid grid-cols-2 gap-6 py-6 border-y border-border-theme/40 relative">
                    <div className="space-y-1">
                        <p className="text-[8px] font-black text-foreground/30 uppercase tracking-[0.2em]">Бюджет</p>
                        <p className={`text-xl font-black tracking-tighter ${vm.totalCost ? 'text-foreground' : 'text-foreground/20'}`}>
                            {vm.totalCostDisplay}
                        </p>
                    </div>
                    <div className="space-y-1 text-right">
                        <p className="text-[8px] font-black text-foreground/30 uppercase tracking-[0.2em]">Площадь</p>
                        <p className="text-xl font-black tracking-tighter">
                            {vm.totalArea} <span className="text-[10px] text-foreground/20 uppercase">м²</span>
                        </p>
                    </div>
                </div>

                <div className="mt-6 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        {unreadCount > 0 ? (
                            <div className="flex items-center gap-2 px-3 py-1.5 bg-primary text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-primary/20 animate-bounce-subtle">
                                <MessageSquare size={12} /> {unreadCount}
                            </div>
                        ) : (
                            <div className="flex items-center gap-2 text-foreground/20 text-[10px] font-black uppercase tracking-widest">
                                <MessageSquare size={12} /> 0
                            </div>
                        )}
                    </div>
                    
                    <div className="flex items-center gap-3 px-6 py-2.5 rounded-2xl bg-primary/5 text-primary text-[10px] font-black uppercase tracking-[0.2em] group-hover:bg-primary group-hover:text-white transition-all duration-500">
                        <span>Детали</span>
                        <ArrowUpRight size={16} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                    </div>
                </div>
            </div>
            
            {/* Unassigned Glow Overlay */}
            {isUnassigned && (
                <div className="absolute inset-0 bg-gradient-to-br from-orange-500/[0.03] to-transparent pointer-events-none" />
            )}
        </div>
    );
});

// Memoized List Row Component
const CalculationRow = React.memo<{
    vm: CalculationViewModel;
    index: number;
    unreadCount: number;
    onSelect: (calc: Calculation) => void;
}>(({ vm, index, unreadCount, onSelect }) => {
    const isUnassigned = !vm.managerId;
    
    return (
        <div
            onClick={() => onSelect(vm.rawData)}
            className="group relative bg-card border border-border-theme p-4 rounded-[2rem] hover:border-primary/40 hover:shadow-2xl transition-all cursor-pointer flex items-center justify-between gap-8 overflow-hidden"
        >
            <div className={`absolute left-0 top-0 bottom-0 w-1.5 transition-colors ${isUnassigned ? 'bg-orange-500/40' : 'bg-primary/40'} opacity-0 group-hover:opacity-100`} />

            <div className="flex items-center gap-6 flex-1 min-w-0 relative z-10">
                <div
                    className={`w-12 h-12 rounded-2xl flex flex-col items-center justify-center shrink-0 border transition-colors ${
                        isUnassigned 
                            ? 'bg-orange-500/10 text-orange-500 border-orange-500/10 group-hover:bg-orange-500 group-hover:text-white' 
                            : 'bg-primary/10 text-primary border-primary/10 group-hover:bg-primary group-hover:text-white'
                    }`}
                >
                    {isUnassigned ? <Inbox size={20} /> : <Briefcase size={20} />}
                    <span className="text-[7px] font-black uppercase tracking-tighter">
                         #{String(index + 1).padStart(3, '0')}
                    </span>
                </div>
                
                <div className="min-w-0 flex-1">
                    <h4 className="text-xl font-black uppercase tracking-tighter truncate mb-1 group-hover:text-primary transition-colors">
                        {vm.organizationName}
                    </h4>
                    <div className="flex flex-wrap items-center gap-4">
                        <span className="flex items-center gap-1.5 text-[9px] font-black text-foreground/30 uppercase tracking-[0.2em]">
                            <Calendar size={12} className="text-primary/40" /> {vm.formattedDate}
                        </span>
                        <span className="w-1 h-1 bg-foreground/10 rounded-full" />
                        <span className="text-[9px] font-black text-primary uppercase tracking-[0.2em] bg-primary/5 px-2 py-0.5 rounded-lg">
                            {vm.type || 'Объект'}
                        </span>
                        <span className="w-1 h-1 bg-foreground/10 rounded-full" />
                        <span className="text-[9px] font-black text-foreground/40 uppercase tracking-[0.2em]">
                            {vm.totalArea} м²
                        </span>
                    </div>
                </div>
            </div>

            <div className="flex items-center gap-10 text-right shrink-0 relative z-10">
                {unreadCount > 0 && (
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-primary text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-primary/20 animate-bounce-subtle">
                        <MessageSquare size={14} /> {unreadCount}
                    </div>
                )}
                
                <div className="scale-110">
                    <ModernStatusBadge status={vm.status} />
                </div>

                <div className="w-32">
                    <p className="text-2xl font-black tracking-tighter leading-none group-hover:text-primary transition-colors">
                        {vm.totalCostDisplay}
                    </p>
                </div>

                <div className="w-10 h-10 rounded-xl bg-primary/5 text-primary flex items-center justify-center opacity-0 group-hover:opacity-100 group-hover:scale-110 transition-all duration-500">
                    <ArrowUpRight size={20} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                </div>
            </div>
        </div>
    );
});

export const ManagerCalculationsList = React.memo<ManagerCalculationsListProps>(
    ({ userId, onSelect }) => {
        const [viewMode, setViewMode] = React.useState<'grid' | 'list'>('grid');
        const parentRef = useRef<HTMLDivElement>(null);
        const [containerWidth, setContainerWidth] = React.useState(1200);

        const { projectCounts } = useUnreadCount(userId);

        const {
            calculations,
            total,
            totalPages,
            currentPage,
            isLoading,
            isFetching,
            pagination,
            setPage,
            setSearch,
            setSort,
            setTab,
            setStatus,
        } = usePaginatedCalculations(userId);

        // Map to ViewModels
        const viewModels = useMemo(
            () =>
                calculations.map(
                    (c: Calculation) => new CalculationViewModel(new CalculationEntity(c))
                ),
            [calculations]
        );

        // Stats
        const stats = useMemo(
            () => ({
                total,
                budget: viewModels.reduce(
                    (s: number, c: CalculationViewModel) => s + (c.totalCost || 0),
                    0
                ),
            }),
            [total, viewModels]
        );

        // Calculate columns based on container width
        const columns = useMemo(() => {
            if (viewMode === 'list') return 1;
            if (containerWidth >= 1150) return 3;
            if (containerWidth >= 700) return 2;
            return 1;
        }, [containerWidth, viewMode]);

        // Calculate rows for grid virtualization
        const rowCount = useMemo(
            () =>
                viewMode === 'grid' ? Math.ceil(viewModels.length / columns) : viewModels.length,
            [viewModels.length, columns, viewMode]
        );

        // Measure container width
        React.useEffect(() => {
            if (!parentRef.current) return;
            const resizeObserver = new ResizeObserver((entries) => {
                for (const entry of entries) {
                    setContainerWidth(entry.contentRect.width);
                }
            });
            resizeObserver.observe(parentRef.current);
            return () => resizeObserver.disconnect();
        }, []);

        // Virtualizer - works for both grid rows and list rows
        // eslint-disable-next-line react-hooks/incompatible-library
        const rowVirtualizer = useVirtualizer({
            count: rowCount,
            getScrollElement: () => parentRef.current,
            estimateSize: () => (viewMode === 'grid' ? 440 : 110),
            overscan: 4,
        });

        const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
            setSearch(e.target.value);
        };

        const handleSortToggle = () => {
            setSort(pagination.sortBy, pagination.sortOrder === 'desc' ? 'asc' : 'desc');
        };

        return (
            <div className="space-y-6 animate-in fade-in duration-700">
                {/* Header & Tabs */}
                <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
                    <div className="space-y-4">
                        <div className="space-y-1">
                            <h1 className="text-3xl lg:text-4xl font-black uppercase tracking-tighter">
                                Воронка проектов
                            </h1>
                            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-primary border-l-4 border-primary pl-4">
                                {total} проектов • Серверная пагинация
                            </p>
                        </div>

                        <div className="flex p-1 bg-card border border-border-theme rounded-full w-fit shadow-lg overflow-x-auto no-scrollbar">
                            <button
                                onClick={() => setTab('my')}
                                className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-[9px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${pagination.tab === 'my' ? 'bg-primary text-white shadow-xl shadow-primary/20' : 'text-foreground/40 hover:text-primary'}`}
                            >
                                <Briefcase size={12} /> Мои
                            </button>
                            <button
                                onClick={() => setTab('unassigned')}
                                className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-[9px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${pagination.tab === 'unassigned' ? 'bg-orange-500 text-white shadow-xl shadow-orange-500/20' : 'text-foreground/40 hover:text-orange-500'}`}
                            >
                                <Inbox size={12} /> Входящие
                            </button>
                            <button
                                onClick={() => setTab('all')}
                                className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-[9px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${pagination.tab === 'all' ? 'bg-foreground text-background shadow-xl' : 'text-foreground/40 hover:text-foreground'}`}
                            >
                                <Globe size={12} /> Все
                            </button>
                        </div>
                    </div>

                    <div className="flex items-stretch gap-2 bg-card border border-border-theme p-2 rounded-[2.5rem] shadow-2xl relative overflow-hidden group/stats">
                        <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-orange-500/5 opacity-0 group-hover/stats:opacity-100 transition-opacity" />
                        
                        <div className="relative z-10 flex items-center gap-4 px-6 py-2">
                            <div className="text-center">
                                <p className="text-[8px] font-black text-foreground/30 uppercase tracking-[0.3em] mb-1">
                                    Активных
                                </p>
                                <p className="text-3xl font-black leading-none tracking-tighter">{stats.total}</p>
                            </div>
                        </div>
                        
                        <div className="w-[1px] my-3 bg-border-theme/60" />
                        
                        <div className="relative z-10 flex items-center gap-4 px-6 py-2">
                            <div className="text-center">
                                <p className="text-[8px] font-black text-foreground/30 uppercase tracking-[0.3em] mb-1">
                                    Оборот
                                </p>
                                <p className="text-3xl font-black leading-none tracking-tighter text-primary">
                                    {(stats.budget / 1000000).toFixed(1)}M
                                    <span className="text-sm ml-1 text-foreground/30">₽</span>
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Controls & Advanced Filters */}
                <div className="flex flex-col gap-6 bg-card border border-border-theme p-6 rounded-[2.5rem] shadow-2xl relative overflow-hidden group/filters">
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/[0.02] to-transparent pointer-events-none" />
                    
                    <div className="flex flex-wrap items-center justify-between gap-6 relative z-10">
                        {/* Search Stack */}
                        <div className="flex-1 min-w-[300px] relative group/search">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground/20 group-focus-within/search:text-primary transition-colors" />
                            <input
                                type="text"
                                value={pagination.search}
                                onChange={handleSearchChange}
                                placeholder="Поиск по названию или #ID..."
                                className="w-full bg-background border border-border-theme rounded-2xl pl-11 pr-12 py-3.5 text-[13px] font-bold outline-none focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all shadow-inner"
                            />
                            {pagination.search && (
                                <button 
                                    onClick={() => setSearch('')}
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
                                    value={pagination.status || ''}
                                    onChange={(e) => setStatus(e.target.value as CalculationStatus || undefined)}
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
                                </select>
                                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground/20 pointer-events-none group-focus-within/status:rotate-180 transition-transform" />
                            </div>

                            <button
                                onClick={handleSortToggle}
                                className="flex items-center gap-2 px-5 py-3.5 bg-background border border-border-theme rounded-2xl text-[11px] font-black uppercase tracking-widest hover:text-primary hover:border-primary transition-all shadow-sm"
                            >
                                <ArrowUpDown size={14} />{' '}
                                {pagination.sortOrder === 'desc' ? 'Сначала новые' : 'Сначала старые'}
                            </button>

                            <div className="flex bg-background p-1 rounded-2xl border border-border-theme shadow-sm">
                                <button
                                    onClick={() => setViewMode('grid')}
                                    className={`p-2.5 rounded-xl transition-all ${viewMode === 'grid' ? 'bg-primary text-white shadow-lg shadow-primary/20 scale-105' : 'text-foreground/40 hover:text-primary'}`}
                                >
                                    <LayoutGrid size={18} />
                                </button>
                                <button
                                    onClick={() => setViewMode('list')}
                                    className={`p-2.5 rounded-xl transition-all ${viewMode === 'list' ? 'bg-primary text-white shadow-lg shadow-primary/20 scale-105' : 'text-foreground/40 hover:text-primary'}`}
                                >
                                    <ListIcon size={18} />
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Active Filter Badges */}
                    {(pagination.search || pagination.status) && (
                        <div className="flex flex-wrap items-center gap-3 pt-4 mt-4 border-t border-border-theme/40 relative z-10 animate-in fade-in slide-in-from-top-2">
                             <span className="text-[9px] font-black text-foreground/20 uppercase tracking-[0.2em] mr-2">Активные фильтры:</span>
                             {pagination.search && (
                                 <div className="flex items-center gap-2 px-3 py-1.5 bg-primary/5 border border-primary/20 text-primary rounded-xl text-[10px] font-bold">
                                     Поиск: "{pagination.search}"
                                     <button onClick={() => setSearch('')}><X size={12} /></button>
                                 </div>
                             )}
                             {pagination.status && (
                                 <div className="flex items-center gap-2 px-3 py-1.5 bg-primary/5 border border-primary/20 text-primary rounded-xl text-[10px] font-bold">
                                     Статус: {pagination.status}
                                     <button onClick={() => setStatus(undefined)}><X size={12} /></button>
                                 </div>
                             )}
                             <button 
                                onClick={() => { setSearch(''); setStatus(undefined); }}
                                className="text-[10px] font-black text-foreground/40 uppercase tracking-widest hover:text-red-500 transition-colors ml-auto"
                             >
                                Сбросить все
                             </button>
                        </div>
                    )}
                </div>

                {/* Virtualized List */}
                {isLoading ? (
                    <div className="py-24 flex flex-col items-center justify-center text-foreground/20">
                        <Loader2 size={40} className="animate-spin mb-4" />
                        <p className="text-[10px] font-black uppercase tracking-widest">
                            Загрузка...
                        </p>
                    </div>
                ) : viewModels.length === 0 ? (
                    <div className="py-24 text-center bg-card/50 border-2 border-dashed border-border-theme rounded-[2rem]">
                        <div className="w-16 h-16 bg-primary/5 rounded-[1.5rem] flex items-center justify-center mx-auto mb-4 text-primary/20">
                            {pagination.tab === 'my' ? (
                                <Briefcase size={32} />
                            ) : pagination.tab === 'unassigned' ? (
                                <Inbox size={32} />
                            ) : (
                                <Search size={32} />
                            )}
                        </div>
                        <h3 className="text-base font-black uppercase tracking-widest text-foreground/40">
                            Ничего не найдено
                        </h3>
                        <p className="text-[9px] font-bold text-foreground/20 uppercase tracking-[0.3em] mt-1">
                            Измените параметры поиска
                        </p>
                    </div>
                ) : (
                    <div
                        ref={parentRef}
                        className="h-[calc(100vh-380px)] overflow-auto custom-scrollbar"
                    >
                        <div
                            style={{
                                height: `${rowVirtualizer.getTotalSize()}px`,
                                width: '100%',
                                position: 'relative',
                            }}
                        >
                            {rowVirtualizer.getVirtualItems().map((virtualRow) => {
                                if (viewMode === 'grid') {
                                    const startIndex = virtualRow.index * columns;
                                    const rowItems = viewModels.slice(
                                        startIndex,
                                        startIndex + columns
                                    );

                                    return (
                                        <div
                                            key={virtualRow.key}
                                            style={{
                                                position: 'absolute',
                                                top: 0,
                                                left: 0,
                                                width: '100%',
                                                transform: `translateY(${virtualRow.start}px)`,
                                            }}
                                            className="pb-4"
                                        >
                                            <div
                                                className="grid gap-8"
                                                style={{
                                                    gridTemplateColumns: `repeat(${columns}, 1fr)`,
                                                }}
                                            >
                                                {rowItems.map(
                                                    (
                                                        vm: CalculationViewModel,
                                                        colIndex: number
                                                    ) => (
                                                        <CalculationCard
                                                            key={vm.id}
                                                            vm={vm}
                                                            index={
                                                                (currentPage - 1) *
                                                                    pagination.pageSize +
                                                                startIndex +
                                                                colIndex
                                                            }
                                                            unreadCount={
                                                                projectCounts[String(vm.id)] || 0
                                                            }
                                                            onSelect={onSelect}
                                                        />
                                                    )
                                                )}
                                            </div>
                                        </div>
                                    );
                                } else {
                                    const vm = viewModels[virtualRow.index];
                                    if (!vm) return null;

                                    return (
                                        <div
                                            key={virtualRow.key}
                                            style={{
                                                position: 'absolute',
                                                top: 0,
                                                left: 0,
                                                width: '100%',
                                                transform: `translateY(${virtualRow.start}px)`,
                                            }}
                                            className="pb-2"
                                        >
                                            <CalculationRow
                                                vm={vm}
                                                index={
                                                    (currentPage - 1) * pagination.pageSize +
                                                    virtualRow.index
                                                }
                                                unreadCount={projectCounts[String(vm.id)] || 0}
                                                onSelect={onSelect}
                                            />
                                        </div>
                                    );
                                }
                            })}
                        </div>
                    </div>
                )}

                {/* Pagination Controls */}
                {totalPages > 1 && (
                    <div className="flex items-center justify-center gap-3">
                        <button
                            onClick={() => setPage(currentPage - 1)}
                            disabled={currentPage === 1}
                            className="flex items-center gap-1 px-4 py-2 bg-card border border-border-theme rounded-xl text-[9px] font-black uppercase tracking-widest disabled:opacity-30 disabled:cursor-not-allowed hover:border-primary transition-all"
                        >
                            <ChevronLeft size={14} /> Назад
                        </button>
                        <div className="flex items-center gap-1">
                            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                const pageNum =
                                    currentPage <= 3
                                        ? i + 1
                                        : currentPage >= totalPages - 2
                                          ? totalPages - 4 + i
                                          : currentPage - 2 + i;
                                if (pageNum < 1 || pageNum > totalPages) return null;
                                return (
                                    <button
                                        key={pageNum}
                                        onClick={() => setPage(pageNum)}
                                        className={`w-8 h-8 rounded-lg text-[10px] font-black transition-all ${
                                            pageNum === currentPage
                                                ? 'bg-primary text-white shadow-lg'
                                                : 'bg-card border border-border-theme hover:border-primary'
                                        }`}
                                    >
                                        {pageNum}
                                    </button>
                                );
                            })}
                        </div>
                        <button
                            onClick={() => setPage(currentPage + 1)}
                            disabled={currentPage === totalPages}
                            className="flex items-center gap-1 px-4 py-2 bg-card border border-border-theme rounded-xl text-[9px] font-black uppercase tracking-widest disabled:opacity-30 disabled:cursor-not-allowed hover:border-primary transition-all"
                        >
                            Вперед <ChevronRight size={14} />
                        </button>
                    </div>
                )}
            </div>
        );
    }
);
