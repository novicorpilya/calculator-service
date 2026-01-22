import React from 'react';
import { DragDropContext, type DropResult } from '@hello-pangea/dnd';
import { KanbanColumn } from './KanbanColumn';
import {
    useKanbanData,
    type KanbanColumnId,
} from '@/features/dashboard/manager/hooks/useKanbanData';
import { useCalculationActions } from '@/features/dashboard/hooks/useCalculations';
import { type Calculation, type CalculationStatus } from '@/features/dashboard/dashboard.types';
import { Loader2 } from 'lucide-react';

interface KanbanBoardProps {
    userId: string;
    onViewProject: (calc: Calculation) => void;
}

// Map column drop to a primary status
const COLUMN_DROP_STATUS: Record<KanbanColumnId, CalculationStatus> = {
    lead: 'sent',
    expert: 'expert',
    changes: 'changes',
    billing: 'invoice',
    payment_check: 'payment_review',
    production: 'processing',
    warehouse: 'sent_to_warehouse',
    shipping: 'shipping',
    done: 'completed',
    archive: 'closed',
};

// Columns that require button action, not drag-and-drop
const LOCKED_DROP_TARGETS: KanbanColumnId[] = [
    'production', // В сборке - только через кнопку "Комплектация"
    'warehouse', // На складе - только через кнопку
    'shipping', // Отгрузка - только через кнопку
    'done', // Завершено - только через кнопку
    'archive', // Архив - только через кнопку
];

export const KanbanBoard: React.FC<KanbanBoardProps> = ({ userId, onViewProject }) => {
    const { columns, isLoading, isFetching } = useKanbanData(userId);
    const { updateStatus } = useCalculationActions();

    const handleDragEnd = async (result: DropResult) => {
        const { destination, source, draggableId } = result;

        if (!destination) return;
        if (destination.droppableId === source.droppableId && destination.index === source.index)
            return;

        // Block drops to locked columns (require explicit button action)
        const targetColumn = destination.droppableId as KanbanColumnId;
        if (LOCKED_DROP_TARGETS.includes(targetColumn)) {
            // Optionally show a toast notification here
            console.warn(
                `Перемещение в "${targetColumn}" доступно только через кнопку действия в проекте.`
            );
            return;
        }

        const newStatus = COLUMN_DROP_STATUS[targetColumn];

        // Find the project to check if it needs assignment
        const allItems = columns.flatMap((c) => c.items);
        const project = allItems.find((c) => String(c.id) === draggableId);

        // If project is unassigned, assign it to the current manager automatically
        const updates: Partial<Calculation> = {};
        if (project && !project.manager_id) {
            updates.manager_id = userId;
        }

        // Trigger optimistic update via existing hook
        updateStatus.mutate({
            id: draggableId,
            status: newStatus,
            updates,
        });
    };

    if (isLoading && !isFetching) {
        return (
            <div className="flex h-96 items-center justify-center">
                <Loader2 className="animate-spin text-primary" size={48} />
            </div>
        );
    }

    return (
        <DragDropContext onDragEnd={handleDragEnd}>
            <div className="flex items-start gap-6 h-[calc(100vh-280px)] overflow-x-auto pb-6 custom-kanban-scroll">
                {columns.map((col) => (
                    <KanbanColumn
                        key={col.id}
                        id={col.id}
                        title={col.title}
                        items={col.items}
                        color={col.color}
                        onCardClick={onViewProject}
                    />
                ))}
            </div>

            <style>{`
                .custom-kanban-scroll::-webkit-scrollbar {
                    height: 8px;
                }
                .custom-kanban-scroll::-webkit-scrollbar-track {
                    background: rgba(0,0,0,0.02);
                    border-radius: 10px;
                }
                .custom-kanban-scroll::-webkit-scrollbar-thumb {
                    background: rgba(0,0,0,0.05);
                    border-radius: 10px;
                }
            `}</style>
        </DragDropContext>
    );
};
