import React from 'react';
import { 
    UserIcon, 
    Shield, 
    Trash2, 
    Crown,
    UserCheck,
    Ban
} from 'lucide-react';
import type { User } from '@/features/auth/auth.types';

interface UserTableProps {
    users: (User & { projectsCount: number })[];
    handleUpdateRole: (userId: string, currentRole: string) => void;
    handleToggleBlock: (user: User) => void;
    handleDeleteUser: (user: User) => void;
}

export const UserTable: React.FC<UserTableProps> = ({ 
    users, 
    handleUpdateRole, 
    handleToggleBlock, 
    handleDeleteUser 
}) => {
    return (
        <div className="overflow-x-auto">
            <table className="w-full text-left border-separate border-spacing-y-2">
                <thead>
                    <tr className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/50">
                        <th className="px-6 pb-4">Пользователь</th>
                        <th className="px-6 pb-4">Роль</th>
                        <th className="px-6 pb-4 text-center">Проекты</th>
                        <th className="px-6 pb-4 text-right">Управление</th>
                    </tr>
                </thead>
                <tbody>
                    {users.map((user) => (
                        <tr key={user.id} className="group bg-card/50 hover:bg-card border border-border-theme transition-all">
                            <td className="px-6 py-4 rounded-l-[1.5rem] border-y border-l border-border-theme/40">
                                <div className="flex items-center gap-4">
                                    <div className={`p-3 rounded-2xl ${user.status === 'blocked' ? 'bg-red-500/10 text-red-500' : 'bg-primary/10 text-primary'} transition-colors`}>
                                        <UserIcon size={20} />
                                    </div>
                                    <div>
                                        <div className="font-bold text-sm flex items-center gap-2">
                                            {user.email}
                                            {user.status === 'blocked' && (
                                                <span className="bg-red-500 text-white text-[8px] px-1.5 py-0.5 rounded-full uppercase font-black tracking-widest">Blocked</span>
                                            )}
                                        </div>
                                        <div className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">{user.id.slice(0, 8)}...</div>
                                    </div>
                                </div>
                            </td>
                            <td className="px-6 py-4 border-y border-border-theme/40">
                                <button 
                                    onClick={() => handleUpdateRole(user.id, user.role)}
                                    className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-muted/50 hover:bg-primary/10 hover:text-primary transition-all text-[10px] font-black uppercase tracking-widest group"
                                >
                                    {user.role === 'admin' ? <Crown size={12} className="text-amber-500" /> : 
                                     user.role === 'manager' ? <UserCheck size={12} /> : <Shield size={12} />}
                                    {user.role}
                                </button>
                            </td>
                            <td className="px-6 py-4 border-y border-border-theme/40 text-center">
                                <span className="bg-muted px-3 py-1 rounded-lg text-xs font-black">{user.projectsCount || 0}</span>
                            </td>
                            <td className="px-6 py-4 rounded-r-[1.5rem] border-y border-r border-border-theme/40 text-right">
                                <div className="flex items-center justify-end gap-2">
                                    <button 
                                        onClick={() => handleToggleBlock(user)}
                                        className={`p-2 rounded-xl transition-all ${user.status === 'blocked' ? 'bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500 hover:text-white' : 'hover:bg-amber-500/10 text-amber-500 hover:bg-amber-500 hover:text-white'}`}
                                        title={user.status === 'blocked' ? 'Разблокировать' : 'Заблокировать'}
                                    >
                                        <Ban size={16} />
                                    </button>
                                    <button 
                                        onClick={() => handleDeleteUser(user)}
                                        className="p-2 hover:bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white rounded-xl transition-all"
                                        title="Удалить пользователя"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};
