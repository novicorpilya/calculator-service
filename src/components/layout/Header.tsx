import React from 'react';
import { LogOut, User } from 'lucide-react';
import { useAuth } from '@/features/auth/index';
import { logger } from '@/core/logging/index';

export const Header: React.FC = () => {
    const { user, logout } = useAuth();

    const handleLogout = async () => {
        try {
            await logout();
        } catch (error) {
            logger.error('Logout failed', { error });
        }
    };

    return (
        <header className="header px-6 py-4 flex items-center justify-between bg-white border-b border-gray-200 shadow-sm">
            <h1 className="text-2xl font-bold text-gray-900">Calculator Service</h1>
            <div className="flex items-center gap-6">
                <nav className="flex gap-4">
                    <a href="#" className="text-gray-600 hover:text-gray-900 transition">
                        Home
                    </a>
                    <a href="#" className="text-gray-600 hover:text-gray-900 transition">
                        About
                    </a>
                </nav>

                {/* User info and logout */}
                <div className="flex items-center gap-4 pl-6 border-l border-gray-200">
                    <div className="flex items-center gap-2 text-gray-700">
                        <User className="w-5 h-5" />
                        <span className="text-sm font-medium">{user?.email || 'Пользователь'}</span>
                    </div>
                    <button
                        onClick={handleLogout}
                        className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-red-600 hover:text-white hover:bg-red-600 border border-red-600 rounded-lg transition-all duration-200"
                        title="Выйти из аккаунта"
                    >
                        <LogOut className="w-4 h-4" />
                        <span>Выйти</span>
                    </button>
                </div>
            </div>
        </header>
    );
};
