import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ErrorBoundary } from '@/core/components/ErrorBoundary';
import { DashboardHeader } from '@/features/dashboard/components/DashboardHeader';
import { DashboardSidebar } from '@/features/dashboard/components/DashboardSidebar';
import { ClientCalculationsList } from '@/features/dashboard/client/components/ClientCalculationsList';
import { ClientCalculationDetails } from '@/features/dashboard/client/components/ClientCalculationDetails';
import { NewCalculationWizard } from '@/features/dashboard/client/components/NewCalculationWizard';
import { ClientProfile } from '@/features/dashboard/client/components/ClientProfile';
import { ClientOverview } from '@/features/dashboard/client/components/ClientOverview';
import { VenuePage } from '../Venue/Venue.page';
import { GlobalChatHub } from '@/features/dashboard/components/GlobalChatHub';
import type { Calculation } from '@/features/dashboard/dashboard.types';
import { useServices } from '@/core/di/ServiceContainer';
import type { Venue } from '@/services/venue.service';
import { useAuth } from '@/features/auth';
import { toast } from 'sonner';
import { logger } from '@/core/logging';

import { CalculationEntity } from '@/core/domain/CalculationEntity';

/**
 * Production-ready Client Dashboard.
 * Standardized synchronization logic and optimized state management.
 */
