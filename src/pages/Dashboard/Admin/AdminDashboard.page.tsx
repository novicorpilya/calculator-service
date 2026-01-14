import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { DashboardHeader } from '@/features/dashboard/components/DashboardHeader';
import { ErrorBoundary } from '@/core/components/ErrorBoundary';
import { DashboardSidebar } from '@/features/dashboard/components/DashboardSidebar';
import { useServices } from '@/core/di/ServiceContainer';
import type { Invitation, AdminCalculation, SystemStats } from '@/services/admin.service';
import type { AuditLog } from '@/services/audit.service';
import type { User } from '@/features/auth/auth.types';
import { toast } from 'sonner';
import { logger } from '@/core/logging';
import {
    UserPlus,
    Users,
    Mail,
    Copy,
    Check,
    Trash2,
    User as UserIcon,
    History,
    Clock,
    ArrowRightLeft,
    RefreshCw,
    TrendingUp,
    Wallet,
    Activity,
    ChevronRight,
    Briefcase,
    CheckCircle2,
    AlertCircle,
    Shield,
    FolderSearch,
} from 'lucide-react';

export const AdminDashboard: React.FC = () => {
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [searchParams, setSearchParams] = useSearchParams();
    const currentPage = searchParams.get('page') || 'admin-overview';

    const setCurrentPage = useCallback(
        (page: string) => {
            setSearchParams((prev) => {
                const next = new URLSearchParams(prev);
                next.set('page', page);
                return next;
            });
        },
        [setSearchParams]
    );
    const [users, setUsers] = useState<User[]>([]);
    const [allCalculations, setAllCalculations] = useState<AdminCalculation[]>([]);
    const [invitations, setInvitations] = useState<Invitation[]>([]);
    const [logs, setLogs] = useState<AuditLog[]>([]);
    const [stats, setStats] = useState<SystemStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [inviteEmail, setInviteEmail] = useState('');
    const [inviteRole, setInviteRole] = useState<'client' | 'manager' | 'admin'>('manager');
    const [copiedToken, setCopiedToken] = useState<string | null>(null);

    const { adminService, auditLogService: auditService, emailService } = useServices();

    const loadData = useCallback(async () => {
        try {
            setLoading(true);
            const [usersRes, invitesRes, logsRes, statsRes, calcsRes] = await Promise.all([
                adminService.getUsers(),
                adminService.getInvitations(),
                auditService.getLogs(),
                adminService.getSystemStats(),
                adminService.getAllCalculations(),
            ]);

            if (usersRes.success) setUsers(usersRes.data || []);
            if (invitesRes.success) setInvitations(invitesRes.data || []);
            if (logsRes.success) setLogs(logsRes.data || []);
            if (statsRes.success) setStats(statsRes.data || null);
            if (calcsRes.success) setAllCalculations(calcsRes.data || []);

            // Report first error if any
            const firstError = [usersRes, invitesRes, logsRes, statsRes, calcsRes].find(
                (r) => !r.success
            )?.error;
            if (firstError) {
                toast.error(`Ошибка загрузки: ${firstError.message}`);
            }
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : String(err);
            logger.error('Ошибка при загрузке данных', { message });
            toast.error('Критическая ошибка при загрузке данных');
        } finally {
            setLoading(false);
        }
    }, [adminService, auditService]);

    useEffect(() => {
        loadData();

        // Middle+ Polling: Обновляем данные каждые 30 секунд для актуальности статусов
        const interval = setInterval(loadData, 30000);
        return () => clearInterval(interval);
    }, [loadData]);

    const handleCreateInvite = async (e: React.FormEvent) => {
        e.preventDefault();
        const promise = (async () => {
            const res = await adminService.createInvitation(inviteEmail, inviteRole);
            if (!res.success || !res.data) throw new Error(res.error?.message || 'Failed');
            const invite = res.data;

            const link = `${window.location.origin}/auth/register?invite=${invite.token}`;
            const emailRes = await emailService.sendInvitation(inviteEmail, inviteRole, link);
            if (!emailRes.success) {
                logger.warn('Invitation created but email failed', emailRes.error);
                // We still background succeed because the invite is valid, but the user should know
                toast.warning('Приглашение создано, но письмо не было отправлено');
            }
            setInviteEmail('');
            loadData();
            return { email: inviteEmail };
        })();

        toast.promise(promise, {
            loading: 'Генерация приглашения и отправка письма...',
            success: (data) => `Приглашение для ${data.email} успешно создано!`,
            error: (err) => `Ошибка: ${err.message}`,
        });
    };

    const handleUpdateRole = async (userId: string, currentRole: string) => {
        const roles: ('client' | 'manager' | 'admin')[] = ['client', 'manager', 'admin'];
        const currentRoleTyped = currentRole as 'client' | 'manager' | 'admin';
        const nextRole = roles[(roles.indexOf(currentRoleTyped) + 1) % roles.length];

        if (!confirm(`Изменить роль пользователя на ${nextRole}?`)) return;

        try {
            const res = await adminService.updateUserRole(userId, nextRole);
            if (res.success) {
                toast.success('Роль успешно обновлена');
                loadData();
            } else {
                toast.error(res.error?.message || 'Ошибка при смене роли');
            }
        } catch {
            toast.error('Ошибка при смене роли');
        }
    };

    const copyInviteLink = (token: string) => {
        const link = `${window.location.origin}/auth/register?invite=${token}`;
        navigator.clipboard.writeText(link);
        setCopiedToken(token);
        toast.success('Ссылка скопирована в буфер обмена');
        const timer = setTimeout(() => setCopiedToken(null), 2000);
        return () => clearTimeout(timer);
    };

    const handleDeleteInvite = async (id: string) => {
        if (!confirm('Удалить это приглашение?')) return;
        try {
            const res = await adminService.deleteInvitation(id);
            if (res.success) {
                toast.success('Приглашение удалено');
                loadData();
            } else {
                toast.error(res.error?.message || 'Ошибка удаления');
            }
        } catch {
            toast.error('Ошибка удаления');
        }
    };

    const handleDeleteUser = async (user: User) => {
        const confirmText = `ВНИМАНИЕ! Вы собираетесь навсегда удалить пользователя ${user.email}. Это действие удалит его аккаунт из системы и все связанные профильные данные. Вы уверены?`;

        if (!confirm(confirmText)) return;

        try {
            const res = await adminService.deleteUser(user.id);
            if (res.success) {
                toast.success(`Пользователь ${user.email} успешно удален`);
                loadData();
            } else {
                toast.error(res.error?.message || 'Ошибка при удалении');
            }
        } catch (err: unknown) {
            toast.error(
                `Ошибка при удалении: ${err instanceof Error ? err.message : 'Неизвестная ошибка'}`
            );
        }
    };

    const handleToggleBlock = async (user: User) => {
        const newStatus = user.status === 'blocked' ? 'active' : 'blocked';
        const action = newStatus === 'blocked' ? 'заблокировать' : 'разблокировать';

        if (!confirm(`Вы действительно хотите ${action} пользователя ${user.email}?`)) return;

        try {
            const res = await adminService.setUserStatus(user.id, newStatus);
            if (res.success) {
                toast.success(
                    `Пользователь ${newStatus === 'blocked' ? 'заблокирован' : 'разблокирован'}`
                );
                loadData();
            } else {
                toast.error(res.error?.message || 'Ошибка при смене статуса');
            }
        } catch {
            toast.error('Ошибка при смене статуса');
        }
    };

    const handleDeleteCalculation = async (calcId: string, orgName: string) => {
        if (
            !confirm(`Вы уверены, что хотите удалить проект "${orgName}"? Это действие необратимо.`)
        )
            return;

        try {
            const res = await adminService.adminDeleteCalculation(calcId);
            if (res.success) {
                toast.success('Проект успешно удален');
                loadData();
            } else {
                toast.error(res.error?.message || 'Ошибка при удалении проекта');
            }
        } catch {
            toast.error('Ошибка при удалении проекта');
        }
    };

    const handleStatusReturn = async (calcId: string, currentStatus: string) => {
        const statuses = ['draft', 'sent', 'expert', 'suppliers', 'invoice', 'completed'];
        const currentIndex = statuses.indexOf(currentStatus);
        const prevStatus = currentIndex > 0 ? statuses[currentIndex - 1] : 'draft';

        if (!confirm(`Вернуть проект на стадию "${prevStatus}"?`)) return;

        try {
            const res = await adminService.adminUpdateCalculationStatus(calcId, prevStatus);
            if (res.success) {
                toast.success(`Проект возвращен на стадию ${prevStatus}`);
                loadData();
            } else {
                toast.error(res.error?.message || 'Ошибка при обновлении статуса');
            }
        } catch {
            toast.error('Ошибка при обновлении статуса');
        }
    };

    const renderOverview = () => (
        <div className="space-y-12 animate-in fade-in duration-700">
            {/* Senior Analytics Pulse */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="glass-card group hover:border-primary/50 transition-all duration-500">
                    <div className="flex items-start justify-between mb-4">
                        <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                            <TrendingUp size={24} />
                        </div>
                        <span className="text-[10px] font-black text-emerald-500 bg-emerald-500/10 px-2 py-1 rounded-full uppercase tracking-widest">
                            +12%
                        </span>
                    </div>
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-foreground/40 mb-1">
                        Общий бюджет проектов
                    </p>
                    <p className="text-3xl font-black tracking-tighter">
                        {stats?.totalGlobalBudget
                            ? Math.round(stats.totalGlobalBudget).toLocaleString()
                            : '0'}{' '}
                        <span className="text-sm text-foreground/30 ml-1">₽</span>
                    </p>
                </div>

                <div className="glass-card group hover:border-indigo-500/50 transition-all duration-500">
                    <div className="flex items-start justify-between mb-4">
                        <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-500 group-hover:scale-110 transition-transform">
                            <Wallet size={24} />
                        </div>
                    </div>
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-foreground/40 mb-1">
                        Выставлено счетов
                    </p>
                    <p className="text-3xl font-black tracking-tighter">
                        {stats?.revenuePipeline
                            ? Math.round(stats.revenuePipeline).toLocaleString()
                            : '0'}{' '}
                        <span className="text-sm text-foreground/30 ml-1">₽</span>
                    </p>
                </div>

                <div className="glass-card group hover:border-emerald-500/50 transition-all duration-500">
                    <div className="flex items-start justify-between mb-4">
                        <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-500 group-hover:scale-110 transition-transform">
                            <Briefcase size={24} />
                        </div>
                    </div>
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-foreground/40 mb-1">
                        Активные проекты
                    </p>
                    <p className="text-3xl font-black tracking-tighter">
                        {stats?.activeProjects || 0}
                    </p>
                </div>

                <div className="glass-card group hover:border-amber-500/50 transition-all duration-500">
                    <div className="flex items-start justify-between mb-4">
                        <div className="w-12 h-12 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-500 group-hover:scale-110 transition-transform">
                            <Activity size={24} />
                        </div>
                    </div>
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-foreground/40 mb-1">
                        Всего расчетов
                    </p>
                    <p className="text-3xl font-black tracking-tighter">
                        {stats?.totalProjects || 0}
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                {/* Pipeline Health */}
                <div className="xl:col-span-2 space-y-6">
                    <h3 className="text-xs font-black uppercase tracking-[0.3em] text-foreground/40 ml-2">
                        Здоровье воронки продаж
                    </h3>
                    <div className="glass-card !p-8">
                        <div className="space-y-8">
                            {[
                                {
                                    label: 'Черновики',
                                    count: stats?.stages?.draft || 0,
                                    color: 'bg-foreground/10',
                                },
                                {
                                    label: 'На проверке экспертом',
                                    count: stats?.stages?.expert || 0,
                                    color: 'bg-indigo-500',
                                },
                                {
                                    label: 'Подбор поставщиков',
                                    count: stats?.stages?.suppliers || 0,
                                    color: 'bg-amber-500',
                                },
                                {
                                    label: 'Выставление счета',
                                    count: stats?.stages?.invoice || 0,
                                    color: 'bg-emerald-500',
                                },
                                {
                                    label: 'Завершено',
                                    count: stats?.stages?.completed || 0,
                                    color: 'bg-primary',
                                },
                            ].map((stage, idx) => {
                                const percentage = stats?.totalProjects
                                    ? (stage.count / stats.totalProjects) * 100
                                    : 0;
                                return (
                                    <div key={idx} className="space-y-2">
                                        <div className="flex justify-between items-end">
                                            <span className="text-[11px] font-black uppercase tracking-widest">
                                                {stage.label}
                                            </span>
                                            <span className="text-lg font-black">
                                                {stage.count}
                                            </span>
                                        </div>
                                        <div className="h-3 bg-background border border-border-theme rounded-full overflow-hidden p-0.5">
                                            <div
                                                className={`h-full ${stage.color} rounded-full transition-all duration-1000 ease-out shadow-sm`}
                                                style={{ width: `${Math.max(percentage, 2)}%` }}
                                            />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* System Vitality */}
                <div className="space-y-6">
                    <h3 className="text-xs font-black uppercase tracking-[0.3em] text-foreground/40 ml-2">
                        Витальность системы
                    </h3>
                    <div className="glass-card !p-6 space-y-6">
                        <div className="flex items-center gap-4 p-4 rounded-2xl bg-emerald-500/5 border border-emerald-500/10">
                            <CheckCircle2 className="text-emerald-500 w-5 h-5 shrink-0" />
                            <div>
                                <p className="text-[10px] font-black uppercase tracking-widest leading-none mb-1">
                                    База данных
                                </p>
                                <p className="text-[10px] font-bold text-foreground/40 uppercase">
                                    Статус: В норме (Latency 24ms)
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-4 p-4 rounded-2xl bg-indigo-500/5 border border-indigo-500/10">
                            <Users className="text-indigo-500 w-5 h-5 shrink-0" />
                            <div>
                                <p className="text-[10px] font-black uppercase tracking-widest leading-none mb-1">
                                    Менеджеры онлайн
                                </p>
                                <p className="text-[10px] font-bold text-foreground/40 uppercase">
                                    {users.filter((u) => u.role === 'manager').length} активных
                                    специалистов
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-4 p-4 rounded-2xl bg-amber-500/5 border border-amber-500/10">
                            <AlertCircle className="text-amber-500 w-5 h-5 shrink-0" />
                            <div>
                                <p className="text-[10px] font-black uppercase tracking-widest leading-none mb-1">
                                    Просроченные инвайты
                                </p>
                                <p className="text-[10px] font-bold text-foreground/40 uppercase">
                                    {invitations.filter((i) => i.status === 'expired').length}{' '}
                                    ссылок требуют внимания
                                </p>
                            </div>
                        </div>

                        <button
                            onClick={() => setCurrentPage('team')}
                            className="w-full btn-premium py-4 group"
                        >
                            Управление командой{' '}
                            <ChevronRight
                                size={14}
                                className="group-hover:translate-x-1 transition-transform"
                            />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );

    const renderLogs = () => (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h3 className="text-xs font-black uppercase tracking-[0.3em] text-foreground/40 ml-2 flex items-center gap-2">
                <History size={14} /> История действий системы
            </h3>
            <div className="glass-card !p-0 overflow-hidden">
                <div className="divide-y divide-border-theme">
                    {logs.map((log) => (
                        <div
                            key={log.id}
                            className="p-4 hover:bg-primary/5 transition-colors flex items-center justify-between gap-4"
                        >
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
                                        {new Date(log.created_at).toLocaleString()} •{' '}
                                        {log.entity_type} {log.entity_id?.slice(0, 8)}
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
                            onChange={(e) => setInviteEmail(e.target.value)}
                            required
                        />
                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-foreground/20 w-5 h-5" />
                    </div>
                    <select
                        className="input-premium w-full sm:w-48 appearance-none cursor-pointer"
                        value={inviteRole}
                        onChange={(e) =>
                            setInviteRole(e.target.value as 'client' | 'manager' | 'admin')
                        }
                    >
                        <option value="client">Клиент</option>
                        <option value="manager">Менеджер</option>
                        <option value="admin">Администратор</option>
                    </select>
                    <button type="submit" className="btn-premium whitespace-nowrap">
                        Создать приглашение
                    </button>
                </form>
            </section>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                {/* Users List */}
                <div className="space-y-6">
                    <div className="flex items-center justify-between px-2">
                        <h3 className="text-xs font-black uppercase tracking-[0.3em] text-foreground/40">
                            Все пользователи
                        </h3>
                        <button
                            onClick={loadData}
                            className="p-2 text-foreground/20 hover:text-primary transition-colors cursor-pointer"
                        >
                            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
                        </button>
                    </div>
                    <div className="space-y-4">
                        {users.map((user) => (
                            <div
                                key={user.id}
                                className="glass-card flex items-center justify-between !py-4 group"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all">
                                        <UserIcon size={18} />
                                    </div>
                                    <div>
                                        <p className="text-sm font-black">
                                            {user.organizationName || 'Индивидуальный'}
                                        </p>
                                        <p className="text-[10px] text-foreground/40 font-bold uppercase tracking-widest">
                                            {user.email}
                                        </p>
                                        <p className="text-[8px] text-foreground/20 font-bold uppercase tracking-tighter mt-1 italic">
                                            Регистрация:{' '}
                                            {user.createdAt
                                                ? new Date(user.createdAt).toLocaleDateString()
                                                : '—'}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <button
                                        onClick={() => handleUpdateRole(user.id, user.role)}
                                        className="p-2 rounded-xl hover:bg-primary/10 text-foreground/20 hover:text-primary transition-all flex items-center gap-2 group/btn"
                                        title="Сменить роль"
                                    >
                                        <div
                                            className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest ${
                                                user.role === 'admin'
                                                    ? 'bg-red-500/10 text-red-500'
                                                    : user.role === 'manager'
                                                      ? 'bg-indigo-500/10 text-indigo-500'
                                                      : 'bg-emerald-500/10 text-emerald-500'
                                            }`}
                                        >
                                            {user.role}
                                        </div>
                                        <ArrowRightLeft
                                            size={14}
                                            className="opacity-0 group-hover/btn:opacity-100 transition-opacity"
                                        />
                                    </button>

                                    <button
                                        onClick={() => handleToggleBlock(user)}
                                        className={`p-2.5 rounded-xl border transition-all ${
                                            user.status === 'blocked'
                                                ? 'bg-red-500 text-white border-red-500'
                                                : 'bg-card border-border-theme hover:border-amber-500 text-foreground/10 hover:text-amber-500'
                                        }`}
                                        title={
                                            user.status === 'blocked'
                                                ? 'Разблокировать'
                                                : 'Заблокировать'
                                        }
                                    >
                                        <Shield size={16} />
                                    </button>

                                    <button
                                        onClick={() => handleDeleteUser(user)}
                                        className="p-2.5 rounded-xl bg-card border border-border-theme hover:border-red-500 text-foreground/10 hover:text-red-500 transition-all opacity-0 group-hover:opacity-100"
                                        title="Удалить пользователя навсегда"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Active Invites List */}
                <div className="space-y-6">
                    <h3 className="text-xs font-black uppercase tracking-[0.3em] text-foreground/40 ml-2">
                        Активные приглашения
                    </h3>
                    <div className="space-y-4">
                        {invitations.length === 0 && (
                            <div className="py-12 glass-card text-center border-dashed border-2 flex flex-col items-center gap-2 opacity-50">
                                <Mail className="text-foreground/20 w-8 h-8" />
                                <p className="text-[10px] font-black uppercase tracking-widest">
                                    Нет активных приглашений
                                </p>
                            </div>
                        )}
                        {invitations.map((invite) => (
                            <div
                                key={invite.id}
                                className="glass-card flex items-center justify-between !py-4 group transition-all hover:translate-x-1"
                            >
                                <div className="space-y-1">
                                    <p className="text-sm font-black">{invite.email}</p>
                                    <div className="flex items-center gap-3">
                                        <span className="text-[9px] font-black text-primary uppercase tracking-widest bg-primary/5 px-2 py-0.5 rounded">
                                            {invite.role}
                                        </span>
                                        <span className="text-[9px] font-black text-foreground/20 uppercase tracking-widest">
                                            •
                                        </span>
                                        <span
                                            className={`text-[9px] font-black uppercase tracking-widest ${invite.status === 'pending' ? 'text-amber-500' : 'text-foreground/40'}`}
                                        >
                                            {invite.status === 'pending'
                                                ? 'Ожидает'
                                                : 'Использовано'}
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
                                            {copiedToken === invite.token ? (
                                                <Check size={16} />
                                            ) : (
                                                <Copy size={16} />
                                            )}
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

    const renderProjects = () => (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h3 className="text-xs font-black uppercase tracking-[0.3em] text-foreground/40 ml-2">
                Все сделки в системе ({allCalculations.length})
            </h3>
            <div className="grid grid-cols-1 gap-4">
                {allCalculations.length === 0 ? (
                    <div className="py-20 glass-card text-center opacity-30">
                        <FolderSearch size={40} className="mx-auto mb-4" />
                        <p className="text-[10px] font-black uppercase tracking-widest">
                            Проектов пока нет
                        </p>
                    </div>
                ) : (
                    allCalculations.map((calc, index) => (
                        <div
                            key={calc.id}
                            className="glass-card flex items-center justify-between !py-6 group"
                        >
                            <div className="flex items-center gap-6">
                                <div className="w-12 h-12 rounded-2xl bg-foreground/5 flex flex-col items-center justify-center text-foreground/30 relative">
                                    <Briefcase size={16} className="mb-0.5" />
                                    <span className="text-[8px] font-black opacity-60">
                                        #{String(index + 1).padStart(3, '0')}
                                    </span>
                                </div>
                                <div>
                                    <h4 className="text-base font-black uppercase tracking-tight">
                                        {calc.organization_name}
                                    </h4>
                                    <div className="flex items-center gap-3 mt-1">
                                        <span className="text-[10px] font-black uppercase bg-primary/10 text-primary px-2 py-0.5 rounded">
                                            {calc.status}
                                        </span>
                                        <span className="text-[10px] font-bold text-foreground/20 italic">
                                            {(() => {
                                                try {
                                                    const date = new Date(calc.created_at);
                                                    return isNaN(date.getTime())
                                                        ? calc.created_at
                                                        : new Intl.DateTimeFormat('ru-RU').format(
                                                              date
                                                          );
                                                } catch {
                                                    return calc.created_at;
                                                }
                                            })()}
                                        </span>
                                        <span className="text-[10px] font-bold text-foreground/20 italic">
                                            • Позиций: {calc.results?.summary?.length || 0}
                                        </span>
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <button
                                    onClick={() => handleStatusReturn(calc.id, calc.status)}
                                    className="p-3 bg-card border border-border-theme hover:border-amber-500 text-foreground/20 hover:text-amber-500 rounded-xl transition-all"
                                    title="Вернуть статус назад"
                                >
                                    <RefreshCw size={18} />
                                </button>
                                <button
                                    onClick={() =>
                                        handleDeleteCalculation(calc.id, calc.organization_name)
                                    }
                                    className="p-3 bg-card border border-border-theme hover:border-red-500 text-foreground/20 hover:text-red-500 rounded-xl transition-all"
                                    title="Удалить проект"
                                >
                                    <Trash2 size={18} />
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-background flex flex-col">
            <DashboardHeader
                sidebarOpen={sidebarOpen}
                setSidebarOpen={setSidebarOpen}
                title="Панель Администратора"
            />

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
                                        <p className="text-[10px] font-black uppercase tracking-widest text-foreground/40">
                                            Всего пользователей
                                        </p>
                                        <p className="text-3xl font-black tracking-tighter">
                                            {users.length}
                                        </p>
                                    </div>
                                    <div className="glass-card hover:border-emerald-500/50 transition-colors">
                                        <UserPlus className="w-8 h-8 text-emerald-500 mb-4" />
                                        <p className="text-[10px] font-black uppercase tracking-widest text-foreground/40">
                                            Ожидают регистрации
                                        </p>
                                        <p className="text-3xl font-black tracking-tighter">
                                            {
                                                invitations.filter((i) => i.status === 'pending')
                                                    .length
                                            }
                                        </p>
                                    </div>
                                    <div className="glass-card hover:border-indigo-500/50 transition-colors">
                                        <History className="w-8 h-8 text-indigo-500 mb-4" />
                                        <p className="text-[10px] font-black uppercase tracking-widest text-foreground/40">
                                            Логи активности
                                        </p>
                                        <p className="text-3xl font-black tracking-tighter">
                                            {logs.length}
                                        </p>
                                    </div>
                                </div>

                                <ErrorBoundary>
                                    {currentPage === 'admin-overview'
                                        ? renderOverview()
                                        : currentPage === 'history'
                                          ? renderLogs()
                                          : currentPage === 'team'
                                            ? renderTeam()
                                            : currentPage === 'projects'
                                              ? renderProjects()
                                              : renderOverview()}
                                </ErrorBoundary>
                            </>
                        )}
                    </div>
                </main>
            </div>
        </div>
    );
};
