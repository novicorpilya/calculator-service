import React from 'react';
import {
    Briefcase,
    Calendar,
    ArrowUpRight,
    MessageSquare,
    Inbox,
} from 'lucide-react';
import { type Calculation } from '../../../dashboard.types';
import { ModernStatusBadge } from '../../../components/ModernStatusBadge';
import { CalculationViewModel } from '@/features/dashboard/presentation/CalculationViewModel';
import { STATUS_UI_CONFIG } from '../../../constants/status.constants';

interface CalculationCardProps {
    vm: CalculationViewModel;
    index: number;
    unreadCount: number;
    onSelect: (calc: Calculation) => void;
}

export const CalculationCard = React.memo<CalculationCardProps>(({ vm, index, unreadCount, onSelect }) => {
    const statusConfig = STATUS_UI_CONFIG[vm.status] || STATUS_UI_CONFIG.draft;
    const statusBg = statusConfig.bg;
    const isUnassigned = !vm.managerId;

    return (
        <div
            onClick={() => onSelect(vm.rawData)}
            className={`
                group relative glass-card p-8 rounded-[3rem] cursor-pointer transition-all duration-500
                hover:-translate-y-2 hover:shadow-2xl border-border-theme/60 overflow-hidden flex flex-col justify-between h-full
            `}
        >
            {/* Status Accent Bar */}
            <div className={`absolute top-0 left-0 right-0 h-1.5 ${statusBg.replace('/10', '/40').replace('/5', '/20')} opacity-40 group-hover:opacity-100 transition-opacity`} />
            
            {/* ID Watermark */}
            <div className="absolute -right-4 top-0 text-[6rem] font-black text-foreground/[0.03] select-none pointer-events-none italic leading-none transition-transform duration-1000 group-hover:scale-110 group-hover:-translate-x-6">
                {String(index + 1).padStart(3, '0')}
            </div>

            <div className="relative z-10">
                <div className="flex justify-between items-start mb-8">
                    <div className="flex items-center gap-3">
                        <div
                            className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-500 border shadow-sm ${
                                isUnassigned 
                                    ? 'bg-orange-500/10 text-orange-500 border-orange-500/20 group-hover:bg-orange-500 group-hover:text-white' 
                                    : 'bg-primary/10 text-primary border-primary/10 group-hover:bg-primary group-hover:text-white'
                            }`}
                        >
                            {isUnassigned ? <Inbox size={22} /> : <Briefcase size={22} />}
                        </div>
                        <div className="flex flex-col">
                            <span className={`text-[8px] font-black uppercase tracking-[0.2em] ${isUnassigned ? 'text-orange-500/60' : 'text-foreground/30'}`}>
                                {isUnassigned ? 'Входящий' : 'В работе'}
                            </span>
                            <span className="text-[10px] font-black uppercase tracking-widest text-foreground/40 group-hover:text-foreground/60 transition-colors">
                                Проект #{String(index + 1).padStart(3, '0')}
                            </span>
                        </div>
                    </div>
                    <ModernStatusBadge status={vm.status} />
                </div>

                <div className="space-y-4 mb-8">
                    <div className="space-y-1">
                        <div className="flex items-center gap-2">
                             <span className="text-[9px] font-black text-primary uppercase tracking-[0.2em] bg-primary/5 px-3 py-1 rounded-lg border border-primary/10">
                                {vm.type || 'Объект'}
                            </span>
                        </div>
                        <h3 className="text-2xl font-black tracking-tighter leading-[1.1] group-hover:text-primary transition-colors duration-300">
                            {vm.organizationName}
                        </h3>
                    </div>

                    <div className="flex items-center gap-4 text-[10px] font-black text-foreground/30 uppercase tracking-widest">
                        <div className="flex items-center gap-1.5">
                            <Calendar size={12} className="text-primary/40 group-hover:text-primary transition-colors" />
                            <span>{vm.formattedDate}</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="relative z-10">
                <div className="grid grid-cols-2 gap-6 py-6 border-y border-border-theme/40 relative">
                    <div className="space-y-1">
                        <p className="text-[8px] font-black text-foreground/30 uppercase tracking-[0.2em]">Бюджет</p>
                        <p className={`text-xl font-black tracking-tighter ${vm.totalCost ? 'text-foreground' : 'text-foreground/20'}`}>
                            {vm.totalCostDisplay}
                        </p>
                    </div>
                    <div className="space-y-1 text-right">
                        <p className="text-[8px] font-black text-foreground/30 uppercase tracking-[0.2em]">Площадь</p>
                        <p className="text-xl font-black tracking-tighter">
                            {vm.totalArea} <span className="text-[10px] text-foreground/20 uppercase">м²</span>
                        </p>
                    </div>
                </div>

                <div className="mt-6 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        {unreadCount > 0 ? (
                            <div className="flex items-center gap-2 px-3 py-1.5 bg-primary text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-primary/20 animate-bounce-subtle">
                                <MessageSquare size={12} /> {unreadCount}
                            </div>
                        ) : (
                            <div className="flex items-center gap-2 text-foreground/20 text-[10px] font-black uppercase tracking-widest">
                                <MessageSquare size={12} /> 0
                            </div>
                        )}
                    </div>
                    
                    <div className="flex items-center gap-3 px-6 py-2.5 rounded-2xl bg-primary/5 text-primary text-[10px] font-black uppercase tracking-[0.2em] group-hover:bg-primary group-hover:text-white transition-all duration-500">
                        <span>Детали</span>
                        <ArrowUpRight size={16} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                    </div>
                </div>
            </div>
            
            {/* Unassigned Glow Overlay */}
            {isUnassigned && (
                <div className="absolute inset-0 bg-gradient-to-br from-orange-500/[0.03] to-transparent pointer-events-none" />
            )}
        </div>
    );
});

CalculationCard.displayName = 'CalculationCard';
