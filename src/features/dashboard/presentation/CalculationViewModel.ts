import { CalculationEntity } from '@/core/domain/CalculationEntity';

export class CalculationViewModel {
    private readonly entity: CalculationEntity;

    constructor(entity: CalculationEntity) {
        this.entity = entity;
    }

    get id() { return this.entity.id; }
    get rawData() { return this.entity.rawData; }
    get status() { return this.entity.status; }
    get organizationName() { return this.entity.organizationName; }
    get manager() { return this.entity.manager; }
    get type() { return this.entity.type; }
    get zonesCount() { return this.entity.zonesCount; }
    get totalArea() { return this.entity.totalArea; }
    get managerId() { return this.entity.managerId; }
    get userId() { return this.entity.userId; }
    get results() { return this.entity.results; }
    get totalCost() { return this.entity.totalCost; }
    get versionNumber() { return this.entity.versionNumber; }

    // UI Logic
    get unreadCommentsCount(): number {
        return this.entity.rawData.unreadComments || 0;
    }

    get commentsCount(): number {
        return this.entity.rawData.comments?.length || 0;
    }

    get formattedDate(): string {
        try {
            return new Intl.DateTimeFormat('ru-RU').format(this.entity.createdAt);
        } catch {
            return '—';
        }
    }

    get totalCostDisplay(): string {
        return this.entity.totalCost ? `${this.entity.totalCost.toLocaleString()} ₽` : '—';
    }

    get totalItemsDisplay(): string {
        return `${this.entity.totalItems} шт.`;
    }

    get isNew(): boolean {
        return this.unreadCommentsCount > 0;
    }
}
