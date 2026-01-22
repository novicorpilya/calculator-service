import type { Calculation, CalculationStatus } from '@/core/types/calculation';
import { PriceCalculator } from './PriceCalculator';
import { StatusValidator } from './StatusValidator';
import { DiffEngine } from './DiffEngine';
import { DEFAULT_BUSINESS_RULES, type BusinessRules } from '../config/business.config';

export class CalculationEntity {
    private data: Calculation;
    private rules: BusinessRules;

    constructor(data: Calculation, rules: BusinessRules = DEFAULT_BUSINESS_RULES) {
        this.data = data;
        this.rules = rules;
    }

    // ===== CORE PROPERTIES =====
    get id() {
        return this.data.id;
    }
    get status() {
        return this.data.status;
    }
    get organizationName() {
        return this.data.organizationName;
    }
    get userId() {
        return this.data.user_id;
    }
    get results() {
        return this.data.results;
    }
    get managerAdjustments() {
        return this.data.manager_adjustments || {};
    }
    get totalItems() {
        return this.data.results?.summary?.length || 0;
    }
    get lockedAt() {
        return this.data.locked_at ? new Date(this.data.locked_at) : null;
    }
    get slaDeadline() {
        return this.data.sla_deadline ? new Date(this.data.sla_deadline) : null;
    }
    get type() {
        return this.data.type;
    }
    get totalArea() {
        return this.data.totalArea;
    }
    get staffCount() {
        return this.data.staffCount;
    }
    get dailyVisitors() {
        return this.data.dailyVisitors;
    }
    get sanitaryLevel() {
        return this.data.sanitaryLevel;
    }
    get replacementCycle() {
        return this.data.replacementCycle;
    }
    get configSnapshot() {
        return this.data.calculator_config_snapshot;
    }
    get rawData() {
        return this.data;
    }
    get managerId() {
        return this.data.manager_id;
    }
    get createdAt() {
        return this.data.createdDate;
    }
    get versionNumber() {
        return this.data.version_number || 1;
    }

    get byZone() {
        return this.data.results?.byZone || [];
    }
    get clientOrganizationName() {
        return this.data.client_organization_name || this.data.client_name;
    }
    get clientInn() {
        return this.data.client_inn;
    }
    get clientAddress() {
        return this.data.client_address;
    }

    get totalCost(): number {
        const items = this.data.results?.summary || [];
        if (items.length === 0) return this.data.totalCost || 0;

        return PriceCalculator.calculateFinalTotal(items, this.managerAdjustments, this.rules);
    }

    // ===== STATE MACHINE =====
    canTransitionTo(target: CalculationStatus): boolean {
        return StatusValidator.canTransition(this.data.status, target);
    }

    isEditableByClient(): boolean {
        return StatusValidator.canEditByClient(this.data.status, !!this.data.locked_at);
    }

    isPendingClientChanges(): boolean {
        return this.data.status === 'changes';
    }

    canManageInventory(): boolean {
        return StatusValidator.canManageInventory(this.data.status, !!this.data.locked_at);
    }

    isPaid(): boolean {
        return StatusValidator.isPaid(this.data.status);
    }

    isAssignedTo(managerId: string): boolean {
        return this.data.manager_id === managerId;
    }

    canBeAssigned(): boolean {
        return StatusValidator.canBeAssigned(this.data.status, this.data.manager_id);
    }

    canRequestChanges(): boolean {
        return StatusValidator.canRequestChanges(this.data.status);
    }

    canMoveToInvoice(): boolean {
        return StatusValidator.canMoveToInvoice(this.data.status);
    }

    isPaymentSent(): boolean {
        return StatusValidator.isPaymentSent(this.data.status);
    }

    canSubmitPayment(): boolean {
        return StatusValidator.canSubmitPayment(this.data.status);
    }

    isPaymentRejected(): boolean {
        return this.data.status === 'payment_rejected';
    }

    isCompleted(): boolean {
        return StatusValidator.isCompleted(this.data.status);
    }

    // ===== BUSINESS INVARIANTS =====
    getValidationReport() {
        const messages: { text: string; type: 'error' | 'warning' }[] = [];
        let score = 100;

        if (this.totalItems === 0 && this.data.status !== 'draft') {
            messages.push({ text: 'Спецификация пуста', type: 'error' });
            score -= 30;
        }

        if (!this.data.manager_id && this.data.status !== 'draft') {
            messages.push({ text: 'Менеджер не назначен', type: 'error' });
            score -= 40;
        }

        const margin = Number(this.managerAdjustments.global_margin) || 1.0;
        if (margin < this.rules.MIN_PROFITABLE_MARGIN && this.data.status !== 'draft') {
            messages.push({
                text: `Низкая маржинальность (< ${Math.round((this.rules.MIN_PROFITABLE_MARGIN - 1) * 100)}%)`,
                type: 'warning',
            });
            score -= 10;
        }

        return {
            isValid: !messages.some((m) => m.type === 'error'),
            status:
                score < 40
                    ? 'error'
                    : score < 80
                      ? 'warning'
                      : ('success' as 'error' | 'warning' | 'success'),
            score,
            messages,
        };
    }

    getDiff(previousSnapshotData: Partial<Calculation>) {
        return DiffEngine.calculateDiff(this.data, previousSnapshotData || {});
    }

    getDiffSummary(previousSnapshotData: Partial<Calculation>) {
        const diff = this.getDiff(previousSnapshotData);
        return DiffEngine.getSummary(diff);
    }
}
