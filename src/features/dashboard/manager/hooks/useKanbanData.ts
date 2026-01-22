import { useMemo } from 'react';
import { usePaginatedCalculations } from '../../hooks/usePaginatedCalculations';
import { type Calculation, type CalculationStatus } from '../../dashboard.types';

export type KanbanColumnId =
    | 'lead'
    | 'expert'
    | 'changes'
    | 'billing'
    | 'payment_check'
    | 'production'
    | 'warehouse'
    | 'shipping'
    | 'done'
    | 'archive';

export interface KanbanColumn {
    id: KanbanColumnId;
    title: string;
    items: Calculation[];
    color: string;
}

const STATUS_MAP: Record<CalculationStatus, KanbanColumnId> = {
    draft: 'lead',
    sent: 'lead',
    expert: 'expert',
    changes: 'changes',
    revision: 'changes',
    invoice: 'billing',
    payment_review: 'payment_check',
    payment_rejected: 'payment_check',
    paid: 'production',
    processing: 'production',
    sent_to_warehouse: 'warehouse',
    ready: 'shipping',
    shipping: 'shipping',
    completed: 'done',
    closed: 'archive',
};

const COLUMN_CONFIG: { id: KanbanColumnId; title: string; color: string }[] = [
    { id: 'lead', title: 'Входящие', color: 'bg-blue-500/10 text-blue-600' },
    { id: 'expert', title: 'Экспертиза', color: 'bg-indigo-500/10 text-indigo-600' },
    { id: 'changes', title: 'Правки', color: 'bg-orange-500/10 text-orange-600' },
    { id: 'billing', title: 'Счета', color: 'bg-purple-500/10 text-purple-600' },
    { id: 'payment_check', title: 'Проверка оплаты', color: 'bg-cyan-500/10 text-cyan-600' },
    { id: 'production', title: 'В сборке', color: 'bg-teal-500/10 text-teal-600' },
    { id: 'warehouse', title: 'На складе', color: 'bg-sky-500/10 text-sky-600' },
    { id: 'shipping', title: 'Отгрузка', color: 'bg-violet-500/10 text-violet-600' },
    { id: 'done', title: 'Завершено', color: 'bg-emerald-500/10 text-emerald-600' },
    { id: 'archive', title: 'Архив', color: 'bg-slate-500/10 text-slate-600' },
];

export function useKanbanData(userId?: string) {
    // Kanban uses a larger page size to show more cards at once (e.g. 100)
    const paginated = usePaginatedCalculations(userId, 100);

    const columns = useMemo(() => {
        const grouped: Record<KanbanColumnId, Calculation[]> = {
            lead: [],
            expert: [],
            changes: [],
            billing: [],
            payment_check: [],
            production: [],
            warehouse: [],
            shipping: [],
            done: [],
            archive: [],
        };

        paginated.calculations.forEach((calc) => {
            const columnId = STATUS_MAP[calc.status] || 'lead';
            grouped[columnId].push(calc);
        });

        return COLUMN_CONFIG.map((config) => ({
            ...config,
            items: grouped[config.id],
        }));
    }, [paginated.calculations]);

    return {
        ...paginated,
        columns,
        columnConfig: COLUMN_CONFIG,
    };
}
