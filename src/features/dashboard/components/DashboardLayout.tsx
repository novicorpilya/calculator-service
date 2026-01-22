import React, { useState } from 'react';
import { Outlet, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { DashboardHeader } from './DashboardHeader';
import { DashboardSidebar } from './DashboardSidebar';
import { ErrorBoundary } from '@/core/components/ErrorBoundary';

interface DashboardLayoutProps {
    role: 'client' | 'manager' | 'admin';
}

/**
 * Common Layout for all Dashboard pages.
 * Keeps Sidebar and Header mounted during navigation between sub-routes.
 */
export const DashboardLayout: React.FC<DashboardLayoutProps> = ({ role }) => {
    const [sidebarOpen, setSidebarOpen] = useState(window.innerWidth >= 1024);
    const location = useLocation();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();

    // Determine current page ID for sidebar highlighting
    const currentPage = React.useMemo(() => {
        if (location.pathname.includes('budget-planner')) return 'budget-planner';
        if (location.pathname.includes('profile')) return 'profile';
        return searchParams.get('page') || 'overview';
    }, [location.pathname, searchParams]);

    const handleNavigate = (page: string) => {
        if (page === 'budget-planner') {
            navigate('/dashboard/client/budget-planner');
        } else if (page === 'overview' && role === 'client') {
            navigate('/dashboard/client');
        } else {
            // Standard tab switching via query params for the main dashboard
            const baseUrl =
                role === 'client'
                    ? '/dashboard/client'
                    : role === 'manager'
                      ? '/dashboard/manager'
                      : '/dashboard/admin';
            navigate(`${baseUrl}?page=${page}`);
        }

        if (window.innerWidth < 1024) {
            setSidebarOpen(false);
        }
    };

    const getTitle = () => {
        if (location.pathname.includes('budget-planner')) return 'Планировщик бюджета';

        const page = searchParams.get('page') || 'overview';
        switch (page) {
            case 'profile':
                return 'Профиль';
            case 'venue':
                return 'Заведения';
            case 'chat':
                return 'Чат';
            case 'analytics':
                return 'Аналитика';
            case 'calculations':
                return 'Мои расчеты';
            default:
                return 'Личный кабинет';
        }
    };

    return (
        <div className="min-h-screen bg-background flex flex-col">
            {/* Skip Link for Keyboard Users - Critical for WCAG 2.1 */}
            <a
                href="#main-content"
                className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[100] focus:px-6 focus:py-3 focus:bg-primary focus:text-white focus:rounded-xl focus:font-black focus:text-sm focus:uppercase focus:tracking-widest focus:shadow-2xl focus:outline-none"
            >
                Перейти к содержимому
            </a>

            <DashboardHeader
                sidebarOpen={sidebarOpen}
                setSidebarOpen={setSidebarOpen}
                title={getTitle()}
            />

            <div className="flex flex-1 overflow-hidden">
                <DashboardSidebar
                    isOpen={sidebarOpen}
                    currentPage={currentPage}
                    onNavigate={handleNavigate}
                    onClose={() => setSidebarOpen(false)}
                />

                <main
                    id="main-content"
                    className="flex-1 overflow-auto bg-background/30"
                    role="main"
                    aria-label="Основное содержимое"
                    tabIndex={-1}
                >
                    {/* Live region for dynamic content announcements */}
                    <div
                        aria-live="polite"
                        aria-atomic="true"
                        className="sr-only"
                        id="page-announcer"
                    />

                    <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
                        <ErrorBoundary>
                            <Outlet />
                        </ErrorBoundary>
                    </div>
                </main>
            </div>
        </div>
    );
};
