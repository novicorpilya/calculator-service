import React from 'react';
import { Droppable, type DroppableProvided, type DroppableStateSnapshot } from '@hello-pangea/dnd';
import { KanbanCard } from './KanbanCard';
import { type Calculation } from '@/features/dashboard/dashboard.types';
import { cn } from '@/lib/utils';
import { MoreHorizontal, Plus } from 'lucide-react';

interface KanbanColumnProps {
    id: string;
    title: string;
    items: Calculation[];
    color: string;
    onCardClick: (calc: Calculation) => void;
}

export const KanbanColumn: React.FC<KanbanColumnProps> = ({
    id,
    title,
    items,
    color,
    onCardClick,
}) => {
    return (
        <div className="flex flex-col w-[320px] min-w-[320px] h-full rounded-3xl bg-slate-50/50 border border-slate-200/50 p-4 transition-colors">
            {/* Header */}
            <div className="flex items-center justify-between mb-4 px-2">
                <div className="flex items-center gap-2">
                    <div
                        className={cn(
                            'w-2.5 h-2.5 rounded-full shadow-[0_0_8px_rgba(0,0,0,0.1)]',
                            color.split(' ')[0].replace('bg-', 'bg-')
                        )}
                    />
                    <h3 className="text-sm font-black uppercase tracking-widest text-foreground/70">
                        {title}
                        <span className="ml-2 text-foreground/30 font-bold">{items.length}</span>
                    </h3>
                </div>
                <button className="p-1 hover:bg-white rounded-lg transition-colors text-foreground/30 hover:text-foreground">
                    <MoreHorizontal size={16} />
                </button>
            </div>

            {/* Droppable Area */}
            <Droppable droppableId={id}>
                {(provided: DroppableProvided, snapshot: DroppableStateSnapshot) => (
                    <div
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        className={cn(
                            'flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar pr-1 min-h-[150px] transition-colors duration-200 rounded-2xl',
                            snapshot.isDraggingOver &&
                                'bg-primary/5 ring-2 ring-primary/10 ring-inset'
                        )}
                    >
                        {items.map((item, index) => (
                            <KanbanCard
                                key={item.id}
                                calculation={item}
                                index={index}
                                onClick={() => onCardClick(item)}
                            />
                        ))}
                        {provided.placeholder}

                        {/* Empty State / Add Card Placeholder */}
                        {items.length === 0 && !snapshot.isDraggingOver && (
                            <div className="flex flex-col items-center justify-center py-10 border-2 border-dashed border-slate-200 rounded-3xl text-foreground/20 italic text-xs">
                                <Plus size={24} className="mb-2 opacity-50" />
                                <span>Пусто</span>
                            </div>
                        )}
                    </div>
                )}
            </Droppable>

            <style>{`
                .custom-scrollbar::-webkit-scrollbar {
                    width: 4px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: rgba(0,0,0,0.05);
                    border-radius: 10px;
                }
                .custom-scrollbar:hover::-webkit-scrollbar-thumb {
                    background: rgba(0,0,0,0.1);
                }
            `}</style>
        </div>
    );
};
