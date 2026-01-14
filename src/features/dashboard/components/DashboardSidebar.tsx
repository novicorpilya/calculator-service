import React from 'react';

import {
    LayoutDashboard,
    ShieldCheck,
    X,
    History as HistoryIcon,
    Users,
    FolderSearch,
    Library,
    Calculator,
    ClipboardList,
    Building2,
    Shield,
    MessageSquare,
} from 'lucide-react';
import { useAuth } from '@/features/auth/hooks/useAuth';

import { useUnreadCount } from '@/features/chat/hooks';

interface DashboardSidebarProps {
    isOpen: boolean;
    currentPage: string;
    onNavigate: (page: string) => void;
}

/**
 * Sidebar navigation component with role-based menu items.
 * Optimized with React.memo and useMemo for performance.
 */
export const DashboardSidebar = React.memo<DashboardSidebarProps>(
    ({ isOpen, currentPage, onNavigate }) => {
        const { user } = useAuth();

        const { directUnread, projectUnread } = useUnreadCount(user?.id);

        const menuItems = React.useMemo(() => {
            const role = user?.role;

            if (role === 'admin') {
                return [
                    { id: 'admin-overview', label: 'Админ-панель', icon: Shield },
                    {
                        id: 'projects',
                        label: 'Все проекты',
                        icon: FolderSearch,
                        badge: projectUnread,
                    },
                    { id: 'team', label: 'Команда', icon: Users },
                    { id: 'history', label: 'Логи аудита', icon: HistoryIcon },
                ];
            }

            if (role === 'manager') {
                return [
                    { id: 'overview', label: 'Аналитика', icon: LayoutDashboard },
                    { id: 'pipeline', label: 'Проекты', icon: FolderSearch, badge: projectUnread },
                    { id: 'chat', label: 'Сообщения', icon: MessageSquare, badge: directUnread },
                    { id: 'kb', label: 'Реестр товаров', icon: Library },
                ];
            }

            // По умолчанию для 'client'
            return [
                { id: 'overview', label: 'Обзор', icon: LayoutDashboard },
                {
                    id: 'calculations',
                    label: 'Мои расчеты',
                    icon: Calculator,
                    badge: projectUnread,
                },
                { id: 'chat', label: 'Сообщения', icon: MessageSquare, badge: directUnread },
                { id: 'inventory', label: 'Инвентарь', icon: ClipboardList },
                { id: 'venue', label: 'Заведение', icon: Building2 },
            ];
        }, [user?.role, projectUnread, directUnread]);

        const isProfileActive = currentPage === 'profile';

        return (
            <div
                className={`
            fixed inset-0 z-50 lg:relative lg:z-auto transition-all duration-500
            ${isOpen ? 'visible' : 'invisible'} lg:visible lg:w-72
        `}
            >
                <div
                    className={`absolute inset-0 bg-background/80 backdrop-blur-sm lg:hidden transition-opacity duration-500 ${isOpen ? 'opacity-100' : 'opacity-0'}`}
                    onClick={() => onNavigate(currentPage)}
                />

                <aside
                    className={`
                fixed lg:sticky top-0 left-0 w-[min(85vw,320px)] lg:w-72 bg-card border-r border-border-theme transition-all duration-500 z-10 h-[100dvh] lg:h-full
                ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
            `}
                >
                    <div className="h-full flex flex-col p-4 sm:p-6 overflow-y-auto custom-scrollbar">
                        {/* Mobile Header in Sidebar */}
                        <div className="flex items-center justify-between mb-8 lg:hidden">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-primary/10 rounded-[1.25rem] flex items-center justify-center">
                                    <ShieldCheck className="w-6 h-6 text-primary" />
                                </div>
                                <div>
                                    <span className="text-xl font-black tracking-tighter uppercase leading-none block">
                                        Hics
                                    </span>
                                </div>
                            </div>
                            <button
                                onClick={() => onNavigate(currentPage)}
                                className="p-3 bg-card border border-border-theme rounded-xl transition-all active:scale-90"
                            >
                                <X className="w-5 h-5 text-foreground" />
                            </button>
                        </div>

                        {/* Elevated Profile Header */}
                        <button
                            onClick={() => onNavigate('profile')}
                            className={`
                            group flex items-center gap-4 p-4 rounded-3xl border transition-all mb-8 text-left
                            ${
                                isProfileActive
                                    ? 'bg-primary border-primary shadow-xl shadow-primary/20'
                                    : 'bg-background hover:bg-primary/5 border-border-theme hover:border-primary/30'
                            }
                        `}
                        >
                            <div
                                className={`
                            w-12 h-12 rounded-2xl flex items-center justify-center font-black shrink-0 transition-colors
                            ${isProfileActive ? 'bg-white text-primary' : 'bg-primary/10 text-primary'}
                        `}
                            >
                                {user?.role !== 'client' && user?.firstName
                                    ? user.firstName[0]
                                    : user?.organizationName?.[0] || 'U'}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p
                                    className={`text-[10px] font-black uppercase tracking-widest truncate ${isProfileActive ? 'text-white' : 'text-foreground'}`}
                                >
                                    {user?.role !== 'client' && (user?.firstName || user?.lastName)
                                        ? `${user.firstName || ''} ${user.lastName || ''}`.trim()
                                        : user?.organizationName || 'Пользователь'}
                                </p>
                                <p
                                    className={`text-[9px] font-bold uppercase tracking-widest truncate ${isProfileActive ? 'text-white/60' : 'text-foreground/30'}`}
                                >
                                    {user?.email}
                                </p>
                            </div>
                        </button>

                        <nav className="flex-1 space-y-3">
                            {menuItems.map((item) => {
                                const Icon = item.icon;
                                const isActive = currentPage === item.id;
                                const badgeCount = item.badge || 0;
                                return (
                                    <button
                                        key={item.id}
                                        onClick={() => onNavigate(item.id)}
                                        className={`
                                        w-full flex items-center gap-4 px-6 py-4 rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] transition-all group
                                        ${
                                            isActive
                                                ? 'bg-primary text-white shadow-xl shadow-primary/20'
                                                : 'text-foreground/50 hover:bg-primary/5 hover:text-primary'
                                        }
                                    `}
                                    >
                                        <div className="relative">
                                            <Icon
                                                className={`w-5 h-5 transition-transform group-hover:scale-110 ${isActive ? 'text-white' : ''}`}
                                            />
                                            {badgeCount > 0 && (
                                                <span
                                                    className={`absolute -top-2.5 -right-2.5 flex items-center justify-center min-w-[18px] h-[18px] px-1 bg-red-500 text-white text-[9px] font-black rounded-full border-2 border-card animate-in zoom-in group-hover:scale-110 transition-transform ${isActive ? 'border-primary' : ''}`}
                                                >
                                                    {badgeCount > 99 ? '99+' : badgeCount}
                                                </span>
                                            )}
                                        </div>
                                        {isActive && (
                                            <div className="absolute right-4 w-1.5 h-1.5 rounded-full bg-white animate-pulse lg:hidden" />
                                        )}
                                        {item.label}
                                    </button>
                                );
                            })}
                        </nav>
                    </div>
                </aside>
            </div>
        );
    }
);
