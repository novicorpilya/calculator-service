import React, { useState, useEffect, useCallback, useRef } from 'react';
import { DashboardHeader } from '@/features/dashboard/components/DashboardHeader';
import { DashboardSidebar } from '@/features/dashboard/components/DashboardSidebar';
import {
    ManagerCalculationsList,
    ManagerOverview,
    MasterInventoryManager
} from '@/features/dashboard/manager/components';
import { GlobalChatHub } from '@/features/dashboard/components/GlobalChatHub';
import { ClientCalculationDetails } from '@/features/dashboard/client/components/ClientCalculationDetails';
import { ClientProfile } from '@/features/dashboard/client/components/ClientProfile';
import type { Calculation, CalculationStatus, SyncPayload } from '@/features/dashboard/dashboard.types';
import { calculationsService } from '@/services/calculations.service';
import { chatService } from '@/services/chat.service';
import { useAuth } from '@/features/auth';
import { toast } from 'sonner';

/**
 * Production-ready Manager Dashboard.
 * Implements high-consistency synchronization and unified state.
 */
export const ManagerDashboard: React.FC = () => {
    const [sidebarOpen, setSidebarOpen] = useState(window.innerWidth >= 1024);
    const [currentPage, setCurrentPage] = useState('overview');
    const [calculations, setCalculations] = useState<Calculation[]>([]);
    const [selectedId, setSelectedId] = useState<string | number | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const { user } = useAuth();

    // Unified Sync Context (Persistent across renders, but isolated from React State)
    const syncContext = useRef({
        isFetching: false,
        inFlightSyncs: new Set<string>(),
        notifications: new Set<string>() // Deduplication set for toasts
    });

    const managerProjects = React.useMemo(() =>
        calculations.filter(c => String(c.manager_id) === String(user?.id)),
        [calculations, user?.id]);

    const unassignedLeads = React.useMemo(() =>
        calculations.filter(c => !c.manager_id && c.status !== 'draft'),
        [calculations]);

    const selectedCalculation = React.useMemo(() =>
        calculations.find(c => String(c.id) === String(selectedId)) || null,
        [calculations, selectedId]);

    /**
     * Authoritative data fetcher
     */
    const loadData = useCallback(async (isSilent = false) => {
        if (syncContext.current.isFetching && !isSilent) return;
        try {
            syncContext.current.isFetching = true;
            if (!isSilent) setLoading(true);
            setError(null);

            const [myProjects, newLeads] = await Promise.all([
                calculationsService.getManagerWorkload(),
                calculationsService.getUnassignedCalculations()
            ]);

            setCalculations([...myProjects, ...newLeads]);
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'Ошибка синхронизации данных');
        } finally {
            setLoading(false);
            syncContext.current.isFetching = false;
        }
    }, []);

    /**
     * Senior Sync: High-consistency entity refresh
     */
    const syncProject = useCallback(async (id: string | number) => {
        const sid = String(id);
        if (syncContext.current.inFlightSyncs.has(sid)) return;

        try {
            syncContext.current.inFlightSyncs.add(sid);

            // DB Propagation Delay (Read-after-Write safety)
            await new Promise(r => setTimeout(r, 450));

            const fullDoc = await calculationsService.getCalculationById(id);

            setCalculations(prev => {
                const index = prev.findIndex(c => String(c.id) === sid);
                const prevDoc = prev[index];

                // Unified Notification Logic with Deduplication
                const notifyKey = `${sid}_${fullDoc.status}`;
                if (fullDoc.status === 'revision' && prevDoc?.status !== 'revision') {
                    if (!syncContext.current.notifications.has(notifyKey)) {
                        toast.success(`Клиент внес правки в проект «${fullDoc.organizationName}»`, {
                            icon: '✨',
                            duration: 5000,
                            id: `toast_${sid}`
                        });
                        syncContext.current.notifications.add(notifyKey);
                    }
                }

                if (index !== -1) {
                    const newArr = [...prev];
                    newArr[index] = fullDoc;
                    return newArr;
                } else if (fullDoc.status !== 'draft' || String(fullDoc.manager_id) === String(user?.id)) {
                    return [fullDoc, ...prev];
                }
                return prev;
            });

        } catch (err) {
            console.error('[Sync:Error]', sid, err);
            loadData(true);
        } finally {
            syncContext.current.inFlightSyncs.delete(sid);
        }
    }, [user?.id, loadData]);

    useEffect(() => {
        if (!user?.id) return;

        loadData();

        const unsubscribe = chatService.subscribeToCalculations((payload: SyncPayload) => {
            if (import.meta.env.DEV) {
                console.debug(`[Sync:Pulse] ${payload.id} via ${payload.isSignal ? 'Signal' : 'DB'}`);
            }
            syncProject(payload.id);
        });

        return () => unsubscribe();
    }, [user?.id, loadData, syncProject]);

    const handleAssign = async (id: string | number) => {
        try {
            setLoading(true);
            await calculationsService.assignToMe(id);
            toast.success('Проект взят в работу');
            await chatService.sendSyncSignal(id, 'UPDATE');
            setSelectedId(null);
            setCurrentPage('pipeline');
            await loadData(true);
        } catch (err: unknown) {
            toast.error(err instanceof Error ? err.message : 'Ошибка назначения');
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateStatus = async (id: number | string, status: CalculationStatus, additionalUpdates: Partial<Calculation> = {}) => {
        try {
            const updated = await calculationsService.updateCalculation(id, { status, ...additionalUpdates });
            setCalculations(prev => prev.map(c => String(c.id) === String(id) ? updated : c));
            await chatService.sendSyncSignal(id, 'UPDATE');
            if (!additionalUpdates.results) {
                toast.success(`Статус: ${status}`);
            }
        } catch (err: unknown) {
            toast.error(err instanceof Error ? err.message : 'Ошибка назначения');
        }
    };

    if (selectedCalculation) {
        return (
            <div className="min-h-screen bg-background flex flex-col">
                <DashboardHeader sidebarOpen={false} setSidebarOpen={() => { }} title="Экспертиза расчета" />
                <main className="flex-1 overflow-auto bg-background/50">
                    <div className="p-4 sm:p-6 lg:p-8 max-w-[1400px] mx-auto w-full">
                        <ClientCalculationDetails
                            calculation={selectedCalculation}
                            onBack={() => setSelectedId(null)}
                            onUpdateStatus={handleUpdateStatus}
                            onDelete={() => { }}
                            onEdit={() => { }}
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
                    currentPage === 'pipeline' ? 'Проекты' :
                        currentPage === 'overview' ? 'Обзор' :
                            currentPage === 'chat' ? 'Чат' :
                                currentPage === 'kb' ? 'Инвентарь' : 'Панель эксперта'
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
                    <div className={currentPage === 'chat' ? 'w-full' : 'p-4 sm:p-6 lg:p-8 max-w-[1400px] mx-auto w-full'}>
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
                                    <ManagerOverview calculations={calculations} onNavigate={setCurrentPage} />
                                )}
                                {currentPage === 'pipeline' && (
                                    <ManagerCalculationsList
                                        myProjects={managerProjects}
                                        unassignedLeads={unassignedLeads}
                                        onSelect={(calc) => setSelectedId(calc.id)}
                                    />
                                )}
                                {currentPage === 'kb' && <MasterInventoryManager />}
                                {currentPage === 'chat' && <GlobalChatHub />}
                                {currentPage === 'profile' && <ClientProfile />}
                            </>
                        )}
                    </div>
                </main>
            </div>
        </div>
    );
};
