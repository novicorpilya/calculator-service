import React from 'react';
import { Briefcase, Calendar, ArrowUpRight, MessageSquare, Inbox } from 'lucide-react';
import { type Calculation } from '../../../dashboard.types';
import { ModernStatusBadge } from '../../../components/ModernStatusBadge';
import { CalculationViewModel } from '@/features/dashboard/presentation/CalculationViewModel';

interface CalculationRowProps {
    vm: CalculationViewModel;
    index: number;
    unreadCount: number;
    onSelect: (calc: Calculation) => void;
}

export const CalculationRow = React.memo<CalculationRowProps>(
    ({ vm, index, unreadCount, onSelect }) => {
        const isUnassigned = !vm.managerId;

        return (
            <div
                onClick={() => onSelect(vm.rawData)}
                className="group relative bg-card border border-border-theme p-4 rounded-[2rem] hover:border-primary/40 hover:shadow-2xl transition-all cursor-pointer flex items-center justify-between gap-8 overflow-hidden"
            >
                <div
                    className={`absolute left-0 top-0 bottom-0 w-1.5 transition-colors ${isUnassigned ? 'bg-orange-500/40' : 'bg-primary/40'} opacity-0 group-hover:opacity-100`}
                />

                <div className="flex items-center gap-6 flex-1 min-w-0 relative z-10">
                    <div
                        className={`w-12 h-12 rounded-2xl flex flex-col items-center justify-center shrink-0 border transition-colors ${
                            isUnassigned
                                ? 'bg-orange-500/10 text-orange-500 border-orange-500/10 group-hover:bg-orange-500 group-hover:text-white'
                                : 'bg-primary/10 text-primary border-primary/10 group-hover:bg-primary group-hover:text-white'
                        }`}
                    >
                        {isUnassigned ? <Inbox size={20} /> : <Briefcase size={20} />}
                        <span className="text-[7px] font-black uppercase tracking-tighter">
                            #{String(index + 1).padStart(3, '0')}
                        </span>
                    </div>

                    <div className="min-w-0 flex-1">
                        <h4 className="text-xl font-black uppercase tracking-tighter truncate mb-1 group-hover:text-primary transition-colors">
                            {vm.organizationName}
                        </h4>
                        <div className="flex flex-wrap items-center gap-4">
                            <span className="flex items-center gap-1.5 text-[9px] font-black text-foreground/50 uppercase tracking-[0.2em]">
                                <Calendar size={12} className="text-primary/40" />{' '}
                                {vm.formattedDate}
                            </span>
                            <span className="w-1 h-1 bg-foreground/10 rounded-full" />
                            <span className="text-[9px] font-black text-primary uppercase tracking-[0.2em] bg-primary/5 px-2 py-0.5 rounded-lg">
                                {vm.type || 'Объект'}
                            </span>
                            <span className="w-1 h-1 bg-foreground/10 rounded-full" />
                            <span className="text-[9px] font-black text-foreground/40 uppercase tracking-[0.2em]">
                                {vm.totalArea} м²
                            </span>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-10 text-right shrink-0 relative z-10">
                    {unreadCount > 0 && (
                        <div className="flex items-center gap-2 px-3 py-1.5 bg-primary text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-primary/20 animate-bounce-subtle">
                            <MessageSquare size={14} /> {unreadCount}
                        </div>
                    )}

                    <div className="scale-110">
                        <ModernStatusBadge status={vm.status} />
                    </div>

                    <div className="w-32">
                        <p className="text-2xl font-black tracking-tighter leading-none group-hover:text-primary transition-colors">
                            {vm.totalCostDisplay}
                        </p>
                    </div>

                    <div className="w-10 h-10 rounded-xl bg-primary/5 text-primary flex items-center justify-center opacity-0 group-hover:opacity-100 group-hover:scale-110 transition-all duration-500">
                        <ArrowUpRight
                            size={20}
                            className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform"
                        />
                    </div>
                </div>
            </div>
        );
    }
);

CalculationRow.displayName = 'CalculationRow';
