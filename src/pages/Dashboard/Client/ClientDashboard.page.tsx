import React, { useState } from 'react';
import { DashboardHeader } from '@/features/dashboard/components/DashboardHeader';
import { DashboardSidebar } from '@/features/dashboard/components/DashboardSidebar';
import { ClientCalculationsList } from '@/features/dashboard/client/components/ClientCalculationsList';
import { ClientCalculationDetails } from '@/features/dashboard/client/components/ClientCalculationDetails';
import { NewCalculationWizard } from '@/features/dashboard/client/components/NewCalculationWizard';
import { ClientProfile } from '@/features/dashboard/client/components/ClientProfile';
import type { Calculation } from '@/features/dashboard/dashboard.types';

const INITIAL_CALCULATIONS: Calculation[] = [
    {
        id: 1,
        organizationName: 'Мр Сити',
        status: 'approved',
        zones: ['Кухня', 'Зал', 'Бар'],
        type: 'restaurant',
        totalArea: 150,
        zonesCount: 3,
        createdDate: '25 дек 2024',
        manager: 'Иван Петров',
        comments: [
            { author: 'Иван Петров', text: 'Расчет выполнен верно, все соответствует стандартам', date: '25 дек' }
        ],
        unreadComments: 0,
        results: {
            byZone: [], // Mock results for init
            summary: [
                { inventory: 'Швабры', color: '#ef4444', quantity: 5, price: 500, total: 5 },
                { inventory: 'Ведра', color: '#3b82f6', quantity: 3, price: 280, total: 3 }
            ]
        }
    },
    {
        id: 2,
        organizationName: 'Кофейня Аромат',
        status: 'sent',
        zones: ['Зал', 'Санузел'],
        type: 'cafe',
        totalArea: 85,
        zonesCount: 2,
        createdDate: '22 дек 2024',
        manager: 'Мария Сидорова',
        comments: [],
        unreadComments: 1,
        results: {
            byZone: [],
            summary: []
        }
    }
];

export const ClientDashboard: React.FC = () => {
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [currentPage, setCurrentPage] = useState('calculations');
    const [calculations, setCalculations] = useState<Calculation[]>(INITIAL_CALCULATIONS);
    const [selectedCalculation, setSelectedCalculation] = useState<Calculation | null>(null);
    const [isCreatingNew, setIsCreatingNew] = useState(false);

    const handleNewCalculationComplete = (newCalc: Calculation) => {
        setCalculations([newCalc, ...calculations]);
        setIsCreatingNew(false);
    };

    // Full screen views (No Sidebar)

    if (selectedCalculation) {
        return (
            <div className="min-h-screen bg-gray-50 flex flex-col">
                <DashboardHeader sidebarOpen={false} setSidebarOpen={() => { }} title="Детали расчета" />
                <main className="flex-1 overflow-auto">
                    <div className="p-6 lg:p-8 max-w-7xl mx-auto w-full">
                        <ClientCalculationDetails
                            calculation={selectedCalculation}
                            onBack={() => setSelectedCalculation(null)}
                        />
                    </div>
                </main>
            </div>
        );
    }

    if (isCreatingNew) {
        return (
            <div className="min-h-screen bg-gray-50 flex flex-col">
                <DashboardHeader sidebarOpen={false} setSidebarOpen={() => { }} title="Новый расчет" />
                <main className="flex-1 overflow-auto">
                    <div className="p-6 lg:p-8">
                        <NewCalculationWizard
                            onCancel={() => setIsCreatingNew(false)}
                            onComplete={handleNewCalculationComplete}
                        />
                    </div>
                </main>
            </div>
        );
    }

    // Dashboard Views (With Sidebar)

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            <DashboardHeader
                sidebarOpen={sidebarOpen}
                setSidebarOpen={setSidebarOpen}
                title={currentPage === 'profile' ? 'Профиль' : 'Мои расчеты'}
            />

            <div className="flex flex-1 overflow-hidden">
                <DashboardSidebar
                    isOpen={sidebarOpen}
                    currentPage={currentPage}
                    onNavigate={(page) => {
                        setCurrentPage(page);
                        // Optional: close sidebar on mobile on navigate
                        if (window.innerWidth < 1024) setSidebarOpen(false);
                    }}
                />

                <main className="flex-1 overflow-auto bg-gray-50">
                    <div className="p-6 lg:p-8 max-w-7xl mx-auto w-full">
                        {currentPage === 'calculations' && (
                            <ClientCalculationsList
                                calculations={calculations}
                                onSelect={setSelectedCalculation}
                                onNewCalculation={() => setIsCreatingNew(true)}
                            />
                        )}
                        {currentPage === 'profile' && (
                            <ClientProfile />
                        )}
                    </div>
                </main>
            </div>
        </div>
    );
};
