import React from 'react';
import { 
    Mail, 
    Copy, 
    Check, 
    Trash2 
} from 'lucide-react';
import type { Invitation } from '@/services/admin.service';

interface InvitationTableProps {
    invitations: Invitation[];
    copyInviteLink: (token: string) => void;
    handleDeleteInvite: (id: string) => void;
    copiedToken: string | null;
}

export const InvitationTable: React.FC<InvitationTableProps> = ({ 
    invitations, 
    copyInviteLink, 
    handleDeleteInvite, 
    copiedToken 
}) => {
    return (
        <div className="overflow-x-auto">
            <table className="w-full text-left border-separate border-spacing-y-2">
                <thead>
                    <tr className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/50">
                        <th className="px-6 pb-4">Email</th>
                        <th className="px-6 pb-4">Роль</th>
                        <th className="px-6 pb-4">Статус</th>
                        <th className="px-6 pb-4 text-right">Управление</th>
                    </tr>
                </thead>
                <tbody>
                    {invitations.map((invite) => (
                        <tr key={invite.id} className="group bg-card/50 hover:bg-card border border-border-theme transition-all">
                            <td className="px-6 py-4 rounded-l-[1.5rem] border-y border-l border-border-theme/40">
                                <div className="flex items-center gap-4">
                                    <div className="p-3 bg-muted rounded-2xl text-muted-foreground">
                                        <Mail size={18} />
                                    </div>
                                    <span className="font-bold text-sm tracking-tight">{invite.email}</span>
                                </div>
                            </td>
                            <td className="px-6 py-4 border-y border-border-theme/40">
                                <span className="bg-muted px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                                    {invite.role}
                                </span>
                            </td>
                            <td className="px-6 py-4 border-y border-border-theme/40">
                                <span className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest ${
                                    invite.status === 'pending' ? 'bg-amber-500/10 text-amber-500' : 
                                    invite.status === 'used' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'
                                }`}>
                                    {invite.status}
                                </span>
                            </td>
                            <td className="px-6 py-4 rounded-r-[1.5rem] border-y border-r border-border-theme/40 text-right">
                                <div className="flex items-center justify-end gap-2">
                                    <button 
                                        onClick={() => copyInviteLink(invite.token)}
                                        className="p-2 hover:bg-primary/10 text-primary rounded-xl transition-all"
                                        title="Копировать токен"
                                    >
                                        {copiedToken === invite.token ? <Check size={16} /> : <Copy size={16} />}
                                    </button>
                                    <button 
                                        onClick={() => handleDeleteInvite(invite.id)}
                                        className="p-2 hover:bg-red-500/10 text-red-500 rounded-xl transition-all"
                                        title="Удалить приглашение"
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
