import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { ErrorBoundary } from '@/core/components/ErrorBoundary';
import { ClientCalculationsList } from '@/features/dashboard/client/components/ClientCalculationsList';
import { ClientCalculationDetails } from '@/features/dashboard/client/components/ClientCalculationDetails';
import { NewCalculationWizard } from '@/features/dashboard/client/components/NewCalculationWizard';
import { ClientProfile } from '@/features/dashboard/client/components/ClientProfile';
import { ClientOverview, AnalyticsDashboard } from '@/features/dashboard/client/components';
import { VenuePage } from '../Venue/Venue.page';
import { GlobalChatHub } from '@/features/dashboard/components/GlobalChatHub';
import type { Calculation } from '@/features/dashboard/dashboard.types';
import { useServices } from '@/app/di/ServiceContainer';
import { useAuth } from '@/features/auth/index.ts';
import { toast } from 'sonner';
import {
    useCalculationActions,
    useMyCalculations,
} from '@/features/dashboard/hooks/useCalculations';
import { useCalculationSync } from '@/features/dashboard/hooks/useCalculationSync';
import { useQueryClient } from '@tanstack/react-query';
import { dashboardKeys } from '@/features/dashboard/hooks/useCalculations';

/**
 * Production-ready Client Dashboard.
 * Optimized with React Query for "seamless" navigation.
 */
