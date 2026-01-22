import React from 'react';
import { Draggable, type DraggableProvided, type DraggableStateSnapshot } from '@hello-pangea/dnd';
import { Building2, MessageSquare, Clock, ChevronRight } from 'lucide-react';
import { type Calculation } from '@/features/dashboard/dashboard.types';
import { CalculationEntity } from '@/core/domain/CalculationEntity';
import { CalculationViewModel } from '@/features/dashboard/presentation/CalculationViewModel';
import { cn } from '@/lib/utils';

interface KanbanCardProps {
    calculation: Calculation;
    index: number;
    onClick: () => void;
}

export const KanbanCard: React.FC<KanbanCardProps> = ({ calculation, index, onClick }) => {
    const vm = React.useMemo(
        () => new CalculationViewModel(new CalculationEntity(calculation)),
        [calculation]
    );

    // SLA Status logic (simplified for UI)
    const isOverdue = vm.isOverdue;
    const hasUnread = vm.unreadCommentsCount > 0;

    return (
        <Draggable draggableId={String(calculation.id)} index={index}>
            {(provided: DraggableProvided, snapshot: DraggableStateSnapshot) => (
                <div
                    ref={provided.innerRef}
                    {...provided.draggableProps}
                    {...provided.dragHandleProps}
                    onClick={onClick}
                    className={cn(
                        'group relative bg-white border border-border-theme/50 rounded-2xl p-4 mb-3 transition-all duration-300 hover:shadow-xl hover:shadow-primary/5 hover:border-primary/30 cursor-grab active:cursor-grabbing',
                        snapshot.isDragging &&
                            'shadow-2xl shadow-primary/20 border-primary ring-2 ring-primary/20 rotate-1 z-50',
                        isOverdue && !vm.isCompleted && 'border-red-200'
                    )}
                >
                    {/* Urgency Line */}
                    {isOverdue && !vm.isCompleted && (
                        <div className="absolute top-0 left-4 right-4 h-0.5 bg-red-500 rounded-full animate-pulse" />
                    )}

                    {/* Header */}
                    <div className="flex justify-between items-start gap-3 mb-3">
                        <div className="flex-1 min-w-0">
                            <h4 className="font-bold text-sm text-foreground/90 truncate group-hover:text-primary transition-colors">
                                {vm.organizationName}
                            </h4>
                            <div className="flex items-center gap-2 mt-1">
                                <span className="text-[10px] font-black uppercase tracking-widest text-foreground/30 px-1.5 py-0.5 bg-muted rounded">
                                    #{calculation.project_number || '---'}
                                </span>
                                <div className="flex items-center gap-1 text-[10px] text-foreground/40 italic">
                                    <Building2 size={10} />
                                    <span className="truncate max-w-[80px]">
                                        {calculation.type || 'Проект'}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Status Pulse for small screens or context */}
                        <div
                            className={cn(
                                'w-2 h-2 rounded-full',
                                vm.statusConfig.color.replace('text-', 'bg-')
                            )}
                        />
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-2 gap-3 mb-4">
                        <div className="space-y-0.5">
                            <p className="text-[9px] font-bold text-foreground/30 uppercase tracking-tighter">
                                Бюджет
                            </p>
                            <p className="text-xs font-black text-foreground/80">
                                {vm.totalCostDisplay}
                            </p>
                        </div>
                        <div className="space-y-0.5">
                            <p className="text-[9px] font-bold text-foreground/30 uppercase tracking-tighter">
                                Срок (SLA)
                            </p>
                            <div
                                className={cn(
                                    'flex items-center gap-1 text-xs font-bold',
                                    isOverdue ? 'text-red-500' : 'text-foreground/70'
                                )}
                            >
                                <Clock size={10} />
                                <span>
                                    {vm.slaDeadline
                                        ? new Date(vm.slaDeadline).toLocaleDateString()
                                        : '---'}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Footer / Meta */}
                    <div className="flex items-center justify-between pt-3 border-t border-border-theme/30">
                        <div className="flex -space-x-2">
                            {/* Manager Avatar Placeholder or actual if available */}
                            <div className="w-6 h-6 rounded-full bg-primary/10 border-2 border-white flex items-center justify-center text-[10px] font-bold text-primary">
                                {vm.managerName?.charAt(0) || 'M'}
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            {hasUnread && (
                                <div className="flex items-center gap-1 px-1.5 py-0.5 bg-red-500 rounded-full text-[9px] font-bold text-white animate-bounce">
                                    <MessageSquare size={10} fill="currentColor" />
                                    <span>{vm.unreadCommentsCount}</span>
                                </div>
                            )}
                            <div className="text-foreground/30 group-hover:translate-x-1 transition-transform">
                                <ChevronRight size={14} />
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </Draggable>
    );
};
