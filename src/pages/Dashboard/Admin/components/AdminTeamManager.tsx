import React from 'react';
import { 
    RefreshCw, 
    Briefcase,
    Send
} from 'lucide-react';
import type { User } from '@/features/auth/auth.types';
import type { Invitation } from '@/services/admin.service';
import { UserTable } from './Team/UserTable';
import { InvitationTable } from './Team/InvitationTable';

interface AdminTeamManagerProps {
    users: (User & { projectsCount: number })[];
    invitations: Invitation[];
    inviteEmail: string;
    setInviteEmail: (email: string) => void;
    inviteRole: 'client' | 'manager' | 'admin';
    setInviteRole: (role: 'client' | 'manager' | 'admin') => void;
    handleCreateInvite: (e: React.FormEvent) => void;
    handleUpdateRole: (userId: string, currentRole: string) => void;
    handleToggleBlock: (user: User) => void;
    handleDeleteUser: (user: User) => void;
    handleDeleteInvite: (id: string) => void;
    copyInviteLink: (token: string) => void;
    copiedToken: string | null;
    loading: boolean;
    onRefresh: () => void;
}

export const AdminTeamManager: React.FC<AdminTeamManagerProps> = ({
    users,
    invitations,
    inviteEmail,
    setInviteEmail,
    inviteRole,
    setInviteRole,
    handleCreateInvite,
    handleUpdateRole,
    handleToggleBlock,
    handleDeleteUser,
    handleDeleteInvite,
    copyInviteLink,
    copiedToken,
    loading,
    onRefresh,
}) => {
    return (
        <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
            {/* Toolbar */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 relative z-10">
                <div className="flex-1 max-w-2xl">
                    <h2 className="text-2xl font-black tracking-tight flex items-center gap-3">
                        <div className="p-3 bg-primary/10 rounded-2xl text-primary">
                            <Briefcase size={24} />
                        </div>
                        Команда и Доступы
                    </h2>
                    <p className="text-muted-foreground mt-2 text-sm font-medium ml-1">
                        Управление пользователями, ролями и приглашениями в систему управления.
                    </p>
                    
                    {/* Invite Form */}
                    <form onSubmit={handleCreateInvite} className="mt-8 flex flex-col sm:flex-row gap-3">
                        <input 
                            type="email"
                            required
                            placeholder="Email нового участника..."
                            value={inviteEmail}
                            onChange={(e) => setInviteEmail(e.target.value)}
                            className="flex-1 bg-card/50 border border-border-theme focus:border-primary/50 focus:ring-4 focus:ring-primary/5 rounded-2xl px-4 py-3 outline-none transition-all font-medium text-sm"
                        />
                        <select 
                            value={inviteRole}
                            onChange={(e) => setInviteRole(e.target.value as 'client' | 'manager' | 'admin')}
                            className="bg-card/50 border border-border-theme rounded-2xl px-4 py-3 outline-none font-bold text-xs uppercase tracking-widest cursor-pointer"
                        >
                            <option value="client">Client</option>
                            <option value="manager">Manager</option>
                            <option value="admin">Admin</option>
                        </select>
                        <button 
                            type="submit"
                            disabled={loading}
                            className="bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/25 px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50"
                        >
                            <Send size={16} />
                            Пригласить
                        </button>
                    </form>
                </div>

                <button 
                    onClick={onRefresh}
                    disabled={loading}
                    className="p-3 bg-muted/50 hover:bg-muted text-muted-foreground hover:text-foreground rounded-2xl transition-all disabled:animate-spin"
                >
                    <RefreshCw size={20} />
                </button>
            </div>

            {/* Users Section */}
            <div className="space-y-6">
                <div className="flex items-center gap-3 px-1">
                    <div className="w-8 h-px bg-primary/30" />
                    <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-primary/60">Активные специалисты</h3>
                </div>
                <UserTable 
                    users={users}
                    handleUpdateRole={handleUpdateRole}
                    handleToggleBlock={handleToggleBlock}
                    handleDeleteUser={handleDeleteUser}
                />
            </div>

            {/* Invitations Section */}
            {invitations.length > 0 && (
                <div className="space-y-6">
                    <div className="flex items-center gap-3 px-1">
                        <div className="w-8 h-px bg-amber-500/30" />
                        <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-amber-500/60">Ожидают регистрации</h3>
                    </div>
                    <InvitationTable 
                        invitations={invitations}
                        copyInviteLink={copyInviteLink}
                        handleDeleteInvite={handleDeleteInvite}
                        copiedToken={copiedToken}
                    />
                </div>
            )}
        </div>
    );
};
