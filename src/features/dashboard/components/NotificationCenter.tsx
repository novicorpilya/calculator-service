import React, { useState, useEffect, useCallback } from 'react';
import { Bell, Check, Info, AlertTriangle, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useServices } from '@/app/di/ServiceContainer';
import { type Notification } from '@/features/dashboard/services/notification.service';
import { toast } from 'sonner';
import { useAuth } from '@/features/auth';

export const NotificationCenter: React.FC = () => {
    const { user } = useAuth();
    const { notificationService, chatService } = useServices();
    const navigate = useNavigate();
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [isOpen, setIsOpen] = useState(false);

    const unreadCount = notifications.filter(n => !n.is_read).length;

    const loadNotifications = useCallback(async () => {
        const res = await notificationService.getNotifications();
        if (res.success) {
            setNotifications(res.data || []);
        }
    }, [notificationService]);

    useEffect(() => {
        // Initial load wrapped in async IIFE
        (async () => {
            await loadNotifications();
        })();
        
        if (!user?.id) return;

        // 1. Быстрая подписка через широковещательный канал проектов
        const unsubscribeProjects = chatService.subscribeToProjects(() => {
            loadNotifications();
        });

        // 2. Нативная подписка на таблицу уведомлений
        const unsubscribeNotifications = notificationService.subscribe(user.id, (payload: { eventType: string; new: Notification; old: Notification }) => {
            const { eventType, new: newNotif, old: oldNotif } = payload;
            
            if (eventType === 'DELETE') {
                setNotifications(prev => prev.filter(n => n.id !== oldNotif.id));
            } else {
                setNotifications(prev => {
                    const exists = prev.find(n => n.id === newNotif.id);
                    if (exists) return prev.map(n => n.id === newNotif.id ? newNotif : n);
                    return [newNotif, ...prev];
                });
            }
        });

        // 3. Запасной поллинг раз в 10 секунд
        const interval = setInterval(loadNotifications, 10000);

        return () => {
            unsubscribeProjects();
            unsubscribeNotifications();
            clearInterval(interval);
        };
    }, [user?.id, chatService, notificationService, loadNotifications]);

    const handleMarkAsRead = async (id: string) => {
        const res = await notificationService.markAsRead(id);
        if (res.success) {
            setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
        } else {
            toast.error('Не удалось отметить как прочитанное');
        }
    };

    const handleDelete = async (id: string) => {
        const res = await notificationService.deleteNotification(id);
        if (res.success) {
            setNotifications(prev => prev.filter(n => n.id !== id));
        } else {
            toast.error('Не удалось удалить уведомление. Проверьте права доступа.');
        }
    };

    const onNotificationClick = async (n: Notification) => {
        if (!n.is_read) {
            handleMarkAsRead(n.id);
        }
        
        if (n.link) {
            navigate(n.link);
            setIsOpen(false);
        }
    };

    const handleMarkAllAsRead = async () => {
        setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));

        const res = await notificationService.markAllAsRead();
        if (res.success) {
            if (user?.id) {
                await chatService.markAllAsRead(user.id);
            }
            toast.success('Все уведомления прочитаны');
        } else {
            toast.error('Ошибка при обновлении статуса уведомлений');
            loadNotifications(); // Rollback UI
        }
    };

    const handleClearAll = async () => {
        if (!confirm('Очистить все уведомления?')) return;
        
        const res = await notificationService.clearAll();
        if (res.success) {
            setNotifications([]);
            toast.success('Список уведомлений очищен');
        } else {
            toast.error('Не удалось очистить уведомления. Ошибка доступа.');
        }
    };

    return (
        <div className="relative">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`p-3 rounded-xl transition-all relative ${isOpen ? 'bg-primary text-white shadow-lg' : 'bg-card border border-border-theme hover:border-primary/40 text-foreground/60 hover:text-primary'}`}
            >
                <Bell size={18} />
                {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-[9px] font-black rounded-full flex items-center justify-center border-2 border-background animate-pulse">
                        {unreadCount}
                    </span>
                )}
            </button>

            {isOpen && (
                <>
                    <div 
                        className="fixed inset-0 z-40" 
                        onClick={() => setIsOpen(false)} 
                    />
                    <div className="absolute right-0 mt-4 w-[400px] bg-card border border-border-theme rounded-[2.5rem] shadow-3xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-4 duration-500">
                        <div className="p-6 border-b border-border-theme flex items-center justify-between bg-foreground/[0.02]">
                            <h3 className="text-xs font-black uppercase tracking-widest">Уведомления</h3>
                            <div className="flex gap-4">
                                {unreadCount > 0 && (
                                    <button 
                                        onClick={handleMarkAllAsRead}
                                        className="text-[9px] font-black uppercase text-primary hover:opacity-80 transition-opacity"
                                    >
                                        Прочитать все
                                    </button>
                                )}
                                {notifications.length > 0 && (
                                    <button 
                                        onClick={handleClearAll}
                                        className="text-[9px] font-black uppercase text-foreground/40 hover:text-red-500 transition-colors"
                                    >
                                        Очистить список
                                    </button>
                                )}
                            </div>
                        </div>

                        <div className="max-h-[450px] overflow-y-auto custom-scrollbar">
                            {notifications.length > 0 ? (
                                notifications.map(n => (
                                    <div 
                                        key={n.id} 
                                        onClick={() => onNotificationClick(n)}
                                        className={`p-6 border-b border-border-theme/40 transition-all flex gap-4 cursor-pointer group hover:bg-primary/[0.03] ${n.is_read ? 'opacity-60' : 'bg-primary/[0.02]'}`}
                                    >
                                        <div className={`w-10 h-10 rounded-xl shrink-0 flex items-center justify-center transition-transform group-hover:scale-110 ${
                                            n.type === 'alert' ? 'bg-red-500/10 text-red-500' :
                                            n.type === 'success' ? 'bg-emerald-500/10 text-emerald-500' :
                                            'bg-blue-500/10 text-blue-500'
                                        }`}>
                                            {n.type === 'alert' ? <AlertTriangle size={18} /> : <Info size={18} />}
                                        </div>
                                        <div className="flex-1 space-y-1">
                                            <div className="flex items-center justify-between">
                                                <p className="text-[11px] font-black uppercase tracking-tight group-hover:text-primary transition-colors">{n.title}</p>
                                                <div className="flex gap-1">
                                                    {!n.is_read && (
                                                        <button 
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleMarkAsRead(n.id);
                                                            }}
                                                            className="p-1 hover:bg-primary/10 rounded-lg text-primary transition-colors relative z-10"
                                                            title="Прочитать"
                                                        >
                                                            <Check size={14} />
                                                        </button>
                                                    )}
                                                    <button 
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleDelete(n.id);
                                                        }}
                                                        className="p-1 hover:bg-red-500/10 rounded-lg text-foreground/20 hover:text-red-500 transition-colors relative z-10"
                                                        title="Удалить"
                                                    >
                                                        <Trash2 size={14} />
                                                    </button>
                                                </div>
                                            </div>
                                            <p className="text-[12px] font-medium leading-relaxed text-foreground/70">{n.message}</p>
                                            <p className="text-[9px] font-bold text-foreground/20 uppercase mt-2">
                                                {new Date(n.created_at).toLocaleString()}
                                            </p>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="py-20 text-center opacity-20">
                                    <Bell size={40} className="mx-auto mb-4" />
                                    <p className="text-[10px] font-black uppercase tracking-widest">Нет новых уведомлений</p>
                                </div>
                            )}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};
