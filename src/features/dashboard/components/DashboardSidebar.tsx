import React from 'react';
import { Home, Settings } from 'lucide-react';

interface DashboardSidebarProps {
    isOpen: boolean;
    currentPage: string;
    onNavigate: (page: string) => void;
}

export const DashboardSidebar: React.FC<DashboardSidebarProps> = ({ isOpen, currentPage, onNavigate }) => {
    const menuItems = [
        { id: 'calculations', label: 'Мои расчеты', icon: Home },
        { id: 'profile', label: 'Профиль', icon: Settings }
    ];

    return (
        <aside
            className={`${isOpen ? 'w-64 opacity-100' : 'w-0 opacity-0 lg:w-64 lg:opacity-100'} bg-white border-r border-gray-200 transition-all duration-300 ease-in-out overflow-hidden flex-shrink-0`}
        >
            <div className="p-6 w-64">
                <div className="mb-8 px-4">
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Меню</p>
                </div>
                <nav className="space-y-2">
                    {menuItems.map(item => (
                        <button
                            key={item.id}
                            onClick={() => onNavigate(item.id)}
                            className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all text-sm font-bold ${currentPage === item.id
                                ? 'bg-blue-50 text-blue-600 shadow-sm ring-1 ring-blue-100'
                                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                                }`}
                        >
                            <item.icon className="w-5 h-5" strokeWidth={currentPage === item.id ? 2.5 : 2} />
                            {item.label}
                        </button>
                    ))}
                </nav>

                <div className="mt-auto pt-8 border-t border-gray-100 absolute bottom-6 w-[208px]">
                    {/* Footer content if needed */}
                </div>
            </div>
        </aside>
    );
};
