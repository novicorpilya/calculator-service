import React from 'react';
import { Briefcase, RefreshCw, Trash2, FolderSearch } from 'lucide-react';
import type { AdminCalculation } from '@/services/admin.service';

interface AdminProjectsListProps {
    projects: AdminCalculation[];
    onStatusReturn: (calcId: string, currentStatus: string) => void;
    onDelete: (calcId: string, orgName: string) => void;
}

export const AdminProjectsList: React.FC<AdminProjectsListProps> = ({ projects, onStatusReturn, onDelete }) => {
    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h3 className="text-xs font-black uppercase tracking-[0.3em] text-foreground/40 ml-2">
                Все сделки в системе ({projects.length})
            </h3>
            <div className="grid grid-cols-1 gap-4">
                {projects.length === 0 ? (
                    <div className="py-20 glass-card text-center opacity-30">
                        <FolderSearch size={40} className="mx-auto mb-4" />
                        <p className="text-[10px] font-black uppercase tracking-widest">
                            Проектов пока нет
                        </p>
                    </div>
                ) : (
                    projects.map((calc, index) => (
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
                                    onClick={() => onStatusReturn(calc.id, calc.status)}
                                    className="p-3 bg-card border border-border-theme hover:border-amber-500 text-foreground/20 hover:text-amber-500 rounded-xl transition-all"
                                    title="Вернуть статус назад"
                                >
                                    <RefreshCw size={18} />
                                </button>
                                <button
                                    onClick={() =>
                                        onDelete(calc.id, calc.organization_name)
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
};
