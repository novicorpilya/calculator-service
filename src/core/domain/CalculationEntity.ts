import type { Calculation, CalculationStatus } from '@/core/types/calculation';
import { CALCULATION_STATUS } from '../constants/calculation.constants';

import { calculateTotalCost } from './calculator.utils';

/**
 * CalculationEntity - Rich Domain Model
 *
 * Encapsulates ALL business rules and invariants for a Calculation.
 * UI components should ONLY call methods on this entity, never check status directly.
 */
export class CalculationEntity {
    private readonly data: Calculation;

    constructor(data: Calculation) {
        this.data = data;
    }

    // ===== GETTERS =====
    get id() {
        return this.data.id;
    }
    get status() {
        return this.data.status;
    }
    get organizationName() {
        return this.data.organizationName;
    }
    get createdAt() {
        return new Date(this.data.createdDate);
    }
    get rawData() {
        return { ...this.data };
    }
    get manager() {
        return this.data.manager;
    }
    get type() {
        return this.data.type;
    }
    get zonesCount() {
        // Dynamic derivation: prefer actual zone list length
        if (this.data.zoneDetails && this.data.zoneDetails.length > 0) {
            return this.data.zoneDetails.length;
        }
        if (this.data.results?.byZone && this.data.results.byZone.length > 0) {
            return this.data.results.byZone.length;
        }
        return this.data.zonesCount || 0;
    }
    get totalArea() {
        return this.data.totalArea;
    }
    get managerId() {
        return this.data.manager_id;
    }
    get userId() {
        return this.data.user_id;
    }
    get results() {
        return this.data.results;
    }
    get summary() {
        return this.data.results?.summary || [];
    }
    get byZone() {
        return this.data.results?.byZone || [];
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
    get zoneDetails() {
        return this.data.zoneDetails;
    }
    get versionNumber() {
        return this.data.version_number || 1;
    }
    get managerAdjustments() {
        return this.data.manager_adjustments || {};
    }
    get lockedAt() {
        return this.data.locked_at ? new Date(this.data.locked_at) : null;
    }
    get finalSnapshot() {
        return this.data.final_snapshot;
    }
    get configSnapshot() {
        return this.data.calculator_config_snapshot;
    }
    get slaDeadline() {
        return this.data.sla_deadline ? new Date(this.data.sla_deadline) : null;
    }
    get lastStatusChangeAt() {
        return this.data.last_status_change_at ? new Date(this.data.last_status_change_at) : null;
    }
    get clientInn() {
        return this.data.client_inn;
    }
    get clientAddress() {
        return this.data.client_address;
    }
    get clientOrganizationName() {
        return this.data.client_organization_name;
    }

    // ===== STATUS MACHINE =====

    /**
     * Business Logic: Can this calculation transition to a target status?
     */
    canTransitionTo(target: CalculationStatus): boolean {
        const allowedTransitions: Partial<Record<CalculationStatus, CalculationStatus[]>> = {
            draft: ['sent'],
            sent: ['expert', 'changes', 'invoice'],
            expert: ['changes', 'invoice'],
            changes: ['revision', 'sent'],
            revision: ['expert', 'invoice', 'changes'],
            invoice: ['payment_review', 'changes'],
            payment_review: ['paid', 'payment_rejected', 'changes', 'invoice'],
            payment_rejected: ['payment_review', 'changes', 'invoice'],
            paid: ['processing'],
            processing: ['sent_to_warehouse'],
            sent_to_warehouse: ['ready'],
            ready: ['shipping'],
            shipping: ['completed'],
            completed: ['closed'],
            closed: [],
        };

        const possible = allowedTransitions[this.data.status] || [];
        return possible.includes(target);
    }

    /**
     * Calculate total cost from results, applying manager adjustments
     */
    get totalCost(): number {
        const results = this.data.results;

        // Always prefer calculating from actual items if they exist
        if (results?.summary && results.summary.length > 0) {
            // Base cost from items
            const baseCost = calculateTotalCost(results.summary);

            // Apply manager adjustments
            const adjustments = this.managerAdjustments;
            const globalMargin = Number(adjustments.global_margin) || 1.0;
            const deliveryCost = Number(adjustments.delivery_cost) || 0;
            const serviceCost = Number(adjustments.service_cost) || 0;

            // Final cost = (base * margin) + delivery + service
            return Math.round(baseCost * globalMargin + deliveryCost + serviceCost);
        }

        // Fallback to DB value only if results are not calculated yet
        return this.data.totalCost || 0;
    }

    get totalItems(): number {
        const results = this.data.results;
        if (!results || !results.summary || !Array.isArray(results.summary)) return 0;
        return results.summary.length;
    }

    // ===== PERMISSION INVARIANTS =====

    /**
     * Can the CLIENT edit this calculation?
     * True for: draft, changes
     */
    isEditableByClient(): boolean {
        if (this.isLocked()) return false;
        return ['draft', 'changes'].includes(this.data.status);
    }

    /**
     * Can the CLIENT send/submit this calculation?
     * True for: draft, changes
     */
    canClientSubmit(): boolean {
        return this.canTransitionTo('sent');
    }

    /**
     * Can the MANAGER take action on this calculation?
     * True for: sent, revision, expert, suppliers, invoice
     */
    canRequestChanges(): boolean {
        const statuses: CalculationStatus[] = [
            CALCULATION_STATUS.SENT,
            CALCULATION_STATUS.REVISION,
            CALCULATION_STATUS.EXPERT,
        ];
        return statuses.includes(this.data.status);
    }

    /**
     * Can the MANAGER move to invoice (approve)?
     * True for: sent, revision, changes (fast-track)
     */
    canMoveToInvoice(): boolean {
        const statuses: CalculationStatus[] = [
            CALCULATION_STATUS.SENT,
            CALCULATION_STATUS.REVISION,
            CALCULATION_STATUS.CHANGES,
            CALCULATION_STATUS.EXPERT,
        ];
        return statuses.includes(this.data.status);
    }

    /**
     * Is the calculation in invoice/payment stage?
     */
    canSubmitPayment(): boolean {
        return this.data.status === CALCULATION_STATUS.INVOICE;
    }

    /**
     * Is the calculation completed?
     */
    isCompleted(): boolean {
        return this.data.status === CALCULATION_STATUS.COMPLETED;
    }

    /**
     * Is the calculation a draft?
     */
    isDraft(): boolean {
        return this.data.status === CALCULATION_STATUS.DRAFT;
    }

    /**
     * Has the client claimed that the invoice is paid?
     */
    isPaymentSent(): boolean {
        return this.data.status === CALCULATION_STATUS.PAYMENT_REVIEW;
    }

    /**
     * Has the manager rejected the payment receipt?
     */
    isPaymentRejected(): boolean {
        return this.data.status === 'payment_rejected';
    }

    /**
     * Is the payment confirmed by the manager?
     */
    isPaid(): boolean {
        const statuses: CalculationStatus[] = [
            CALCULATION_STATUS.PAID,
            CALCULATION_STATUS.PROCESSING,
            CALCULATION_STATUS.READY,
            CALCULATION_STATUS.SHIPPING,
            CALCULATION_STATUS.COMPLETED,
        ];
        return statuses.includes(this.data.status);
    }

    /**
     * Is the order being prepared/packed?
     */
    isProcessing(): boolean {
        return this.data.status === 'processing';
    }

    /**
     * Is the order sent to warehouse?
     */
    isSentToWarehouse(): boolean {
        return this.data.status === 'sent_to_warehouse';
    }

    /**
     * Is the calculation pending review (by manager)?
     */
    isPendingReview(): boolean {
        return ['sent', 'revision'].includes(this.data.status);
    }

    /**
     * Is the calculation waiting for client changes?
     */
    isPendingClientChanges(): boolean {
        return this.data.status === 'changes';
    }

    /**
     * Can the calculation be assigned to a manager?
     */
    canBeAssigned(): boolean {
        return !this.data.manager_id && this.data.status !== 'draft';
    }

    /**
     * Is assigned to a specific manager?
     */
    isAssignedTo(managerId: string): boolean {
        return String(this.data.manager_id) === String(managerId);
    }

    /**
     * Enterprise Audit: Is the project locked from basic mutation?
     */
    isLocked(): boolean {
        return !!this.data.locked_at;
    }

    /**
     * Senior Logic: Can manager audit or modify the inventory list?
     * Rules: 
     * 1. Project must NOT be paid yet (Integrity of Invoice/Payment).
     * 2. Project must NOT be in post-payment supply stages.
     */
    canManageInventory(): boolean {
        const forbiddenStatuses: CalculationStatus[] = [
            'paid', 'processing', 'sent_to_warehouse', 'ready', 'shipping', 'completed', 'closed'
        ];
        return !forbiddenStatuses.includes(this.data.status) && !this.isLocked();
    }

    /**
     * Enterprise Audit: Can manager toggle Expert Mode and replace/add items?
     */
    canEditInExpertMode(userId: string = ''): boolean {
        // Must be assigned manager (if userId provided) AND in a valid lifecycle stage
        const isAssigned = userId ? this.isAssignedTo(userId) : true;
        return isAssigned && this.canManageInventory();
    }

    /**
     * Senior Logic: Comprehensive validation for the manager
     */
    getValidationReport(): {
        isValid: boolean;
        status: 'error' | 'warning' | 'success';
        score: number;
        messages: { text: string; type: 'error' | 'info' | 'warning' }[];
    } {
        const messages: { text: string; type: 'error' | 'info' | 'warning' }[] = [];
        let score = 100;

        // 1. Check for empty calculation
        if (!this.data.results || !this.data.results.summary || this.data.results.summary.length === 0) {
            messages.push({ text: 'Спецификация пуста: расчет не содержит товаров', type: 'error' });
            score -= 50;
        }

        // 2. Check for missing critical metrics
        if (!this.data.totalArea || this.data.totalArea === 0) {
            messages.push({ text: 'Не указана общая площадь объекта', type: 'warning' });
            score -= 10;
        }

        // 3. Margin check (if adjustments exist)
        const adjustments = this.managerAdjustments as Record<string, unknown>;
        if (adjustments?.global_margin) {
            const margin = Number(adjustments.global_margin);
            if (margin < 1.05) {
                messages.push({ text: 'Низкая маржинальность заказа (< 5%)', type: 'warning' });
                score -= 20;
            } else if (margin > 2.0) {
                messages.push({ text: 'Высокая наценка (> 100%)', type: 'info' });
            }
        } else {
            messages.push({ text: 'Наценка не установлена (используется базовая цена)', type: 'info' });
        }

        // 4. SLA check
        if (this.slaDeadline && this.slaDeadline < new Date()) {
            messages.push({ text: 'Нарушен срок обработки заказа (SLA)', type: 'error' });
            score -= 30;
        }

        // 5. Manager assignment
        if (!this.data.manager_id) {
            messages.push({ text: 'Менеджер не назначен', type: 'error' });
            score -= 40;
        }

        const status = score < 40 ? 'error' : score < 80 ? 'warning' : 'success';
        const isValid = !messages.some(m => m.type === 'error');

        return {
            isValid,
            status,
            score: Math.max(0, score),
            messages
        };
    }
}
