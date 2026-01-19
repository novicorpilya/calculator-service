import React from 'react';
import { Menu, X, LogOut, ShieldCheck } from 'lucide-react';
import { useAuth } from '@/features/auth';
import { useTheme } from '@/app/providers/useTheme';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '@/app/routes/routes.constants';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { NotificationCenter } from './NotificationCenter';

interface DashboardHeaderProps {
    sidebarOpen: boolean;
    setSidebarOpen: (open: boolean) => void;
    title?: string;
}

/**
 * DashboardHeader provides the main navigation and action bar for the dashboard.
 * Optimized with React.memo to prevent re-renders when sidebar state changes on narrow screens.
 */
export const DashboardHeader = React.memo<DashboardHeaderProps>(
    ({ sidebarOpen, setSidebarOpen, title = 'Кабинет клиента' }) => {
        const { logout } = useAuth();
        const { theme } = useTheme();
        const navigate = useNavigate();

        const handleLogout = async () => {
            await logout();
            navigate(ROUTES.AUTH.LOGIN);
        };

        return (
            <header className="header bg-background/80 backdrop-blur-2xl border-b border-border-theme sticky top-0 z-40 transition-all duration-300">
                <div className="fluid-container py-3 sm:py-4 flex items-center justify-between gap-3 sm:gap-4">
                    <div className="flex items-center gap-3 sm:gap-6 overflow-hidden">
                        <button
                            onClick={() => setSidebarOpen(!sidebarOpen)}
                            className="p-2 sm:p-3 bg-card border border-border-theme hover:border-primary rounded-xl lg:hidden transition-all active:scale-90"
                        >
                            {sidebarOpen ? (
                                <X className="w-5 h-5 text-foreground" />
                            ) : (
                                <Menu className="w-5 h-5 text-foreground" />
                            )}
                        </button>

                        <div
                            className="flex items-center gap-2 sm:gap-3 group cursor-pointer shrink-0"
                            onClick={() => navigate('/')}
                        >
                            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-white rounded-xl sm:rounded-[1.25rem] flex items-center justify-center transition-transform group-hover:scale-110 shadow-lg">
                                <ShieldCheck className="w-5 h-5 sm:w-6 sm:h-6 text-[#050506] stroke-[2.5]" />
                            </div>
                            <div className="block">
                                <span className="text-xl sm:text-2xl font-[1000] tracking-tighter italic uppercase leading-none block text-foreground">
                                    {theme.appName || 'HICS'}
                                </span>
                            </div>
                        </div>

                        {title && (
                            <div className="hidden lg:flex items-center gap-6">
                                <div className="h-6 w-px bg-border-theme" />
                                <h1 className="text-[10px] font-black text-foreground/40 uppercase tracking-[0.2em]">
                                    {title}
                                </h1>
                            </div>
                        )}
                    </div>

                    <div className="flex items-center gap-2 sm:gap-3">
                        <NotificationCenter />
                        <ThemeToggle />

                        <button
                            onClick={handleLogout}
                            className="group flex items-center gap-2 sm:gap-3 px-3 sm:px-6 py-2 sm:py-3 bg-card border border-border-theme rounded-xl sm:rounded-2xl hover:border-red-500 hover:text-red-600 text-[10px] sm:text-xs font-black uppercase tracking-widest transition-all active:scale-95 whitespace-nowrap"
                        >
                            <LogOut className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                            <span className="hidden md:inline">Выйти</span>
                        </button>
                    </div>
                </div>
            </header>
        );
    }
);
