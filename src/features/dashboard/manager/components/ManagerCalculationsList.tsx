import React, { useMemo, useRef } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import {
    Search,
    LayoutGrid,
    List as ListIcon,
    Calendar,
    MapPin,
    ChevronRight,
    ChevronLeft,
    ArrowUpRight,
    MessageSquare,
    Inbox,
    Briefcase,
    Globe,
    Loader2,
    ArrowUpDown,
} from 'lucide-react';
import { type Calculation } from '../../dashboard.types';
import { ModernStatusBadge } from '../../components/ModernStatusBadge';
import { CalculationEntity } from '@/core/domain/CalculationEntity';
import { CalculationViewModel } from '@/features/dashboard/presentation/CalculationViewModel';
import { usePaginatedCalculations } from '../../hooks/usePaginatedCalculations';
import { useUnreadCount } from '@/features/chat/hooks';

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
}>(({ vm, index, unreadCount, onSelect }) => (
    <div
        onClick={() => onSelect(vm.rawData)}
        className="group bg-card border border-border-theme p-6 rounded-[2rem] hover:border-primary/40 hover:shadow-2xl transition-all cursor-pointer h-full"
    >
        <div className="flex justify-between items-start mb-4">
            <div
                className={`w-12 h-12 rounded-xl flex flex-col items-center justify-center transition-all duration-500 ${vm.managerId ? 'bg-primary/10 text-primary group-hover:bg-primary group-hover:text-white' : 'bg-orange-500/10 text-orange-500 group-hover:bg-orange-500 group-hover:text-white'}`}
            >
                {vm.managerId ? (
                    <Briefcase size={18} className="mb-0.5" />
                ) : (
                    <Inbox size={18} className="mb-0.5" />
                )}
                <span className="text-[8px] font-black opacity-60">
                    #{String(index + 1).padStart(3, '0')}
                </span>
            </div>
            <ModernStatusBadge status={vm.status} />
        </div>

        <div className="space-y-1 mb-4">
            <h3 className="text-lg font-black uppercase tracking-tight group-hover:text-primary transition-colors leading-tight truncate">
                {vm.organizationName}
            </h3>
            <div className="flex items-center gap-2 text-[9px] font-black text-foreground/30 uppercase tracking-[0.15em]">
                <Calendar size={10} className="text-primary" />
                <span>{vm.formattedDate}</span>
            </div>
        </div>

        <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border-theme">
            <div className="space-y-1">
                <p className="text-[8px] font-black text-foreground/20 uppercase tracking-widest">
                    Объект
                </p>
                <div className="flex items-center gap-1">
                    <MapPin size={10} className="text-primary" />
                    <p className="text-[10px] font-black truncate">{vm.type || '—'}</p>
                </div>
            </div>
            <div className="space-y-1 text-right">
                <p className="text-[8px] font-black text-foreground/20 uppercase tracking-widest">
                    Бюджет
                </p>
                <p className="text-base font-black tracking-tighter">{vm.totalCostDisplay}</p>
            </div>
        </div>

        <div className="mt-4 flex items-center justify-between py-2 px-3 bg-background rounded-xl border border-border-theme group-hover:border-primary/30 transition-all">
            <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                    <div className="flex items-center justify-center w-4 h-4 bg-orange-500 text-white rounded-full text-[8px] font-black animate-pulse">
                        {unreadCount}
                    </div>
                )}
                <span className="text-[9px] font-black uppercase tracking-widest text-foreground/40 group-hover:text-primary transition-colors">
                    Открыть
                </span>
            </div>
            <ChevronRight
                size={14}
                className="text-foreground/20 group-hover:text-primary group-hover:translate-x-1 transition-all"
            />
        </div>
    </div>
));

