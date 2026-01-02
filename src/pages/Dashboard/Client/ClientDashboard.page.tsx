import React, { useState, useEffect } from 'react';
import { DashboardHeader } from '@/features/dashboard/components/DashboardHeader';
import { DashboardSidebar } from '@/features/dashboard/components/DashboardSidebar';
import { ClientCalculationsList } from '@/features/dashboard/client/components/ClientCalculationsList';
import { ClientCalculationDetails } from '@/features/dashboard/client/components/ClientCalculationDetails';
import { NewCalculationWizard } from '@/features/dashboard/client/components/NewCalculationWizard';
import { ClientProfile } from '@/features/dashboard/client/components/ClientProfile';
import { ClientOverview } from '@/features/dashboard/client/components/ClientOverview';
import { InventoryManager } from '@/features/dashboard/client/components/InventoryManager';
import { VenuePage } from '../Venue/Venue.page';
import { GlobalChatHub } from '@/features/dashboard/components/GlobalChatHub';
import type { Calculation } from '@/features/dashboard/dashboard.types';
import { calculationsService } from '@/services/calculations.service';
import { venueService, type Venue } from '@/services/venue.service';
import { chatService } from '@/services/chat.service';
import { useAuth } from '@/features/auth';
import { toast } from 'sonner';

export const ClientDashboard: React.FC = () => {
    const [sidebarOpen, setSidebarOpen] = useState(window.innerWidth >= 1024);
    const [currentPage, setCurrentPage] = useState('overview');
    const [calculations, setCalculations] = useState<Calculation[]>([]);
    const [venues, setVenues] = useState<Venue[]>([]);
    const [selectedCalculation, setSelectedCalculation] = useState<Calculation | null>(null);
    const [isCreatingNew, setIsCreatingNew] = useState(false);
    const [editingCalculation, setEditingCalculation] = useState<Calculation | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const { user } = useAuth();

    const isFetching = React.useRef(false);

    useEffect(() => {
        if (user?.id) {
            loadData();

            // Subscribe only to projects belonging to this user
            const unsubscribe = chatService.subscribeToCalculations(() => {
                loadData(true); // Silent update contextually
            }, `user_id=eq.${user.id}`);

            return () => unsubscribe();
        }
    }, [user?.id]);

    const loadData = async (isSilent = false) => {
        if (isFetching.current) return;

        try {
            isFetching.current = true;
            // Only show global loader if we have NO data yet and it's a primary fetch
            if (!isSilent && calculations.length === 0) setLoading(true);
            setError(null);

            const [calcData, venueData] = await Promise.all([
                calculationsService.getMyCalculations(),
                venueService.getVenues()
            ]);

            setCalculations(calcData);
            setVenues(venueData);

            if (selectedCalculation) {
                const updatedSelected = calcData.find(c => c.id === selectedCalculation.id);
                if (updatedSelected) setSelectedCalculation(updatedSelected);
            }
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : String(err);
            setError(message || 'Ошибка при загрузке данных');
        } finally {
            setLoading(false);
            isFetching.current = false;
        }
    };

    const handleNewCalculationComplete = async (calculation: Calculation) => {
        try {
            setLoading(true);
            setError(null);
            if (editingCalculation) {
                const updated = await calculationsService.updateCalculation(calculation.id, calculation);
                setCalculations(prev => prev.map(c => c.id === updated.id ? updated : c));
                setEditingCalculation(null);
                setSelectedCalculation(updated);
                toast.success('Расчет успешно обновлен');
            } else {
                const created = await calculationsService.createCalculation(calculation);
                setCalculations([created, ...calculations]);
                setSelectedCalculation(created);
                toast.success('Новый расчет успешно создан');
            }
            setIsCreatingNew(false);
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : String(err);
            setError('Ошибка при сохранении: ' + message);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateStatus = async (id: number | string, status: Calculation['status']) => {
        try {
            setError(null);
            const updated = await calculationsService.updateCalculation(id, { status });
            setCalculations(prev => prev.map(c => c.id === id ? updated : c));
            if (selectedCalculation?.id === id) {
                setSelectedCalculation(updated);
            }
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : String(err);
            toast.error('Ошибка при обновлении статуса: ' + message);
        }
    };

    const handleDeleteCalculation = async (id: number | string) => {
        try {
            setError(null);
            await calculationsService.deleteCalculation(id);
            setCalculations(prev => prev.filter(c => c.id !== id));
            setSelectedCalculation(null);
            toast.success('Расчет успешно удален');
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : String(err);
            toast.error('Ошибка при удалении: ' + message);
        }
    };

    const handleEditCalculation = (calc: Calculation) => {
        setEditingCalculation(calc);
        setIsCreatingNew(true);
        setSelectedCalculation(null);
    };

    if (isCreatingNew) {
        return (
            <div className="min-h-screen bg-background flex flex-col">
                <DashboardHeader sidebarOpen={false} setSidebarOpen={() => { }} title={editingCalculation ? "Редактировать расчет" : "Новый расчет"} />
                <main className="flex-1 overflow-auto">
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
                <DashboardHeader sidebarOpen={false} setSidebarOpen={() => { }} title="Детали расчета" />
                <main className="flex-1 overflow-auto">
                    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
                        <ClientCalculationDetails
                            calculation={selectedCalculation}
                            onBack={() => setSelectedCalculation(null)}
                            onUpdateStatus={handleUpdateStatus}
                            onDelete={handleDeleteCalculation}
                            onEdit={handleEditCalculation}
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
                    currentPage === 'profile' ? 'Профиль' :
                        currentPage === 'venue' ? 'Заведения' :
                            currentPage === 'inventory' ? 'Инвентарь' :
                                currentPage === 'chat' ? 'Чат с экспертом' :
                                    currentPage === 'overview' ? 'Обзор' : 'Мои расчеты'
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
                    <div className={currentPage === 'chat' ? 'w-full' : 'p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full'}>
                        {error && (
                            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-500 text-sm font-black uppercase tracking-widest">
                                {error}
                            </div>
                        )}

                        {loading && calculations.length === 0 ? (
                            <div className="flex items-center justify-center py-20">
                                <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                            </div>
                        ) : (
                            <>
                                {currentPage === 'overview' && (
                                    <ClientOverview
                                        calculations={calculations}
                                        venuesCount={venues.length}
                                        onNewCalculation={() => setIsCreatingNew(true)}
                                        onViewAllCalculations={() => setCurrentPage('calculations')}
                                        onNavigateToVenues={() => setCurrentPage('venue')}
                                        onSelectCalculation={setSelectedCalculation}
                                    />
                                )}
                                {currentPage === 'calculations' && (
                                    <ClientCalculationsList
                                        calculations={calculations}
                                        onSelect={setSelectedCalculation}
                                        onNewCalculation={() => setIsCreatingNew(true)}
                                    />
                                )}
                                {currentPage === 'venue' && (
                                    <VenuePage />
                                )}
                                {currentPage === 'profile' && (
                                    <ClientProfile />
                                )}
                                {currentPage === 'inventory' && (
                                    <InventoryManager
                                        calculations={calculations}
                                        venues={venues}
                                    />
                                )}
                                {currentPage === 'chat' && (
                                    <GlobalChatHub />
                                )}
                            </>
                        )}
                    </div>
                </main>
            </div>
        </div>
    );
};
