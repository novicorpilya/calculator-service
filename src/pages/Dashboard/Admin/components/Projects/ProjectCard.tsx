import React from 'react';
import { 
    Wallet, 
    Calendar, 
    Building2, 
    UserCog, 
    RefreshCw, 
    Trash2, 
    CheckCircle2 
} from 'lucide-react';
import type { AdminCalculation } from '@/services/admin.service';
import type { User } from '@/features/auth/auth.types';

interface ProjectCardProps {
    calc: AdminCalculation;
    managers: User[];
    selected: boolean;
    onToggleSelect: (id: string) => void;
    onStatusReturn: (calcId: string, currentStatus: string) => void;
    onDelete: (calcId: string, orgName: string) => void;
    onAssignManager: (calcId: string, managerId: string | null) => void;
}

export const ProjectCard: React.FC<ProjectCardProps> = ({ 
    calc, 
    managers, 
    selected,
    onToggleSelect,
    onStatusReturn,
    onDelete,
    onAssignManager 
}) => {
    const updatedAt = new Date(calc.updated_at);
    const isStuck = calc.status === 'expert' && 
                  (new Date().getTime() - updatedAt.getTime() > 48 * 60 * 60 * 1000);

    return (
        <div
            className={`group bg-card hover:bg-card/80 border border-border-theme rounded-[2.5rem] p-6 transition-all duration-300 hover:shadow-2xl hover:shadow-black/5 flex flex-col relative overflow-hidden ${
                selected ? 'ring-2 ring-primary border-primary/50' : ''
            }`}
        >
            {/* Header */}
            <div className="flex justify-between items-start mb-6 z-10 relative">
                <div className="flex items-start gap-3 flex-1 min-w-0 pr-4">
                    <div 
                        className="mt-1 cursor-pointer"
                        onClick={(e) => {
                            e.stopPropagation();
                            onToggleSelect(calc.id);
                        }}
                    >
                        <div className={`w-5 h-5 rounded-lg border flex items-center justify-center transition-all ${selected ? 'bg-primary border-primary text-white' : 'border-muted-foreground/30 bg-muted/20 hover:border-primary/50'}`}>
                            {selected && <CheckCircle2 size={12} strokeWidth={4} />}
                        </div>
                    </div>
                    <div className="min-w-0">
                        <h3 className="font-bold text-lg leading-tight truncate mb-1" title={calc.organization_name}>
                            {calc.organization_name}
                        </h3>
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <Building2 size={12} />
                            <span className="truncate max-w-[150px]">{calc.id.slice(0,8)}...</span>
                        </div>
                    </div>
                </div>
                
                <div className={`px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 shadow-sm ${
                    calc.status === 'completed' ? 'bg-primary text-white' : 
                    calc.status === 'expert' ? 'bg-indigo-500 text-white' :
                    'bg-muted text-muted-foreground'
                }`}>
                    {calc.status}
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-3 mb-6 relative z-10">
                <div className="bg-muted/30 rounded-2xl p-3 border border-white/5">
                    <div className="flex items-center gap-2 opacity-50 mb-1">
                        <Wallet size={12} />
                        <span className="text-[9px] font-black uppercase tracking-widest">Бюджет</span>
                    </div>
                    <span className={`text-sm font-black ${calc.results?.totalAnnualBudget ? 'text-foreground' : 'opacity-30'}`}>
                        {calc.results?.totalAnnualBudget 
                            ? new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'RUB', maximumFractionDigits: 0 }).format(calc.results.totalAnnualBudget)
                            : '—'}
                    </span>
                </div>
                <div className="bg-muted/30 rounded-2xl p-3 border border-white/5">
                    <div className="flex items-center gap-2 opacity-50 mb-1">
                        <Calendar size={12} />
                        <span className="text-[9px] font-black uppercase tracking-widest">Дата</span>
                    </div>
                    <span className="text-sm font-bold">
                        {new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'short' }).format(new Date(calc.created_at))}
                    </span>
                </div>
            </div>

            {isStuck && (
                <div className="mb-6 px-4 py-2 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-3 text-red-500 text-xs font-bold animate-pulse z-10">
                    <div className="w-2 h-2 rounded-full bg-red-500" />
                    Внимание: Завис на проверке (&gt;48ч)
                </div>
            )}

            {/* Footer */}
            <div className="mt-auto pt-6 border-t border-border-theme/50 relative z-10 space-y-4">
                <div className={`relative flex items-center gap-3 p-1 pl-3 rounded-xl border transition-all ${
                    !calc.manager_id 
                        ? 'bg-amber-500/5 border-amber-500/30' 
                        : 'bg-muted/30 border-transparent hover:bg-muted/50'
                }`}>
                    <UserCog size={14} className={!calc.manager_id ? 'text-amber-500' : 'text-muted-foreground'} />
                    <select
                        className="w-full bg-transparent text-xs font-bold outline-none cursor-pointer py-2 appearance-none"
                        value={calc.manager_id || ''}
                        onChange={(e) => onAssignManager(calc.id, e.target.value || null)}
                    >
                        <option value="">Назначить менеджера</option>
                        {managers.map(m => (
                            <option key={m.id} value={m.id}>
                                {m.firstName ? `${m.firstName} (${m.role})` : m.email}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        onClick={() => onStatusReturn(calc.id, calc.status)}
                        className="flex-1 py-2.5 bg-card border border-border-theme hover:border-amber-500 text-foreground/40 hover:text-amber-500 rounded-xl transition-all shadow-sm active:scale-95 flex items-center justify-center gap-2"
                    >
                        <RefreshCw size={14} />
                        <span className="text-[10px] font-bold uppercase tracking-wider">Откатить</span>
                    </button>
                    <button
                        onClick={() => onDelete(calc.id, calc.organization_name)}
                        className="p-2.5 bg-card border border-border-theme hover:border-red-500 text-foreground/40 hover:text-red-500 rounded-xl transition-all shadow-sm active:scale-95"
                    >
                        <Trash2 size={16} />
                    </button>
                </div>
            </div>
        </div>
    );
};
