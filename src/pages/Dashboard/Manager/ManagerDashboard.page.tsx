import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { DashboardHeader } from '@/features/dashboard/components/DashboardHeader';
import { DashboardSidebar } from '@/features/dashboard/components/DashboardSidebar';
import {
    ManagerCalculationsList,
    ManagerOverview,
    MasterInventoryManager,
} from '@/features/dashboard/manager/components';
import { GlobalChatHub } from '@/features/dashboard/components/GlobalChatHub';
import { ManagerKPIDashboard } from '@/features/dashboard/manager/components/ManagerKPIDashboard';
import { ClientCalculationDetails } from '@/features/dashboard/client/components/ClientCalculationDetails';
import { ClientProfile } from '@/features/dashboard/client/components/ClientProfile';
import type {
    Calculation,
    CalculationStatus,
    CalculationResults,
} from '@/features/dashboard/dashboard.types';
import { useAuth } from '@/features/auth';
import { useServices } from '@/app/di/ServiceContainer';
import { logger } from '@/core/logging';
import {
    useManagerWorkload,
    useUnassignedLeads,
    useCalculationActions,
    dashboardKeys,
    useCalculation,
} from '@/features/dashboard/hooks/useCalculations';

/**
 * Production-ready Manager Dashboard.
 * Refactored to use React Query for caching, deduping, and state management.
 */
export const ManagerDashboard: React.FC = () => {
    const { chatService } = useServices();
    const [sidebarOpen, setSidebarOpen] = useState(window.innerWidth >= 1024);
    const [searchParams, setSearchParams] = useSearchParams();
    const currentPage = searchParams.get('page') || 'overview';
    const selectedId = searchParams.get('id');

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

    const { user } = useAuth();
    const queryClient = useQueryClient();

    // Data Fetching Hooks
    const {
        data: myProjects = [],
        isLoading: loadingMy,
        error: errorMy,
    } = useManagerWorkload(user?.id);
    const { data: leads = [], isLoading: loadingLeads, error: errorLeads } = useUnassignedLeads();

    // Actions
    const { updateStatus, assignToMe, adjustExpert } = useCalculationActions();

    // Single Calculation Fetch (if selected)
    const { data: selectedCalculation } = useCalculation(selectedId);

    // Combine all calculations for Overview stats
    // Note: This approach mimics previous behavior. For large datasets, stats should come from backend.
    const allCalculations = React.useMemo(() => [...myProjects, ...leads], [myProjects, leads]);

    const loading = loadingMy || loadingLeads;
    const error = errorMy ? String(errorMy) : errorLeads ? String(errorLeads) : null;

    /**
     * Real-time Sync Subscription
     * When a signal arrives, we invalidate queries to trigger refetch.
     */
    useEffect(() => {
        if (!user?.id) return;

        const unsubscribe = chatService.subscribeToProjects(
            (payload: { id: string | number; isSignal?: boolean }) => {
                // Optimistic update logging
                if (import.meta.env.DEV) {
                    logger.debug(`[Sync:Pulse] ${payload.id} invalidating queries...`);
                }

                // Invalidate all dashboard data to ensure consistency
                // In a more complex app, we'd update specific cache entries
                queryClient.invalidateQueries({ queryKey: dashboardKeys.all });

                // Show toast if relevant (Re-implement specific toast logic if critical)
                // Simplified for now to focus on data consistency
            }
        );

        return () => unsubscribe();
    }, [user?.id, queryClient, chatService]);

    const handleAssign = async (id: string | number) => {
        assignToMe.mutate(
            { id, managerId: user!.id },
            {
                onSuccess: () => {
                    setSelectedId(null);
                    setCurrentPage('pipeline');
                },
            }
        );
    };

    const handleUpdateStatus = (
        id: number | string,
        status: CalculationStatus,
        additionalUpdates: Partial<Calculation> = {}
    ) => {
        updateStatus.mutate({
            id,
            status,
            updates: additionalUpdates,
        });
    };

    const handleAdjustExpert = async (
        id: string | number,
        results: CalculationResults,
        adjustments: Record<string, unknown>,
        version: number
    ) => {
        await adjustExpert.mutateAsync({ id, results, adjustments, version });
    };

    if (selectedCalculation) {
        return (
            <div className="min-h-screen bg-background flex flex-col">
                <DashboardHeader
                    sidebarOpen={false}
                    setSidebarOpen={() => {}}
                    title="Экспертиза расчета"
                />
                <main className="flex-1 overflow-auto bg-background/50">
                    <div className="p-4 sm:p-6 lg:p-8 max-w-[1400px] mx-auto w-full">
                        <ClientCalculationDetails
                            calculation={selectedCalculation}
                            displayId={selectedCalculation.project_number}
                            onBack={() => setSelectedId(null)}
                            onUpdateStatus={handleUpdateStatus}
                            onAdjustExpert={handleAdjustExpert}
                            onDelete={() => {}}
                            onEdit={() => {}}
                            onAssign={handleAssign}
                        />
                    </div>
                </main>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background flex flex-col">
            <DashboardHeader
                sidebarOpen={sidebarOpen}
                setSidebarOpen={setSidebarOpen}
                title={
                    currentPage === 'pipeline'
                        ? 'Проекты'
                        : currentPage === 'overview'
                          ? 'Обзор'
                            : currentPage === 'chat'
                            ? 'Чат'
                            : currentPage === 'kpi'
                              ? 'Мои показатели (KPI)'
                              : currentPage === 'kb'
                                ? 'Реестр товаров'
                                : 'Панель эксперта'
                }
            />

            <div className="flex flex-1 overflow-hidden">
                <DashboardSidebar
                    isOpen={sidebarOpen}
                    currentPage={currentPage}
                    onNavigate={(page) => {
                        setCurrentPage(page);
                        if (window.innerWidth < 1024) setSidebarOpen(false);
                    }}
                />

                <main className="flex-1 overflow-auto bg-background/30">
                    <div
                        className={
                            currentPage === 'chat'
                                ? 'w-full'
                                : 'p-4 sm:p-6 lg:p-8 max-w-[1400px] mx-auto w-full'
                        }
                    >
                        {error && (
                            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-500 text-[10px] font-black uppercase tracking-widest">
                                {error}
                            </div>
                        )}

                        {loading ? (
                            <div className="flex items-center justify-center py-40">
                                <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                            </div>
                        ) : (
                            <>
                                {currentPage === 'overview' && (
                                    <ManagerOverview
                                        calculations={allCalculations}
                                        onNavigate={setCurrentPage}
                                        onSelect={setSelectedId}
                                    />
                                )}
                                {currentPage === 'pipeline' && (
                                    <ManagerCalculationsList
                                        userId={user!.id}
                                        onSelect={(calc) => setSelectedId(calc.id)}
                                    />
                                )}
                                {currentPage === 'kb' && <MasterInventoryManager />}
                                {currentPage === 'chat' && <GlobalChatHub />}
                                {currentPage === 'kpi' && <ManagerKPIDashboard managerId={user!.id} />}
                                {currentPage === 'profile' && <ClientProfile />}
                            </>
                        )}
                    </div>
                </main>
            </div>
        </div>
    );
};