// Memoized List Row Component
const CalculationRow = React.memo<{
    vm: CalculationViewModel;
    index: number;
    unreadCount: number;
    onSelect: (calc: Calculation) => void;
}>(({ vm, index, unreadCount, onSelect }) => (
    <div
        onClick={() => onSelect(vm.rawData)}
        className="group bg-card border border-border-theme p-5 rounded-[1.5rem] hover:border-primary/40 hover:shadow-xl transition-all cursor-pointer flex items-center justify-between gap-6"
    >
        <div className="flex items-center gap-5 flex-1 min-w-0">
            <div
                className={`w-10 h-10 rounded-lg flex flex-col items-center justify-center shrink-0 ${vm.managerId ? 'bg-primary/10 text-primary' : 'bg-orange-500/10 text-orange-500'}`}
            >
                {vm.managerId ? <Briefcase size={16} /> : <Inbox size={16} />}
                <span className="text-[7px] font-black opacity-60">
                    #{String(index + 1).padStart(3, '0')}
                </span>
            </div>
            <div className="min-w-0 flex-1">
                <h4 className="text-base font-black uppercase tracking-tight truncate mb-0.5">
                    {vm.organizationName}
                </h4>
                <div className="flex flex-wrap items-center gap-3 text-[8px] font-black text-foreground/30 uppercase tracking-widest">
                    <span className="flex items-center gap-1">
                        <Calendar size={9} className="text-primary" /> {vm.formattedDate}
                    </span>
                    <span className="w-1 h-1 bg-foreground/10 rounded-full" />
                    <span className="flex items-center gap-1">
                        <MapPin size={9} className="text-primary" /> {vm.type || '—'}
                    </span>
                    <span className="w-1 h-1 bg-foreground/10 rounded-full" />
                    <span>{vm.totalArea} м²</span>
                </div>
            </div>
        </div>

        <div className="flex items-center gap-8 text-right shrink-0">
            {unreadCount > 0 && (
                <div className="flex items-center gap-1 px-2 py-1 bg-orange-500/10 text-orange-500 rounded-lg text-[8px] font-black">
                    <MessageSquare size={10} /> {unreadCount}
                </div>
            )}
            <ModernStatusBadge status={vm.status} />
            <div className="w-28">
                <p className="text-base font-black tracking-tighter leading-none">
                    {vm.totalCostDisplay}
                </p>
                <p className="text-[7px] font-black text-foreground/20 uppercase tracking-[0.2em] mt-0.5">
                    Итого
                </p>
            </div>
            <div className="w-8 h-8 rounded-full border border-border-theme flex items-center justify-center text-foreground/20 group-hover:bg-primary group-hover:border-primary group-hover:text-white group-hover:rotate-45 transition-all duration-500">
                <ArrowUpRight size={16} />
            </div>
        </div>
    </div>
));

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
            if (containerWidth >= 1280) return 3;
            if (containerWidth >= 768) return 2;
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
            estimateSize: () => (viewMode === 'grid' ? 300 : 100),
            overscan: 3,
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

                    <div className="flex items-center gap-6 bg-card border border-border-theme p-4 rounded-[1.5rem] shadow-xl">
                        <div className="text-center px-2">
                            <p className="text-[8px] font-black text-foreground/30 uppercase tracking-widest mb-0.5">
                                Всего
                            </p>
                            <p className="text-xl font-black leading-none">{stats.total}</p>
                        </div>
                        <div className="w-[1px] h-8 bg-border-theme" />
                        <div className="text-center px-2">
                            <p className="text-[8px] font-black text-foreground/30 uppercase tracking-widest mb-0.5">
                                Бюджет
                            </p>
                            <p className="text-xl font-black leading-none">
                                {(stats.budget / 1000000).toFixed(1)}M
                            </p>
                        </div>
                    </div>
                </div>

                {/* Controls */}
                <div className="flex flex-wrap items-center justify-between gap-3 bg-card border border-border-theme p-3 rounded-[1.5rem] shadow-xl">
                    <div className="flex-1 min-w-[240px] relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground/20" />
                        <input
                            type="text"
                            value={pagination.search}
                            onChange={handleSearchChange}
                            placeholder="Поиск..."
                            className="w-full bg-background border border-border-theme rounded-xl pl-10 pr-8 py-3 text-[12px] font-bold outline-none focus:border-primary transition-all shadow-inner"
                        />
                        {isFetching && (
                            <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-primary" />
                        )}
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={handleSortToggle}
                            className="flex items-center gap-2 px-4 py-3 bg-background border border-border-theme rounded-xl text-[9px] font-black uppercase tracking-widest hover:text-primary transition-all"
                        >
                            <ArrowUpDown size={12} />{' '}
                            {pagination.sortOrder === 'desc' ? 'Новые' : 'Старые'}
                        </button>
                        <div className="flex bg-background p-1 rounded-xl border border-border-theme">
                            <button
                                onClick={() => setViewMode('grid')}
                                className={`p-2 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-primary text-white shadow-lg' : 'text-foreground/40 hover:text-primary'}`}
                            >
                                <LayoutGrid size={16} />
                            </button>
                            <button
                                onClick={() => setViewMode('list')}
                                className={`p-2 rounded-lg transition-all ${viewMode === 'list' ? 'bg-primary text-white shadow-lg' : 'text-foreground/40 hover:text-primary'}`}
                            >
                                <ListIcon size={16} />
                            </button>
                        </div>
                    </div>
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
                                                className="grid gap-4"
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
