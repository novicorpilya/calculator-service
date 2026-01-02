import React, { useState, useEffect, useCallback } from 'react';
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
import type { Calculation, CalculationStatus } from '@/features/dashboard/dashboard.types';
import { calculationsService } from '@/services/calculations.service';
import { chatService } from '@/services/chat.service';
import { useAuth } from '@/features/auth';
import { toast } from 'sonner';

export const ManagerDashboard: React.FC = () => {
    const [sidebarOpen, setSidebarOpen] = useState(window.innerWidth >= 1024);
    const [currentPage, setCurrentPage] = useState('overview');
    const [calculations, setCalculations] = useState<Calculation[]>([]);
    const [managerProjects, setManagerProjects] = useState<Calculation[]>([]);
    const [unassignedLeads, setUnassignedLeads] = useState<Calculation[]>([]);
    const [selectedCalculation, setSelectedCalculation] = useState<Calculation | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const { user } = useAuth();
    const isFetching = React.useRef(false);

    const loadData = useCallback(async (isSilent = false) => {
        if (isFetching.current) return;

        try {
            isFetching.current = true;
            if (!isSilent && calculations.length === 0) setLoading(true);
            setError(null);

            const [myProjects, newLeads] = await Promise.all([
                calculationsService.getManagerWorkload(),
                calculationsService.getUnassignedCalculations()
            ]);

            setManagerProjects(myProjects);
            setUnassignedLeads(newLeads);
            setCalculations([...myProjects, ...newLeads]);
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : String(err);
            setError(message || 'Ошибка загрузки данных');
        } finally {
            setLoading(false);
            isFetching.current = false;
        }
    }, [calculations.length]);

    useEffect(() => {
        if (user?.id) {
            loadData();

            // Real-time synchronization for manager
            const unsubscribe = chatService.subscribeToCalculations(() => {
                loadData(true);
            });

            return () => unsubscribe();
        }
    }, [user?.id, loadData]);

    const handleAssign = async (id: string | number) => {
        try {
            setLoading(true);
            await calculationsService.assignToMe(id);
            toast.success('Проект успешно закреплен за вами');
            await loadData(true); // Silent after action to keep UI smooth
            setSelectedCalculation(null);
            setCurrentPage('pipeline');
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : String(err);
            toast.error('Ошибка при назначении: ' + message);
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateStatus = async (id: number | string, status: CalculationStatus) => {
        try {
            const updated = await calculationsService.updateCalculation(id, { status });
            setCalculations(prev => prev.map(c => c.id === id ? updated : c));
            if (selectedCalculation?.id === id) setSelectedCalculation(updated);
            toast.success(`Статус проекта обновлен на: ${status}`);
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : String(err);
            toast.error('Ошибка обновления: ' + message);
        }
    };

    if (selectedCalculation) {
        return (
            <div className="min-h-screen bg-background flex flex-col">
                <DashboardHeader sidebarOpen={false} setSidebarOpen={() => { }} title="Экспертиза расчета" />
                <main className="flex-1 overflow-auto">
                    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
                        <ClientCalculationDetails
                            calculation={selectedCalculation}
                            onBack={() => setSelectedCalculation(null)}
                            onUpdateStatus={handleUpdateStatus}
                            onDelete={() => { }} // Managers usually don't delete
                            onEdit={() => { }} // TODO: Manager specific edit mode
                        />

                        {!selectedCalculation.manager_id && (
                            <div className="mt-8 flex justify-center">
                                <button
                                    onClick={() => handleAssign(selectedCalculation.id)}
                                    className="btn-premium lg:scale-125 shadow-2xl shadow-primary/40"
                                >
                                    Взять проект в работу
                                </button>
                            </div>
                        )}
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
                    currentPage === 'pipeline' ? 'Воронка проектов' :
                        currentPage === 'overview' ? 'Аналитика эксперта' :
                            currentPage === 'chat' ? 'Центр коммуникаций' :
                                currentPage === 'kb' ? 'База знаний' : 'Панель эксперта'
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

                <main className="flex-1 overflow-auto bg-background">
                    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
                        {error && (
                            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-500 text-sm font-black tracking-widest uppercase">
                                {error}
                            </div>
                        )}

                        {loading ? (
                            <div className="flex items-center justify-center py-20">
                                <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
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
                                        onSelect={setSelectedCalculation}
                                    />
                                )}
                                {currentPage === 'kb' && (
                                    <MasterInventoryManager />
                                )}
                                {currentPage === 'chat' && (
                                    <GlobalChatHub />
                                )}
                                {currentPage === 'clients' && (
                                    <div className="py-20 text-center glass-card border-dashed">
                                        <p className="text-[10px] font-black uppercase tracking-widest text-foreground/30">Раздел управления клиентами в разработке</p>
                                    </div>
                                )}
                                {currentPage === 'profile' && <ClientProfile />}
                            </>
                        )}
                    </div>
                </main>
            </div>
        </div>
    );
};
