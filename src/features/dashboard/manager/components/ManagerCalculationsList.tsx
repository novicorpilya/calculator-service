import React, { useMemo, useRef, useEffect } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { useSearchParams } from 'react-router-dom';
import {
    ChevronRight,
    ChevronLeft,
    Briefcase,
    Inbox,
    Globe,
    Loader2,
    Search,
} from 'lucide-react';
import { type Calculation } from '../../dashboard.types';
import { CalculationEntity } from '@/core/domain/CalculationEntity';
import { CalculationViewModel } from '@/features/dashboard/presentation/CalculationViewModel';
import { usePaginatedCalculations } from '../../hooks/usePaginatedCalculations';
import { useUnreadCount } from '@/features/chat/hooks';

// Sub-components
import { CalculationCard } from './list/CalculationCard';
import { CalculationRow } from './list/CalculationRow';
import { ListFilters } from './list/ListFilters';

interface ManagerCalculationsListProps {
    userId: string;
    onSelect: (calc: Calculation) => void;
}

export const ManagerCalculationsList = React.memo<ManagerCalculationsListProps>(
    ({ userId, onSelect }) => {
        const [viewMode, setViewMode] = React.useState<'grid' | 'list'>('grid');
        const [searchParams, setSearchParams] = useSearchParams();
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
            setHideArchived,
        } = usePaginatedCalculations(userId);

        // AUTO-SELECT project from URL (Deep Linking for Notifications)
        useEffect(() => {
            const projectId = searchParams.get('project');
            if (projectId && calculations.length > 0) {
                const targetProject = calculations.find(c => String(c.id) === projectId);
                if (targetProject) {
                    onSelect(targetProject);
                    // Clear the param so it doesn't re-open on every list refresh
                    const newParams = new URLSearchParams(searchParams);
                    newParams.delete('project');
                    setSearchParams(newParams, { replace: true });
                }
            }
        }, [calculations, searchParams, onSelect, setSearchParams]);

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

        // Virtualizer
        // eslint-disable-next-line react-hooks/incompatible-library -- TanStack Virtual is known incompatible with React Compiler memoization
        const rowVirtualizer = useVirtualizer({
            count: rowCount,
            getScrollElement: () => parentRef.current,
            estimateSize: () => (viewMode === 'grid' ? 440 : 110),
            overscan: 4,
        });

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

                {/* Filters & View Mode */}
                <ListFilters 
                    search={pagination.search}
                    status={pagination.status}
                    hideArchived={pagination.hideArchived}
                    sortOrder={pagination.sortOrder}
                    viewMode={viewMode}
                    isFetching={isFetching}
                    onSearchChange={setSearch}
                    onStatusChange={setStatus}
                    onHideArchivedToggle={() => setHideArchived(!pagination.hideArchived)}
                    onSortToggle={handleSortToggle}
                    onViewModeChange={setViewMode}
                />

                {/* Main Content Area */}
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

ManagerCalculationsList.displayName = 'ManagerCalculationsList';

