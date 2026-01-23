import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useServices } from '@/app/di/ServiceContainer';
import type { Invitation, AdminCalculation, SystemStats } from '@/services/admin.service';
import type { AuditLog } from '@/services/audit.service';
import type { User } from '@/features/auth/auth.types';
import { toast } from 'sonner';
import { logger } from '@/core/logging/index';

export function useAdminDashboard() {
    const [searchParams, setSearchParams] = useSearchParams();
    const currentPage = (searchParams.get('page') || 'admin-overview').toLowerCase();

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

    const [users, setUsers] = useState<(User & { projectsCount: number })[]>([]);
    const [allCalculations, setAllCalculations] = useState<AdminCalculation[]>([]);
    const [calcTotal, setCalcTotal] = useState(0);
    const [calcPage, setCalcPage] = useState(1);
    const [invitations, setInvitations] = useState<Invitation[]>([]);
    const [logs, setLogs] = useState<AuditLog[]>([]);
    const [logPage, setLogPage] = useState(1);
    const [logTotal, setLogTotal] = useState(0);
    const [actionFilter, setActionFilter] = useState('all');
    const [userIdFilter, setUserIdFilter] = useState('all');
    const [stats, setStats] = useState<SystemStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [inviteEmail, setInviteEmail] = useState('');
    const [inviteRole, setInviteRole] = useState<'client' | 'manager' | 'admin'>('manager');
    const [copiedToken, setCopiedToken] = useState<string | null>(null);
    const [projectSearch, setProjectSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('all');

    const { adminService, auditLogService: auditService, emailService } = useServices();

    const loadData = useCallback(
        async (silent = false) => {
            try {
                if (!silent) setLoading(true);

                const [usersRes, statsRes] = await Promise.all([
                    adminService.getUsers(),
                    adminService.getSystemStats(),
                ]);

                if (usersRes.success) setUsers(usersRes.data || []);
                if (statsRes.success) setStats(statsRes.data || null);

                const [invitesRes, logsRes, calcsRes] = await Promise.all([
                    adminService.getInvitations(),
                    auditService.getLogs({
                        page: logPage,
                        pageSize: 20,
                        actionFilter,
                        userIdFilter,
                    }),
                    adminService.getAllCalculations(calcPage, 10),
                ]);

                if (invitesRes.success) setInvitations(invitesRes.data || []);
                if (logsRes.success) {
                    setLogs(logsRes.data?.data || []);
                    setLogTotal(logsRes.data?.total || 0);
                }
                if (calcsRes.success) {
                    setAllCalculations(calcsRes.data?.data || []);
                    setCalcTotal(calcsRes.data?.total || 0);
                }

                if (!silent) {
                    const firstError = [usersRes, statsRes, invitesRes, logsRes, calcsRes].find(
                        (r) => !r.success
                    )?.error;
                    if (firstError) {
                        toast.error(`Ошибка загрузки: ${firstError.message}`);
                    }
                }
            } catch (err: unknown) {
                const message = err instanceof Error ? err.message : String(err);
                logger.error('Ошибка при загрузке данных', { message });
                if (!silent) {
                    toast.error('Критическая ошибка при загрузке данных');
                }
            } finally {
                if (!silent) setLoading(false);
            }
        },
        [adminService, auditService, calcPage, logPage, actionFilter, userIdFilter]
    );

    useEffect(() => {
        loadData();
        const interval = setInterval(() => loadData(true), 30000);
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
        } catch {
            toast.error('Ошибка при удалении');
        }
    };

    const handleToggleBlock = async (user: User) => {
        const isBlocked = user.status === 'blocked';
        const confirmText = `Вы хотите ${isBlocked ? 'разблокировать' : 'заблокировать'} пользователя ${user.email}? ${isBlocked ? '' : 'Он потеряет доступ к системе.'}`;

        if (!confirm(confirmText)) return;

        try {
            const res = await adminService.setUserStatus(user.id, isBlocked ? 'active' : 'blocked');
            if (res.success) {
                toast.success(`Пользователь ${isBlocked ? 'разблокирован' : 'заблокирован'}`);
                loadData();
            } else {
                toast.error(res.error?.message || 'Ошибка');
            }
        } catch {
            toast.error('Ошибка при изменении статуса');
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

    const handleAssignManager = async (calcId: string, managerId: string | null) => {
        try {
            const res = await adminService.assignManager(calcId, managerId);
            if (res.success) {
                toast.success(managerId ? 'Менеджер назначен' : 'Менеджер снят');
                loadData();
            } else {
                toast.error(res.error?.message || 'Ошибка назначения');
            }
        } catch {
            toast.error('Ошибка назначения');
        }
    };

    const handleExportCSV = () => {
        try {
            const rows = allCalculations.map((c) => ({
                id: c.id,
                org: c.organization_name || 'N/A',
                status: c.status,
                budget: c.results?.totalAnnualBudget || 0,
                created: new Date(c.created_at).toLocaleDateString(),
            }));

            const headers = ['ID', 'Organization', 'Status', 'Budget', 'Created At'];
            const csvContent = [
                headers.join(','),
                ...rows.map((r) => Object.values(r).join(',')),
            ].join('\n');

            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = `projects_export_${new Date().toISOString().split('T')[0]}.csv`;
            link.click();
            toast.success('Экспорт завершен');
        } catch {
            toast.error('Ошибка при экспорте');
        }
    };

    const handleBulkDelete = async (ids: string[]) => {
        if (!confirm(`Удалить выбранные проекты (${ids.length})?`)) return;
        try {
            const res = await adminService.bulkDeleteCalculations(ids);
            if (res.success) {
                toast.success('Проекты удалены');
                loadData();
            } else {
                toast.error(res.error?.message || 'Ошибка');
            }
        } catch {
            toast.error('Критическая ошибка удаления');
        }
    };

    const handleBulkStatusUpdate = async (ids: string[], status: string) => {
        try {
            const res = await adminService.bulkUpdateCalculationStatus(ids, status);
            if (res.success) {
                toast.success('Статусы обновлены');
                loadData();
            } else {
                toast.error(res.error?.message || 'Ошибка');
            }
        } catch {
            toast.error('Ошибка обновления статуса');
        }
    };

    return {
        // State
        currentPage,
        users,
        allCalculations,
        calcTotal,
        calcPage,
        invitations,
        logs,
        logPage,
        logTotal,
        actionFilter,
        userIdFilter,
        stats,
        loading,
        inviteEmail,
        inviteRole,
        copiedToken,
        projectSearch,
        statusFilter,
        // Setters
        setCurrentPage,
        setCalcPage,
        setLogPage,
        setActionFilter,
        setUserIdFilter,
        setInviteEmail,
        setInviteRole,
        setProjectSearch,
        setStatusFilter,
        // Actions
        handleCreateInvite,
        handleUpdateRole,
        copyInviteLink,
        handleDeleteInvite,
        handleDeleteUser,
        handleToggleBlock,
        handleDeleteCalculation,
        handleStatusReturn,
        handleAssignManager,
        handleExportCSV,
        handleBulkDelete,
        handleBulkStatusUpdate,
        refresh: loadData,
    };
}