export const ClientDashboard: React.FC = () => {
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
    const [calculations, setCalculations] = useState<Calculation[]>([]);
    const [venues, setVenues] = useState<Venue[]>([]);
    const [isCreatingNew, setIsCreatingNew] = useState(false);
    const [editingCalculation, setEditingCalculation] = useState<Calculation | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const { user } = useAuth();
    const { calculationService, chatService, venueService } = useServices();

    // Performance and Sync Refs
    const state = useRef({
        isFetching: false,
        inFlightSyncs: new Set<string>(),
    });

    const selectedCalculation = React.useMemo(
        () => calculations.find((c) => String(c.id) === String(selectedId)) || null,
        [calculations, selectedId]
    );

    /**
     * Data fetcher with silent refresh support
     */
    const loadData = useCallback(
        async (isSilent = false) => {
            if (state.current.isFetching && !isSilent) return;
            try {
                state.current.isFetching = true;
                if (!isSilent) setLoading(true);
                setError(null);

                const [calcRes, venueRes] = await Promise.all([
                    calculationService.getMyCalculations(user!.id),
                    venueService.getVenues(),
                ]);

                if (calcRes.success && calcRes.data) {
                    setCalculations(calcRes.data);
                } else if (!isSilent) {
                    const msg = calcRes.error?.message || 'Ошибка загрузки расчетов';
                    setError(msg);
                    toast.error(msg);
                }

                if (venueRes.success && venueRes.data) {
                    setVenues(venueRes.data);
                } else if (!isSilent) {
                    logger.error('Failed to load venues', venueRes.error);
                }
            } catch (err: unknown) {
                setError(err instanceof Error ? err.message : 'Ошибка загрузки данных');
            } finally {
                setLoading(false);
                state.current.isFetching = false;
            }
        },
        [calculationService, venueService, user]
    );

    /**
     * Senior Sync Pattern
     */
    const syncProject = useCallback(
        async (id: string | number) => {
            const sid = String(id);
            if (state.current.inFlightSyncs.has(sid)) return;

            try {
                state.current.inFlightSyncs.add(sid);

                const res = await calculationService.getCalculation(id);
                if (!res.success || !res.data) {
                    logger.error('[Sync:Client:Error]', { id, error: res.error });
                    return;
                }
                const fullDoc = res.data;

                setCalculations((prev) => {
                    const index = prev.findIndex((c) => String(c.id) === sid);
                    if (index !== -1) {
                        const next = [...prev];
                        next[index] = fullDoc;
                        return next;
                    } else if (String(fullDoc.user_id) === String(user?.id)) {
                        return [fullDoc, ...prev];
                    }
                    return prev;
                });

                toast.info('Информация обновлена', { duration: 1500 });
            } catch {
                logger.warn('[Sync:Client:Retry]', { sid });
                loadData(true);
            } finally {
                state.current.inFlightSyncs.delete(sid);
            }
        },
        [user?.id, loadData, calculationService]
    );

    useEffect(() => {
        if (!user?.id) return;

        loadData();

        const unsubscribe = chatService.subscribeToProjects(
            (payload: { id: string | number; isSignal?: boolean }) => {
                if (import.meta.env.DEV) {
                    logger.debug(
                        `[Sync:Pulse:Client] ${payload.id} via ${payload.isSignal ? 'Signal' : 'DB'}`
                    );
                }
                syncProject(payload.id);
            }
        );

        return () => unsubscribe();
    }, [user?.id, loadData, syncProject, chatService]);

    const handleNewCalculationComplete = async (calculation: Calculation) => {
        try {
            setLoading(true);
            setError(null);
            if (editingCalculation) {
                const statusFromWizard = calculation.status;
                const nextStatus =
                    statusFromWizard === 'sent' && editingCalculation.status === 'changes'
                        ? 'revision'
                        : statusFromWizard;

                const res = await calculationService.update(calculation.id, {
                    ...calculation,
                    status: nextStatus as Calculation['status'],
                });

                if (!res.success || !res.data)
                    throw new Error(res.error?.message || 'Update failed');
                const updated = res.data;

                setCalculations((prev) =>
                    prev.map((c) => (String(c.id) === String(updated.id) ? updated : c))
                );
                setEditingCalculation(null);
                setSelectedId(updated.id);
                await chatService.sendSyncSignal(updated.id, 'UPDATE');

                if (nextStatus === 'revision') {
                    toast.success('Правки внесены и отправлены эксперту');
                } else if (nextStatus === 'sent') {
                    toast.success('Расчет отправлен эксперту на проверку');
                } else {
                    toast.success('Черновик успешно обновлен');
                }
            } else {
                const res = await calculationService.create(calculation, user!.id);
                if (!res.success || !res.data)
                    throw new Error(res.error?.message || 'Creation failed');
                const created = res.data;

                setCalculations([created, ...calculations]);
                setSelectedId(created.id);
                await chatService.sendSyncSignal(created.id, 'INSERT');
                toast.success(
                    calculation.status === 'draft'
                        ? 'Черновик сохранен'
                        : 'Расчет создан и отправлен на аудит'
                );
            }
            setIsCreatingNew(false);
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'Ошибка сохранения');
            window.scrollTo({ top: 0, behavior: 'smooth' });
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateStatus = async (
        id: number | string,
        status: Calculation['status'],
        additional?: Partial<Calculation>
    ) => {
        const current = calculations.find((c) => String(c.id) === String(id));
        if (current) {
            const entity = new CalculationEntity(current);
            if (status !== current.status && !entity.canTransitionTo(status)) {
                toast.error(`Невозможно перевести статус из "${current.status}" в "${status}"`);
                return;
            }
        }

        try {
            const res = await calculationService.update(id, { status, ...additional });
            if (!res.success || !res.data)
                throw new Error(res.error?.message || 'Status update failed');
            const updated = res.data;

            setCalculations((prev) => prev.map((c) => (String(c.id) === String(id) ? updated : c)));
            await chatService.sendSyncSignal(id, 'UPDATE');
            toast.success('Статус изменен');
        } catch (err: unknown) {
            toast.error(err instanceof Error ? err.message : 'Ошибка изменения статуса');
        }
    };

    const handleDeleteCalculation = async (id: number | string) => {
        try {
            const res = await calculationService.delete(id);
            if (!res.success) throw new Error(res.error?.message || 'Delete failed');

            setCalculations((prev) => prev.filter((c) => String(c.id) !== String(id)));
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

    if (isCreatingNew) {
        return (
            <div className="min-h-screen bg-background flex flex-col">
                <DashboardHeader
                    sidebarOpen={false}
                    setSidebarOpen={() => {}}
                    title={editingCalculation ? 'Редактирование' : 'Новый расчет'}
                />
                <main className="flex-1 overflow-auto bg-background/50">
                    <div className="p-4 sm:p-6 lg:p-8">
                        <NewCalculationWizard
                            onCancel={() => {
                                setIsCreatingNew(false);
                                setEditingCalculation(null);
                            }}
                            onComplete={handleNewCalculationComplete}
                            initialData={editingCalculation || undefined}
                        />
                    </div>
                </main>
            </div>
        );
    }

    if (selectedCalculation) {
        return (
            <div className="min-h-screen bg-background flex flex-col">
                <DashboardHeader
                    sidebarOpen={false}
                    setSidebarOpen={() => {}}
                    title="Детали проекта"
                />
                <main className="flex-1 overflow-auto bg-background/50">
                    <div className="p-4 sm:p-6 lg:p-8 max-w-[1400px] mx-auto w-full">
                        <ErrorBoundary>
                            <ClientCalculationDetails
                                calculation={selectedCalculation}
                                displayId={
                                    calculations.findIndex(
                                        (c) => String(c.id) === String(selectedId)
                                    ) + 1
                                }
                                onBack={() => setSelectedId(null)}
                                onUpdateStatus={handleUpdateStatus}
                                onDelete={handleDeleteCalculation}
                                onEdit={handleEditCalculation}
                            />
                        </ErrorBoundary>
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
                    currentPage === 'profile'
                        ? 'Профиль'
                        : currentPage === 'venue'
                          ? 'Заведения'
                          : currentPage === 'chat'
                              ? 'Чат'
                              : currentPage === 'overview'
                                ? 'Обзор'
                                : 'Мои расчеты'
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
                            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-500 text-[10px] font-black uppercase tracking-widest leading-relaxed">
                                {error}
                            </div>
                        )}

                        {loading && calculations.length === 0 ? (
                            <div className="flex items-center justify-center py-40">
                                <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                            </div>
                        ) : (
                            <ErrorBoundary>
                                {currentPage === 'overview' && (
                                    <ClientOverview
                                        calculations={calculations}
                                        venuesCount={venues.length}
                                        onNewCalculation={() => setIsCreatingNew(true)}
                                        onViewAllCalculations={() => setCurrentPage('calculations')}
                                        onNavigateToVenues={() => setCurrentPage('venue')}
                                        onSelectCalculation={(calc) => setSelectedId(calc.id)}
                                    />
                                )}
                                {currentPage === 'calculations' && (
                                    <ClientCalculationsList
                                        calculations={calculations}
                                        onSelect={(calc) => setSelectedId(calc.id)}
                                        onNewCalculation={() => setIsCreatingNew(true)}
                                    />
                                )}
                                {currentPage === 'venue' && <VenuePage />}
                                {currentPage === 'profile' && <ClientProfile />}
                                {currentPage === 'chat' && <GlobalChatHub />}
                            </ErrorBoundary>
                        )}
                    </div>
                </main>
            </div>
        </div>
    );
};
