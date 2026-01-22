import React, { useMemo, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { type Calculation } from '../../dashboard.types';
import { CalculationEntity } from '@/core/domain/CalculationEntity';
import { CalculationViewModel } from '@/features/dashboard/presentation/CalculationViewModel';
import { usePaginatedCalculations } from '../../hooks/usePaginatedCalculations';
import { useCalculationSync } from '../../hooks/useCalculationSync';
import { KanbanBoard } from './kanban/KanbanBoard';

interface ManagerCalculationsListProps {
    userId: string;
    onSelect: (calc: Calculation) => void;
}

export const ManagerCalculationsList: React.FC<ManagerCalculationsListProps> = React.memo(
    ({ userId, onSelect }) => {
        const [searchParams, setSearchParams] = useSearchParams();

        // Realtime sync for instant status updates
        useCalculationSync(userId);

        const { calculations, total } = usePaginatedCalculations(userId);

        // AUTO-SELECT project from URL (Deep Linking for Notifications)
        useEffect(() => {
            const projectId = searchParams.get('project');
            if (projectId && calculations.length > 0) {
                const targetProject = calculations.find((c) => String(c.id) === projectId);
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

        return (
            <div className="space-y-4 sm:space-y-6 animate-in fade-in duration-700 flex flex-col h-full">
                {/* Header Area */}
                <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 sm:gap-6 shrink-0">
                    <div className="space-y-3 sm:space-y-4">
                        <div className="space-y-1">
                            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black uppercase tracking-tighter">
                                Управление потоком
                            </h1>
                            <p className="text-[9px] sm:text-[10px] font-black uppercase tracking-[0.2em] sm:tracking-[0.3em] text-primary border-l-2 sm:border-l-4 border-primary pl-3 sm:pl-4">
                                {total} активных сделок
                            </p>
                        </div>
                    </div>

                    <div className="flex items-stretch gap-1 sm:gap-2 bg-card border border-border-theme p-1.5 sm:p-2 rounded-[1.5rem] sm:rounded-[2.5rem] shadow-2xl relative overflow-hidden group/stats">
                        <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-orange-500/5 opacity-0 group-hover/stats:opacity-100 transition-opacity" />

                        <div className="relative z-10 flex items-center gap-2 sm:gap-4 px-3 sm:px-6 py-1.5 sm:py-2">
                            <div className="text-center">
                                <p className="text-[7px] sm:text-[8px] font-black text-foreground/50 uppercase tracking-[0.2em] sm:tracking-[0.3em] mb-0.5 sm:mb-1">
                                    Активных
                                </p>
                                <p className="text-xl sm:text-3xl font-black leading-none tracking-tighter">
                                    {stats.total}
                                </p>
                            </div>
                        </div>

                        <div className="w-[1px] my-2 sm:my-3 bg-border-theme/60" />

                        <div className="relative z-10 flex items-center gap-2 sm:gap-4 px-3 sm:px-6 py-1.5 sm:py-2">
                            <div className="text-center">
                                <p className="text-[7px] sm:text-[8px] font-black text-foreground/50 uppercase tracking-[0.2em] sm:tracking-[0.3em] mb-0.5 sm:mb-1">
                                    Оборот
                                </p>
                                <p className="text-xl sm:text-3xl font-black leading-none tracking-tighter text-primary">
                                    {(stats.budget / 1000000).toFixed(1)}M
                                    <span className="text-xs sm:text-sm ml-1 text-foreground/50">
                                        ₽
                                    </span>
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Kanban Content Area */}
                <div className="flex-1 overflow-hidden min-h-0">
                    <KanbanBoard userId={userId} onViewProject={onSelect} />
                </div>
            </div>
        );
    }
);

ManagerCalculationsList.displayName = 'ManagerCalculationsList';
