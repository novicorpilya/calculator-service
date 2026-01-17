import React, { useState, useMemo } from 'react';
import { DashboardHeader } from '@/features/dashboard/components/DashboardHeader';
import { ErrorBoundary } from '@/core/components/ErrorBoundary';
import { DashboardSidebar } from '@/features/dashboard/components/DashboardSidebar';

// Custom Hooks
import { useAdminDashboard } from './hooks/useAdminDashboard';

// Components
import { AdminOverview } from './components/AdminOverview';
import { AdminLogsTable } from './components/AdminLogsTable';
import { AdminTeamManager } from './components/AdminTeamManager';
import { AdminProjectsList } from './components/AdminProjectsList';
import { AdminInventoryManager } from './components/AdminInventoryManager';
import { AdminSupplierManager } from './components/AdminSupplierManager';
import { AdminThemeManager } from './components/AdminThemeManager';
import { AdminCalculatorConfig } from './components/AdminCalculatorConfig';
import { ClientProfile } from '@/features/dashboard/client/components/ClientProfile';

export const AdminDashboard: React.FC = () => {
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const admin = useAdminDashboard();

    const filteredProjects = useMemo(() => {
        return admin.allCalculations.filter((project) => {
            const matchesSearch = project.organization_name
                .toLowerCase()
                .includes(admin.projectSearch.toLowerCase());
            const matchesStatus = admin.statusFilter === 'all' || project.status === admin.statusFilter;
            return matchesSearch && matchesStatus;
        });
    }, [admin.allCalculations, admin.projectSearch, admin.statusFilter]);

    if (admin.loading && !admin.stats) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen gap-6">
                <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                <div className="text-[10px] font-black uppercase tracking-[0.4em] text-foreground/20 animate-pulse">
                    Система инициализируется...
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background flex flex-col">
            <DashboardHeader
                sidebarOpen={sidebarOpen}
                setSidebarOpen={setSidebarOpen}
                title="Терминал Управления"
            />

            <div className="flex flex-1 overflow-hidden">
                <DashboardSidebar
                    isOpen={sidebarOpen}
                    currentPage={admin.currentPage}
                    onNavigate={admin.setCurrentPage}
                />

                <main className="flex-1 overflow-auto p-4 sm:p-8 custom-scrollbar">
                    <div className="max-w-7xl mx-auto space-y-12">
                        <ErrorBoundary text="Ошибка при загрузке раздела">
                            {admin.currentPage === 'admin-overview' && (
                                <AdminOverview 
                                    stats={admin.stats} 
                                    users={admin.users} 
                                    invitations={admin.invitations}
                                    onNavigate={admin.setCurrentPage}
                                />
                            )}
                            {admin.currentPage === 'admin-logs' && (
                                <AdminLogsTable 
                                    logs={admin.logs}
                                    totalCount={admin.logTotal}
                                    currentPage={admin.logPage}
                                    pageSize={20}
                                    onPageChange={admin.setLogPage}
                                    actionFilter={admin.actionFilter}
                                    onActionFilterChange={(val) => {
                                        admin.setActionFilter(val);
                                        admin.setLogPage(1);
                                    }}
                                    userIdFilter={admin.userIdFilter}
                                    onUserIdFilterChange={(val) => {
                                        admin.setUserIdFilter(val);
                                        admin.setLogPage(1);
                                    }}
                                    users={admin.users}
                                />
                            )}
                            {admin.currentPage === 'team' && (
                                <AdminTeamManager 
                                    users={admin.users}
                                    invitations={admin.invitations}
                                    inviteEmail={admin.inviteEmail}
                                    setInviteEmail={admin.setInviteEmail}
                                    inviteRole={admin.inviteRole}
                                    setInviteRole={admin.setInviteRole}
                                    handleCreateInvite={admin.handleCreateInvite}
                                    handleUpdateRole={admin.handleUpdateRole}
                                    handleToggleBlock={admin.handleToggleBlock}
                                    handleDeleteUser={admin.handleDeleteUser}
                                    handleDeleteInvite={admin.handleDeleteInvite}
                                    copyInviteLink={admin.copyInviteLink}
                                    copiedToken={admin.copiedToken}
                                    loading={admin.loading}
                                    onRefresh={admin.refresh}
                                />
                            )}
                            {admin.currentPage === 'admin-inventory' && (
                                <AdminInventoryManager />
                            )}
                            {admin.currentPage === 'admin-suppliers' && (
                                <AdminSupplierManager />
                            )}
                            {admin.currentPage === 'admin-labeling' && (
                                <AdminThemeManager />
                            )}
                            {admin.currentPage === 'admin-calculator' && (
                                <AdminCalculatorConfig />
                            )}
                            {admin.currentPage === 'projects' && (
                                <AdminProjectsList 
                                    projects={filteredProjects}
                                    managers={admin.users.filter(u => u.role === 'manager' || u.role === 'admin')}
                                    onStatusReturn={admin.handleStatusReturn}
                                    onDelete={admin.handleDeleteCalculation}
                                    onAssignManager={admin.handleAssignManager}
                                    searchTerm={admin.projectSearch}
                                    onSearchChange={admin.setProjectSearch}
                                    statusFilter={admin.statusFilter}
                                    onStatusFilterChange={admin.setStatusFilter}
                                    currentPage={admin.calcPage}
                                    totalCount={admin.calcTotal}
                                    onPageChange={admin.setCalcPage}
                                    onExport={admin.handleExportCSV}
                                    onBulkDelete={admin.handleBulkDelete}
                                    onBulkStatusUpdate={admin.handleBulkStatusUpdate}
                                />
                            )}
                            {admin.currentPage === 'profile' && <ClientProfile />}
                        </ErrorBoundary>
                    </div>
                </main>
            </div>
        </div>
    );
};
