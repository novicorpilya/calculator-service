import React from 'react';
import { 
    History, 
    Filter, 
    ChevronLeft, 
    ChevronRight, 
    Eye, 
    User as UserIcon,
    ShieldAlert,
    Code,
    Terminal
} from 'lucide-react';
import type { AuditLog } from '@/services/audit.service';
import type { User } from '@/features/auth/auth.types';

interface AdminLogsTableProps {
    logs: AuditLog[];
    totalCount: number;
    currentPage: number;
    pageSize: number;
    onPageChange: (page: number) => void;
    actionFilter: string;
    onActionFilterChange: (value: string) => void;
    userIdFilter: string;
    onUserIdFilterChange: (value: string) => void;
    users: User[];
}

export const AdminLogsTable: React.FC<AdminLogsTableProps> = ({ 
    logs, 
    totalCount, 
    currentPage, 
    pageSize, 
    onPageChange,
    actionFilter,
    onActionFilterChange,
    userIdFilter,
    onUserIdFilterChange,
    users
}) => {
    const [expandedLogId, setExpandedLogId] = React.useState<string | null>(null);
    const totalPages = Math.ceil(totalCount / pageSize);

    const formatAction = (action: string) => {
        return action
            .replace(/_/g, ' ')
            .replace(/\b\w/g, l => l.toUpperCase());
    };

    const toggleExpand = (id: string) => {
        setExpandedLogId(expandedLogId === id ? null : id);
    };

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20 relative">
             {/* Header Section */}
             <div className="flex flex-col gap-6">
                <div className="flex flex-wrap items-end justify-between gap-4">
                    <div>
                        <h2 className="text-2xl font-black tracking-tight flex items-center gap-3">
                           <div className="p-3 bg-primary/10 rounded-2xl text-primary">
                                <ShieldAlert size={24} />
                           </div>
                           Аудит Безопасности
                        </h2>
                        <p className="text-muted-foreground mt-1 text-sm font-medium ml-1">
                            Логи действий и изменения в системе
                        </p>
                    </div>

                     <div className="flex items-center gap-3 bg-card border border-border-theme px-4 py-2 rounded-2xl shadow-sm">
                        <div className="flex flex-col mr-2">
                             <span className="text-[10px] font-black uppercase tracking-widest opacity-40">Всего записей</span>
                             <span className="text-lg font-black leading-none">{totalCount}</span>
                        </div>
                    </div>
                </div>

                {/* Filters */}
                <div className="flex flex-wrap items-center gap-4">
                    <div className="flex items-center gap-2 bg-card border border-border-theme rounded-xl px-4 py-3 flex-1 min-w-[250px] shadow-sm focus-within:ring-2 ring-primary/20 transition-all">
                        <Filter size={16} className="text-muted-foreground/40" />
                        <select
                            className="w-full bg-transparent text-xs font-bold uppercase tracking-widest outline-none cursor-pointer text-muted-foreground"
                            value={actionFilter}
                            onChange={(e) => onActionFilterChange(e.target.value)}
                        >
                            <option value="all">Все действия</option>
                            <option value="login">Вход в систему</option>
                            <option value="invitation_created">Создание приглашения</option>
                            <option value="invitation_deleted">Удаление приглашения</option>
                            <option value="role_updated">Смена роли</option>
                            <option value="user_blocked">Блокировка пользователя</option>
                            <option value="user_unblocked">Разблокировка пользователя</option>
                            <option value="user_deleted_permanently">Удаление пользователя</option>
                            <option value="calculation_status_force_updated">Смена статуса (Админ)</option>
                            <option value="calculation_manager_assigned">Назначение менеджера</option>
                            <option value="calculation_deleted_by_admin">Удаление проекта</option>
                            <option value="calculations_bulk_deleted">Массовое удаление</option>
                            <option value="calculations_bulk_status_update">Массовая смена статуса</option>
                            <option value="inventory_item_created">Создание товара</option>
                            <option value="inventory_item_updated">Обновление товара</option>
                            <option value="inventory_item_deleted">Удаление товара</option>
                        </select>
                    </div>

                    <div className="flex items-center gap-2 bg-card border border-border-theme rounded-xl px-4 py-3 flex-1 min-w-[250px] shadow-sm focus-within:ring-2 ring-primary/20 transition-all">
                        <UserIcon size={16} className="text-muted-foreground/40" />
                        <select
                            className="w-full bg-transparent text-xs font-bold uppercase tracking-widest outline-none cursor-pointer text-muted-foreground"
                            value={userIdFilter}
                            onChange={(e) => onUserIdFilterChange(e.target.value)}
                        >
                            <option value="all">Все пользователи</option>
                            {users.map(u => (
                                <option key={u.id} value={u.id}>{u.email} ({u.role})</option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            <div className="space-y-4">
                {logs.length === 0 ? (
                    <div className="py-24 flex flex-col items-center justify-center text-center opacity-40 border-2 border-dashed border-border-theme rounded-[3rem]">
                        <History size={64} className="mb-6 text-muted-foreground" />
                        <p className="text-lg font-bold">Записей не найдено</p>
                        <p className="text-sm">Попробуйте изменить параметры фильтрации</p>
                    </div>
                ) : (
                    logs.map((log) => (
                        <div key={log.id} className="group animate-in fade-in slide-in-from-bottom-2 duration-300">
                             <div
                                onClick={() => toggleExpand(log.id)}
                                className={`relative bg-card hover:bg-card/80 border border-border-theme rounded-[20px] p-5 cursor-pointer transition-all duration-300 hover:shadow-lg hover:shadow-black/5 hover:border-primary/30 flex flex-col md:flex-row md:items-center gap-6 overflow-hidden ${
                                    expandedLogId === log.id ? 'ring-2 ring-primary border-primary bg-primary/5' : ''
                                }`}
                            >
                                {/* Active Indicator Bar */}
                                {expandedLogId === log.id && (
                                     <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-primary" />
                                )}

                                <div className="flex items-center gap-4 min-w-0 flex-1">
                                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all shrink-0 ${
                                        expandedLogId === log.id 
                                            ? 'bg-primary text-white shadow-lg shadow-primary/30' 
                                            : 'bg-muted/50 text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary'
                                    }`}>
                                        <Code size={20} />
                                    </div>
                                    <div className="min-w-0 space-y-1">
                                         <div className="flex flex-wrap items-center gap-2">
                                            <span className="text-sm font-black uppercase tracking-tight text-foreground truncate">
                                                {formatAction(log.action)}
                                            </span>
                                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-muted text-muted-foreground uppercase tracking-wider">
                                                {log.entity_type}
                                            </span>
                                         </div>
                                         <div className="flex items-center gap-2 text-xs text-muted-foreground font-medium">
                                            <span className="flex items-center gap-1.5 text-primary">
                                                <Terminal size={12} />
                                                <span className="font-mono">{log.profiles?.email || 'System'}</span>
                                            </span>
                                            <span>•</span>
                                            <span className="font-mono opacity-70">
                                                 {new Date(log.created_at).toLocaleString('ru-RU', { 
                                                     year: 'numeric', 
                                                     month: 'short', 
                                                     day: 'numeric', 
                                                     hour: '2-digit', 
                                                     minute: '2-digit',
                                                     second: '2-digit'
                                                 })}
                                            </span>
                                         </div>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between md:justify-end gap-4 md:min-w-[200px]">
                                     <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-muted/30 border border-white/5">
                                        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">ID:</span>
                                        <span className="text-[10px] font-mono text-foreground/70">
                                            {log.entity_id ? log.entity_id.split('-')[0] : '—'}
                                        </span>
                                    </div>
                                    <Eye size={20} className={`text-muted-foreground/30 transition-all duration-300 ${
                                        expandedLogId === log.id ? 'text-primary rotate-180 scale-110' : 'group-hover:text-primary group-hover:scale-110'
                                    }`} />
                                </div>
                            </div>

                            {/* Expanded Details - Code Block Style */}
                            {expandedLogId === log.id && (
                                <div className="mt-2 ml-4 mr-4 md:ml-16 rounded-[20px] bg-[#1e1e1e] border border-white/10 p-6 shadow-2xl overflow-hidden relative animate-in zoom-in-95 duration-300">
                                     <div className="absolute top-4 right-4 text-[10px] font-mono text-white/20 uppercase tracking-widest">
                                        JSON Payload
                                     </div>
                                     <pre className="font-mono text-xs leading-relaxed text-blue-100/90 overflow-x-auto custom-scrollbar">
                                        {JSON.stringify(log.details || {}, null, 2)}
                                     </pre>
                                     <div className="mt-4 pt-4 border-t border-white/10 flex items-center justify-between text-[10px] text-white/30 font-mono">
                                        <span>User ID: {log.user_id}</span>
                                        <span>Log ID: {log.id}</span>
                                     </div>
                                </div>
                            )}
                        </div>
                    ))
                )}
            </div>

            {/* Pagination Floating Bar */}
            {totalPages > 1 && (
                <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-foreground/90 py-2.5 px-4 rounded-full shadow-2xl backdrop-blur-md flex items-center gap-4 border border-white/10 text-background">
                    <button
                        onClick={() => onPageChange(Math.max(1, currentPage - 1))}
                        disabled={currentPage === 1}
                        className="p-1.5 hover:bg-white/20 rounded-full disabled:opacity-30 transition-all"
                    >
                        <ChevronLeft size={16} />
                    </button>
                    <span className="text-xs font-black uppercase tracking-widest">
                        {currentPage} / {totalPages}
                    </span>
                    <button
                        onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
                        disabled={currentPage === totalPages}
                        className="p-1.5 hover:bg-white/20 rounded-full disabled:opacity-30 transition-all"
                    >
                        <ChevronRight size={16} />
                    </button>
                </div>
            )}
        </div>
    );
};
