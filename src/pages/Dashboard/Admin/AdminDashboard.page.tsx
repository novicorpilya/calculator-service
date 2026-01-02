import React, { useState, useEffect, useCallback } from 'react';
import { DashboardHeader } from '@/features/dashboard/components/DashboardHeader';
import { DashboardSidebar } from '@/features/dashboard/components/DashboardSidebar';
import { adminService, type Invitation } from '@/services/admin.service';
import { auditService, type AuditLog } from '@/services/audit.service';
import { emailService } from '@/services/email.service';
import type { User } from '@/features/auth/auth.types';
import { toast } from 'sonner';
import { UserPlus, Users, Mail, Copy, Check, Trash2, User as UserIcon, History, Clock, ArrowRightLeft, RefreshCw } from 'lucide-react';

export const AdminDashboard: React.FC = () => {
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [currentPage, setCurrentPage] = useState('team');
    const [users, setUsers] = useState<User[]>([]);
    const [invitations, setInvitations] = useState<Invitation[]>([]);
    const [logs, setLogs] = useState<AuditLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [inviteEmail, setInviteEmail] = useState('');
    const [inviteRole, setInviteRole] = useState<'client' | 'manager' | 'admin'>('manager');
    const [copiedToken, setCopiedToken] = useState<string | null>(null);

    const loadData = useCallback(async () => {
        try {
            setLoading(true);
            const [usersData, invitesData, logsData] = await Promise.all([
                adminService.getUsers(),
                adminService.getInvitations(),
                auditService.getLogs()
            ]);
            setUsers(usersData);
            setInvitations(invitesData);
            setLogs(logsData);
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : String(err);
            console.error('Ошибка при загрузке данных:', message);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadData();

        // Middle+ Polling: Обновляем данные каждые 30 секунд для актуальности статусов
        const interval = setInterval(loadData, 30000);
        return () => clearInterval(interval);
    }, [loadData]);

    const handleCreateInvite = async (e: React.FormEvent) => {
        e.preventDefault();
        const promise = (async () => {
            const invite = await adminService.createInvitation(inviteEmail, inviteRole);
            const link = `${window.location.origin}/auth/register?invite=${invite.token}`;
            await emailService.sendInvitation(inviteEmail, inviteRole, link);
            setInviteEmail('');
            loadData();
            return { email: inviteEmail };
        })();

        toast.promise(promise, {
            loading: 'Генерация приглашения и отправка письма...',
            success: (data) => `Приглашение для ${data.email} успешно создано!`,
            error: 'Ошибка при создании приглашения'
        });
    };

    const handleUpdateRole = async (userId: string, currentRole: string) => {
        const roles: ('client' | 'manager' | 'admin')[] = ['client', 'manager', 'admin'];
        const currentRoleTyped = currentRole as 'client' | 'manager' | 'admin';
        const nextRole = roles[(roles.indexOf(currentRoleTyped) + 1) % roles.length];

        if (!confirm(`Изменить роль пользователя на ${nextRole}?`)) return;

        try {
            await adminService.updateUserRole(userId, nextRole);
            loadData();
        } catch (err) {
            alert('Ошибка при смене роли');
        }
    };

    const copyInviteLink = (token: string) => {
        const link = `${window.location.origin}/auth/register?invite=${token}`;
        navigator.clipboard.writeText(link);
        setCopiedToken(token);
        toast.success('Ссылка скопирована в буфер обмена');
        setTimeout(() => setCopiedToken(null), 2000);
    };

    const handleDeleteInvite = async (id: string) => {
        if (!confirm('Удалить это приглашение?')) return;
        try {
            await adminService.deleteInvitation(id);
            loadData();
        } catch (err) {
            alert('Ошибка удаления');
        }
    };

    const renderLogs = () => (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h3 className="text-xs font-black uppercase tracking-[0.3em] text-foreground/40 ml-2 flex items-center gap-2">
                <History size={14} /> История действий системы
            </h3>
            <div className="glass-card !p-0 overflow-hidden">
                <div className="divide-y divide-border-theme">
                    {logs.map(log => (
                        <div key={log.id} className="p-4 hover:bg-primary/5 transition-colors flex items-center justify-between gap-4">
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-xl bg-background border border-border-theme flex items-center justify-center text-foreground/40">
                                    <Clock size={18} />
                                </div>
                                <div>
                                    <p className="text-sm font-bold">
                                        <span className="text-primary">{log.profiles?.email}</span>
                                        <span className="text-foreground/60 mx-2">→</span>
                                        <span className="uppercase text-[10px] tracking-widest bg-foreground/5 px-2 py-0.5 rounded">
                                            {log.action.replace(/_/g, ' ')}
                                        </span>
                                    </p>
                                    <p className="text-[10px] text-foreground/30 font-bold mt-1 uppercase tracking-tighter">
                                        {new Date(log.created_at).toLocaleString()} • {log.entity_type} {log.entity_id?.slice(0, 8)}
                                    </p>
                                </div>
                            </div>
                            <div className="hidden md:block">
                                <pre className="text-[9px] text-foreground/40 font-mono bg-black/20 p-2 rounded-lg max-w-[200px] truncate">
                                    {JSON.stringify(log.details)}
                                </pre>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );

    const renderTeam = () => (
        <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Invitation Form */}
            <section className="glass-card !p-8">
                <h2 className="text-xl font-black mb-8 flex items-center gap-3">
                    <Mail className="w-6 h-6 text-primary" /> Пригласить сотрудника или клиента
                </h2>
                <form onSubmit={handleCreateInvite} className="flex flex-wrap gap-4">
                    <div className="flex-1 min-w-[200px] relative">
                        <input
                            type="email"
                            placeholder="Email пользователя"
                            className="input-premium w-full !pl-12"
                            value={inviteEmail}
                            onChange={e => setInviteEmail(e.target.value)}
                            required
                        />
                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-foreground/20 w-5 h-5" />
                    </div>
                    <select
                        className="input-premium w-full sm:w-48 appearance-none cursor-pointer"
                        value={inviteRole}
                        onChange={e => setInviteRole(e.target.value as 'client' | 'manager' | 'admin')}
                    >
                        <option value="client">Клиент</option>
                        <option value="manager">Менеджер</option>
                        <option value="admin">Администратор</option>
                    </select>
                    <button type="submit" className="btn-premium whitespace-nowrap">Создать приглашение</button>
                </form>
            </section>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                {/* Users List */}
                <div className="space-y-6">
                    <div className="flex items-center justify-between px-2">
                        <h3 className="text-xs font-black uppercase tracking-[0.3em] text-foreground/40">Все пользователи</h3>
                        <button onClick={loadData} className="p-2 text-foreground/20 hover:text-primary transition-colors cursor-pointer">
                            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
                        </button>
                    </div>
                    <div className="space-y-4">
                        {users.map(user => (
                            <div key={user.id} className="glass-card flex items-center justify-between !py-4 group">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all">
                                        <UserIcon size={18} />
                                    </div>
                                    <div>
                                        <p className="text-sm font-black">{user.organizationName || 'Индивидуальный'}</p>
                                        <p className="text-[10px] text-foreground/40 font-bold uppercase tracking-widest">{user.email}</p>
                                        <p className="text-[8px] text-foreground/20 font-bold uppercase tracking-tighter mt-1 italic">Регистрация: {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : '—'}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <button
                                        onClick={() => handleUpdateRole(user.id, user.role)}
                                        className="p-2 rounded-xl hover:bg-primary/10 text-foreground/20 hover:text-primary transition-all flex items-center gap-2 group/btn"
                                        title="Сменить роль"
                                    >
                                        <div className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest ${user.role === 'admin' ? 'bg-red-500/10 text-red-500' :
                                            user.role === 'manager' ? 'bg-indigo-500/10 text-indigo-500' :
                                                'bg-emerald-500/10 text-emerald-500'
                                            }`}>
                                            {user.role}
                                        </div>
                                        <ArrowRightLeft size={14} className="opacity-0 group-hover/btn:opacity-100 transition-opacity" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Active Invites List */}
                <div className="space-y-6">
                    <h3 className="text-xs font-black uppercase tracking-[0.3em] text-foreground/40 ml-2">Активные приглашения</h3>
                    <div className="space-y-4">
                        {invitations.length === 0 && (
                            <div className="py-12 glass-card text-center border-dashed border-2 flex flex-col items-center gap-2 opacity-50">
                                <Mail className="text-foreground/20 w-8 h-8" />
                                <p className="text-[10px] font-black uppercase tracking-widest">Нет активных приглашений</p>
                            </div>
                        )}
                        {invitations.map(invite => (
                            <div key={invite.id} className="glass-card flex items-center justify-between !py-4 group transition-all hover:translate-x-1">
                                <div className="space-y-1">
                                    <p className="text-sm font-black">{invite.email}</p>
                                    <div className="flex items-center gap-3">
                                        <span className="text-[9px] font-black text-primary uppercase tracking-widest bg-primary/5 px-2 py-0.5 rounded">{invite.role}</span>
                                        <span className="text-[9px] font-black text-foreground/20 uppercase tracking-widest">•</span>
                                        <span className={`text-[9px] font-black uppercase tracking-widest ${invite.status === 'pending' ? 'text-amber-500' : 'text-foreground/40'}`}>
                                            {invite.status === 'pending' ? 'Ожидает' : 'Использовано'}
                                        </span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    {invite.status === 'pending' && (
                                        <button
                                            onClick={() => copyInviteLink(invite.token)}
                                            className="p-2.5 rounded-xl bg-card border border-border-theme hover:border-primary text-foreground/40 hover:text-primary transition-all shadow-sm active:scale-90"
                                            title="Скопировать ссылку"
                                        >
                                            {copiedToken === invite.token ? <Check size={16} /> : <Copy size={16} />}
                                        </button>
                                    )}
                                    <button
                                        onClick={() => handleDeleteInvite(invite.id)}
                                        className="p-2.5 rounded-xl bg-card border border-border-theme hover:border-red-500 text-foreground/10 hover:text-red-500 transition-all opacity-0 group-hover:opacity-100"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-background flex flex-col">
            <DashboardHeader sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} title="Панель Администратора" />

            <div className="flex flex-1 overflow-hidden">
                <DashboardSidebar
                    isOpen={sidebarOpen}
                    currentPage={currentPage}
                    onNavigate={setCurrentPage}
                />

                <main className="flex-1 overflow-auto p-4 sm:p-8 custom-scrollbar">
                    <div className="max-w-7xl mx-auto space-y-12">
                        {loading ? (
                            <div className="flex flex-col items-center justify-center py-32 gap-6">
                                <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                                <div className="text-[10px] font-black uppercase tracking-[0.4em] text-foreground/20 animate-pulse">
                                    Загрузка терминала управления...
                                </div>
                            </div>
                        ) : (
                            <>
                                {/* Summary Stats */}
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <div className="glass-card hover:border-primary/50 transition-colors">
                                        <Users className="w-8 h-8 text-primary mb-4" />
                                        <p className="text-[10px] font-black uppercase tracking-widest text-foreground/40">Всего пользователей</p>
                                        <p className="text-3xl font-black tracking-tighter">{users.length}</p>
                                    </div>
                                    <div className="glass-card hover:border-emerald-500/50 transition-colors">
                                        <UserPlus className="w-8 h-8 text-emerald-500 mb-4" />
                                        <p className="text-[10px] font-black uppercase tracking-widest text-foreground/40">Ожидают регистрации</p>
                                        <p className="text-3xl font-black tracking-tighter">{invitations.filter(i => i.status === 'pending').length}</p>
                                    </div>
                                    <div className="glass-card hover:border-indigo-500/50 transition-colors">
                                        <History className="w-8 h-8 text-indigo-500 mb-4" />
                                        <p className="text-[10px] font-black uppercase tracking-widest text-foreground/40">Логи активности</p>
                                        <p className="text-3xl font-black tracking-tighter">{logs.length}</p>
                                    </div>
                                </div>

                                {currentPage === 'history' || currentPage === 'invites' ? renderLogs() : renderTeam()}
                            </>
                        )}
                    </div>
                </main>
            </div>
        </div>
    );
};