export const ClientDashboard: React.FC = () => {
    const queryClient = useQueryClient();
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    const { user } = useAuth();
    const { calculationService, chatService } = useServices();
    const { smartReorder } = useCalculationActions();

    // Realtime sync for instant status updates
    useCalculationSync(user?.id ?? null);

    const currentPage = searchParams.get('page') || 'overview';
    const selectedId = searchParams.get('id');

    // Data fetching hooks - caches data for SPA experience
    const {
        data: calculations = [],
        isLoading: calculationsLoading,
        error: calculationsError,
    } = useMyCalculations(user?.id);

    const [isCreatingNew, setIsCreatingNew] = useState(() => {
        if (typeof window !== 'undefined') {
            return !!localStorage.getItem('calculator_draft_data');
        }
        return false;
    });
    const [editingCalculation, setEditingCalculation] = useState<Calculation | null>(null);
    const [error, setError] = useState<string | null>(null);

    const loading = calculationsLoading && calculations.length === 0;

    const setCurrentPage = useCallback(
        (page: string) => {
            setSearchParams((prev) => {
                const next = new URLSearchParams(prev);
                next.set('page', page);
                next.delete('id');
                return next;
            });
        },
        [setSearchParams]
    );

    const setSelectedId = useCallback(
        (id: string | number | null) => {
            setSearchParams((prev) => {
                const next = new URLSearchParams(prev);
                if (id) next.set('id', String(id));
                else next.delete('id');
                return next;
            });
        },
        [setSearchParams]
    );

    // AUTO-SELECT project from URL
    useEffect(() => {
        const urlProjectId = searchParams.get('project');
        if (urlProjectId) {
            setSelectedId(urlProjectId);
            const newParams = new URLSearchParams(searchParams);
            newParams.delete('project');
            setSearchParams(newParams, { replace: true });
        }
    }, [searchParams, setSelectedId, setSearchParams]);

    // Sync Ref for real-time updates
    const state = useRef({
        inFlightSyncs: new Set<string>(),
    });

    const selectedCalculation = React.useMemo(
        () => calculations.find((c) => String(c.id) === String(selectedId)) || null,
        [calculations, selectedId]
    );

    const syncProject = useCallback(
        async (id: string | number) => {
            const sid = String(id);
            if (state.current.inFlightSyncs.has(sid)) return;
            try {
                state.current.inFlightSyncs.add(sid);
                queryClient.invalidateQueries({ queryKey: dashboardKeys.mine(user?.id || '') });
            } finally {
                state.current.inFlightSyncs.delete(sid);
            }
        },
        [user?.id, queryClient]
    );

    useEffect(() => {
        if (!user?.id) return;
        const unsubscribe = chatService.subscribeToProjects(
            (payload: { id: string | number; isSignal?: boolean }) => {
                syncProject(payload.id);
            }
        );
        return () => unsubscribe();
    }, [user?.id, syncProject, chatService]);

    const handleNewCalculationComplete = async (calculation: Calculation) => {
        try {
            setError(null);

            const isExistingProject =
                editingCalculation &&
                calculations.some((c) => String(c.id) === String(editingCalculation.id));

            if (isExistingProject && editingCalculation) {
                const res = await calculationService.update(calculation.id, calculation);
                if (!res.success || !res.data)
                    throw new Error(res.error?.message || 'Update failed');
                toast.success('Расчет обновлен');
            } else {
                const res = await calculationService.create(calculation, user!.id);
                if (!res.success || !res.data)
                    throw new Error(res.error?.message || 'Creation failed');
                toast.success('Расчет создан');
            }
            setIsCreatingNew(false);
            setEditingCalculation(null);
            queryClient.invalidateQueries({ queryKey: dashboardKeys.mine(user?.id || '') });
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'Ошибка сохранения');
        }
    };

    const handleUpdateStatus = async (
        id: number | string,
        status: Calculation['status'],
        additional?: Partial<Calculation>
    ) => {
        try {
            const res = await calculationService.update(id, { status, ...additional });
            if (!res.success) throw new Error(res.error?.message);
            queryClient.invalidateQueries({ queryKey: dashboardKeys.mine(user?.id || '') });
            toast.success('Статус изменен');
        } catch (err: unknown) {
            toast.error(err instanceof Error ? err.message : 'Ошибка изменения статуса');
        }
    };

    const handleDeleteCalculation = async (id: number | string) => {
        try {
            const res = await calculationService.delete(id);
            if (!res.success) throw new Error(res.error?.message);
            queryClient.invalidateQueries({ queryKey: dashboardKeys.mine(user?.id || '') });
            setSelectedId(null);
            toast.success('Расчет удален');
        } catch (err: unknown) {
            toast.error(err instanceof Error ? err.message : 'Ошибка удаления');
        }
    };

    const handleEditCalculation = (calc: Calculation) => {
        setEditingCalculation(calc);
        setIsCreatingNew(true);
    };

    const handleSmartReorder = async (calc: Calculation) => {
        try {
            await smartReorder.mutateAsync({ id: calc.id });
            queryClient.invalidateQueries({ queryKey: dashboardKeys.mine(user?.id || '') });
        } catch {
            // Silently handle reorder errors
        }
    };

    if (isCreatingNew) {
        return (
            <div className="p-4 sm:p-6 lg:p-8">
                <NewCalculationWizard
                    onCancel={() => {
                        setIsCreatingNew(false);
                        setEditingCalculation(null);
                        localStorage.removeItem('calculator_draft_data');
                    }}
                    onComplete={handleNewCalculationComplete}
                    initialData={editingCalculation || undefined}
                />
            </div>
        );
    }

    if (selectedCalculation) {
        return (
            <div className="p-4 sm:p-6 lg:p-8 max-w-[1400px] mx-auto w-full">
                <ErrorBoundary>
                    <ClientCalculationDetails
                        calculation={selectedCalculation}
                        displayId={
                            calculations.findIndex((c) => String(c.id) === String(selectedId)) + 1
                        }
                        onBack={() => setSelectedId(null)}
                        onUpdateStatus={handleUpdateStatus}
                        onDelete={handleDeleteCalculation}
                        onEdit={handleEditCalculation}
                    />
                </ErrorBoundary>
            </div>
        );
    }

    return (
        <div className="w-full h-full bg-transparent flex flex-col">
            <div
                className={
                    currentPage === 'chat'
                        ? 'w-full'
                        : 'p-4 sm:p-6 lg:p-8 max-w-[1400px] mx-auto w-full'
                }
            >
                {(error || calculationsError) && (
                    <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-500 text-[10px] font-black uppercase tracking-widest leading-relaxed">
                        {error || (calculationsError as Error)?.message}
                    </div>
                )}

                {loading ? (
                    <div className="flex items-center justify-center py-40">
                        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                    </div>
                ) : (
                    <ErrorBoundary>
                        {currentPage === 'overview' && (
                            <ClientOverview
                                calculations={calculations}
                                onNewCalculation={() => setIsCreatingNew(true)}
                                onViewAllCalculations={() => setCurrentPage('calculations')}
                                onSelectCalculation={(calc) => setSelectedId(calc.id)}
                                onCloneCalculation={handleSmartReorder}
                                onBudgetPlanner={() => navigate('/dashboard/client/budget-planner')}
                            />
                        )}
                        {currentPage === 'analytics' && <AnalyticsDashboard />}
                        {currentPage === 'calculations' && (
                            <ClientCalculationsList
                                calculations={calculations}
                                onSelect={(calc) => setSelectedId(calc.id)}
                                onNewCalculation={() => setIsCreatingNew(true)}
                                onClone={handleSmartReorder}
                            />
                        )}
                        {currentPage === 'venue' && <VenuePage />}
                        {currentPage === 'profile' && <ClientProfile />}
                        {currentPage === 'chat' && <GlobalChatHub />}
                    </ErrorBoundary>
                )}
            </div>
        </div>
    );
};
