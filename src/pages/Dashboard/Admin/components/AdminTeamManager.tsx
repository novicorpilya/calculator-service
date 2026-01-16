import React from 'react';
import { Mail, RefreshCw, User as UserIcon, ArrowRightLeft, Shield, Trash2, Check, Copy } from 'lucide-react';
import type { User } from '@/features/auth/auth.types';
import type { Invitation } from '@/services/admin.service';

interface AdminTeamManagerProps {
    users: User[];
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
                            onClick={onRefresh}
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
};
