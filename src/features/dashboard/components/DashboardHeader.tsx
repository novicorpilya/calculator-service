import React from 'react';
import { Menu, X, LogOut } from 'lucide-react';
import { useAuth } from '@/features/auth';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '@/app/routes/routes.constants';

interface DashboardHeaderProps {
    sidebarOpen: boolean;
    setSidebarOpen: (open: boolean) => void;
    title?: string;
}

export const DashboardHeader: React.FC<DashboardHeaderProps> = ({ sidebarOpen, setSidebarOpen, title = 'Кабинет клиента' }) => {
    const { logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = async () => {
        await logout();
        navigate(ROUTES.AUTH.LOGIN);
    }

    return (
        <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
            <div className="px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => setSidebarOpen(!sidebarOpen)}
                        className="p-2 hover:bg-gray-100 rounded-xl lg:hidden transition-colors"
                    >
                        {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                    </button>
                    <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                        <div className="w-4 h-4 bg-white rounded-sm rotate-45" />
                    </div>
                    <span className="text-xl font-black tracking-tight text-gray-900">HICS</span>
                    {title && (
                        <>
                            <div className="h-6 w-px bg-gray-200 mx-2 hidden md:block"></div>
                            <h1 className="text-sm font-bold text-gray-500 hidden md:block uppercase tracking-wider">{title}</h1>
                        </>
                    )}
                </div>
                <button
                    onClick={handleLogout}
                    className="flex items-center gap-2 px-4 py-2 text-red-600 border border-red-200 rounded-xl hover:bg-red-50 text-sm font-bold transition-colors"
                >
                    <LogOut className="w-4 h-4" />
                    <span className="hidden sm:inline">Выйти</span>
                </button>
            </div>
        </header>
    );
}
