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
    Users,
    UserPlus,
} from 'lucide-react';

// Components
import { AdminOverview } from './components/AdminOverview';
import { AdminLogsTable } from './components/AdminLogsTable';
import { AdminTeamManager } from './components/AdminTeamManager';
import { AdminProjectsList } from './components/AdminProjectsList';

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
        setTimeout(() => setCopiedToken(null), 2000);
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
        if (!confirm(`Вы уверены, что хотите удалить проект "${orgName}"? Это действие необратимо.`)) return;

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
                        {loading && !stats ? (
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
                                            {invitations.filter(i => i.status === 'pending').length}
                                        </p>
                                    </div>
                                </div>

                                <ErrorBoundary>
                                    {currentPage === 'admin-overview' && (
                                        <AdminOverview 
                                            stats={stats} 
                                            users={users} 
                                            invitations={invitations}
                                            onNavigate={setCurrentPage}
                                        />
                                    )}
                                    {currentPage === 'admin-logs' && (
                                        <AdminLogsTable logs={logs} />
                                    )}
                                    {currentPage === 'team' && (
                                        <AdminTeamManager 
                                            users={users}
                                            invitations={invitations}
                                            inviteEmail={inviteEmail}
                                            setInviteEmail={setInviteEmail}
                                            inviteRole={inviteRole}
                                            setInviteRole={setInviteRole}
                                            handleCreateInvite={handleCreateInvite}
                                            handleUpdateRole={handleUpdateRole}
                                            handleToggleBlock={handleToggleBlock}
                                            handleDeleteUser={handleDeleteUser}
                                            handleDeleteInvite={handleDeleteInvite}
                                            copyInviteLink={copyInviteLink}
                                            copiedToken={copiedToken}
                                            loading={loading}
                                            onRefresh={loadData}
                                        />
                                    )}
                                    {currentPage === 'projects' && (
                                        <AdminProjectsList 
                                            projects={allCalculations}
                                            onStatusReturn={handleStatusReturn}
                                            onDelete={handleDeleteCalculation}
                                        />
                                    )}
                                </ErrorBoundary>
                            </>
                        )}
                    </div>
                </main>
            </div>
        </div>
    );
};
