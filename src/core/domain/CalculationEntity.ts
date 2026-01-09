import type { Calculation, CalculationStatus } from '@/features/dashboard/dashboard.types';
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
    get id() { return this.data.id; }
    get status() { return this.data.status; }
    get organizationName() { return this.data.organizationName; }
    get createdAt() { return new Date(this.data.createdDate); }
    get rawData() { return { ...this.data }; }
    get manager() { return this.data.manager; }
    get type() { return this.data.type; }
    get zonesCount() { return this.data.zonesCount; }
    get totalArea() { return this.data.totalArea; }
    get managerId() { return this.data.manager_id; }
    get userId() { return this.data.user_id; }
    get results() { return this.data.results; }
    get summary() { return this.data.results?.summary || []; }
    get byZone() { return this.data.results?.byZone || []; }
    get staffCount() { return this.data.staffCount; }
    get dailyVisitors() { return this.data.dailyVisitors; }
    get sanitaryLevel() { return this.data.sanitaryLevel; }
    get replacementCycle() { return this.data.replacementCycle; }
    get zoneDetails() { return this.data.zoneDetails; }
    get versionNumber() { return this.data.version_number || 1; }
    get managerAdjustments() { return this.data.manager_adjustments || {}; }
    get lockedAt() { return this.data.locked_at ? new Date(this.data.locked_at) : null; }
    get finalSnapshot() { return this.data.final_snapshot; }

    // ===== STATUS MACHINE =====

    /**
     * Business Logic: Can this calculation transition to a target status?
     */
    canTransitionTo(target: CalculationStatus): boolean {
        const allowedTransitions: Partial<Record<CalculationStatus, CalculationStatus[]>> = {
            'draft': ['sent'],
            'sent': ['expert', 'changes', 'invoice'],
            'expert': ['changes', 'invoice'],
            'changes': ['revision', 'sent'],
            'revision': ['expert', 'invoice'],
            'invoice': ['payment_review', 'changes'],
            'payment_review': ['paid', 'changes', 'invoice'],
            'paid': ['processing'],
            'processing': ['ready'],
            'ready': ['shipping'],
            'shipping': ['completed'],
            'completed': ['closed'],
            'closed': []
        };

        const possible = allowedTransitions[this.data.status] || [];
        return possible.includes(target);
    }

    // ===== FINANCIAL CALCULATIONS =====

    /**
     * Calculate total cost from results
     */
    get totalCost(): number {
        if (typeof this.data.totalCost === 'number' && this.data.totalCost > 0) return this.data.totalCost;
        const results = this.data.results;
        if (!results || !results.summary) return 0;
        return calculateTotalCost(results.summary);
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
    isActionableByManager(): boolean {
        const statuses: CalculationStatus[] = [
            CALCULATION_STATUS.SENT,
            CALCULATION_STATUS.REVISION,
            CALCULATION_STATUS.EXPERT,
            CALCULATION_STATUS.INVOICE,
            CALCULATION_STATUS.PAYMENT_REVIEW
        ];

        if (this.isLocked() && this.data.status !== CALCULATION_STATUS.INVOICE) return false;
        return statuses.includes(this.data.status);
    }

    canRequestChanges(): boolean {
        const statuses: CalculationStatus[] = [CALCULATION_STATUS.SENT, CALCULATION_STATUS.REVISION, CALCULATION_STATUS.EXPERT];
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
            CALCULATION_STATUS.EXPERT
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
     * Is the payment confirmed by the manager?
     */
    isPaid(): boolean {
        const statuses: CalculationStatus[] = [
            CALCULATION_STATUS.PAID,
            CALCULATION_STATUS.PROCESSING,
            CALCULATION_STATUS.READY,
            CALCULATION_STATUS.SHIPPING,
            CALCULATION_STATUS.COMPLETED
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

    // ===== CATEGORY HELPERS =====

    /**
     * Get status category for grouping
     */
    getStatusCategory(): 'active' | 'pending' | 'completed' | 'draft' {
        if (this.isDraft()) return 'draft';
        if (this.isCompleted()) return 'completed';
        if (this.isPendingReview() || this.isPendingClientChanges()) return 'pending';
        return 'active';
    }

    /**
     * Enterprise Audit: Is the project locked from basic mutation?
     */
    isLocked(): boolean {
        return !!this.data.locked_at;
    }

    /**
     * Enterprise Audit: Can manager edit items in Expert Mode?
     */
    canEditInExpertMode(userId: string): boolean {
        return this.data.status === 'expert' && this.isAssignedTo(userId) && !this.isLocked();
    }
}

