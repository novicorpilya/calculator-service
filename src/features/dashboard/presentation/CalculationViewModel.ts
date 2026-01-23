import { CalculationEntity } from '@/core/domain/CalculationEntity';

export class CalculationViewModel {
    private readonly entity: CalculationEntity;

    constructor(entity: CalculationEntity) {
        this.entity = entity;
    }

    get id() {
        return this.entity.id;
    }
    get projectNumber(): number {
        return this.entity.rawData.project_number || 0;
    }
    get projectNumberDisplay(): string {
        const num = this.projectNumber;
        return num > 0 ? String(num).padStart(3, '0') : '---';
    }
    get rawData() {
        return this.entity.rawData;
    }
    get status() {
        return this.entity.status;
    }
    get organizationName() {
        return this.entity.organizationName;
    }
    get type() {
        return this.entity.type;
    }
    get zonesCount() {
        return this.entity.rawData.zonesCount || 0;
    }
    get totalArea() {
        return this.entity.totalArea;
    }
    get managerId() {
        return this.entity.managerId;
    }
    get userId() {
        return this.entity.userId;
    }
    get results() {
        return this.entity.results;
    }
    get totalCost() {
        return this.entity.totalCost;
    }

    get managerName(): string {
        const data = this.entity.rawData.manager_data;
        if (!data) return '';

        const fullName = `${data.first_name || ''} ${data.last_name || ''}`.trim();
        return fullName || data.organization_name || 'Специалист';
    }

    get unreadCommentsCount() {
        return this.entity.rawData.unreadComments || 0;
    }
    get slaDeadline() {
        return this.entity.slaDeadline;
    }
    get isCompleted() {
        return this.entity.isCompleted();
    }

    get isPriceOutdated(): boolean {
        // Placeholder: in production this would check if any inventory items have newer prices
        return false;
    }

    get clientDisplayName(): string {
        const raw = this.entity.rawData;
        return raw.client_organization_name || raw.client_name || 'Клиент';
    }

    get formattedDate(): string {
        const date = this.entity.createdAt;
        if (!date) return '—';
        try {
            return new Date(date).toLocaleDateString('ru-RU', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
            });
        } catch {
            return '—';
        }
    }

    get totalCostDisplay(): string {
        return this.totalCost ? `${this.totalCost.toLocaleString()} ₽` : '—';
    }

    get isOverdue(): boolean {
        const deadline = this.entity.slaDeadline;
        return !!(deadline && deadline < new Date());
    }

    get statusConfig() {
        const configs: Record<string, { label: string; color: string; bg: string }> = {
            draft: { label: 'Черновик', color: 'text-slate-500', bg: 'bg-slate-50' },
            sent: { label: 'Новый лид', color: 'text-blue-600', bg: 'bg-blue-50' },
            expert: { label: 'Экспертиза', color: 'text-indigo-600', bg: 'bg-indigo-50' },
            changes: { label: 'У клиента', color: 'text-amber-600', bg: 'bg-amber-50' },
            revision: { label: 'Ревизия', color: 'text-orange-600', bg: 'bg-orange-50' },
            invoice: { label: 'Счет выставлен', color: 'text-purple-600', bg: 'bg-purple-50' },
            payment_review: { label: 'Проверка оплаты', color: 'text-cyan-600', bg: 'bg-cyan-50' },
            paid: { label: 'Оплачено', color: 'text-emerald-600', bg: 'bg-emerald-50' },
            processing: { label: 'В сборке', color: 'text-teal-600', bg: 'bg-teal-50' },
            completed: { label: 'Завершено', color: 'text-gray-500', bg: 'bg-gray-50' },
        };
        return (
            configs[this.status] || {
                label: this.status,
                color: 'text-slate-400',
                bg: 'bg-slate-100',
            }
        );
    }
}
