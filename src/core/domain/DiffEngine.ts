import type { InventoryItem, Calculation } from '@/core/types/calculation';

export interface DiffResult {
    added: InventoryItem[];
    removed: InventoryItem[];
    modified: {
        item: InventoryItem;
        oldQuantity: number;
        newQuantity: number;
        oldPrice: number;
        newPrice: number;
    }[];
    replaced: { oldItem: InventoryItem; newItem: InventoryItem }[];
    adjustments: { field: string; old: number; new: number }[];
}

/**
 * DiffEngine - Pure Domain logic for comparing versions of calculations.
 */
export class DiffEngine {
    static calculateDiff(current: Partial<Calculation>, base: Partial<Calculation>): DiffResult {
        const currentItems = current.results?.summary || [];
        const baseItems = base?.results?.summary || [];

        const diff: DiffResult = {
            added: [],
            removed: [],
            modified: [],
            replaced: [],
            adjustments: [],
        };

        const currentMap = new Map<string, InventoryItem>(
            currentItems.map((i: InventoryItem) => [i.sku || i.inventory, i])
        );
        const baseMap = new Map<string, InventoryItem>(
            baseItems.map((i: InventoryItem) => [i.sku || i.inventory, i])
        );

        const initialAdded: InventoryItem[] = [];
        const initialRemoved: InventoryItem[] = [];

        currentMap.forEach((item, id) => {
            const baseItem = baseMap.get(id);
            if (!baseItem) {
                initialAdded.push(item);
            } else if (baseItem.quantity !== item.quantity || baseItem.price !== item.price) {
                diff.modified.push({
                    item,
                    oldQuantity: baseItem.quantity,
                    newQuantity: item.quantity,
                    oldPrice: baseItem.price,
                    newPrice: item.price,
                });
            }
        });

        baseMap.forEach((item, id) => {
            if (!currentMap.has(id)) {
                initialRemoved.push(item);
            }
        });

        if (initialAdded.length === 1 && initialRemoved.length === 1) {
            diff.replaced.push({ oldItem: initialRemoved[0], newItem: initialAdded[0] });
        } else {
            diff.added = initialAdded;
            diff.removed = initialRemoved;
        }

        // Adjustments Comparison
        const currentAdj = (current.manager_adjustments as Record<string, number>) || {};
        const baseWithLegacy = base as Partial<Calculation> & {
            adjustments?: Record<string, number>;
        };
        const baseAdj =
            ((baseWithLegacy.adjustments || base.manager_adjustments) as Record<string, number>) ||
            {};
        const fields = ['global_margin', 'delivery_cost', 'service_cost'];

        fields.forEach((f) => {
            const oldVal = baseAdj[f] ?? (f === 'global_margin' ? 1.0 : 0);
            const newVal = currentAdj[f] ?? (f === 'global_margin' ? 1.0 : 0);
            if (oldVal !== newVal) diff.adjustments.push({ field: f, old: oldVal, new: newVal });
        });

        return diff;
    }

    static getSummary(diff: DiffResult): string {
        const parts: string[] = [];
        if (diff.replaced.length > 0) parts.push(`Замена ${diff.replaced.length} поз.`);
        if (diff.added.length > 0) parts.push(`Добавлено ${diff.added.length} поз.`);
        if (diff.removed.length > 0) parts.push(`Удалено ${diff.removed.length} поз.`);
        if (diff.modified.length > 0) parts.push(`Изменено ${diff.modified.length} поз.`);
        if (diff.adjustments.length > 0) parts.push(`Цены обновлены`);

        return parts.join('; ') || 'Изменений нет';
    }
}
