import type {
    Calculation,
    CalculationStatus
} from '../../features/dashboard/dashboard.types';

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

    // ===== STATUS MACHINE =====

    /**
     * Business Logic: Can this calculation transition to a target status?
     */
    canTransitionTo(target: CalculationStatus): boolean {
        const allowedTransitions: Partial<Record<CalculationStatus, CalculationStatus[]>> = {
            'draft': ['sent'],
            'sent': ['expert', 'changes'],
            'expert': ['changes', 'suppliers'],
            'changes': ['revision', 'sent'],
            'revision': ['expert'],
            'suppliers': ['invoice'],
            'invoice': ['completed'],
            'completed': []
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
        return ['sent', 'revision', 'expert', 'suppliers', 'invoice'].includes(this.data.status);
    }

    /**
     * Can the MANAGER request changes from client?
     * True for: sent, revision
     */
    canRequestChanges(): boolean {
        return ['sent', 'revision'].includes(this.data.status);
    }

    /**
     * Can the MANAGER move to invoice (approve)?
     * True for: sent, revision, changes (fast-track)
     */
    canMoveToInvoice(): boolean {
        return ['sent', 'revision', 'changes', 'expert', 'suppliers'].includes(this.data.status);
    }

    /**
     * Is the calculation in invoice/payment stage?
     */
    isInvoiced(): boolean {
        return this.data.status === 'invoice';
    }

    /**
     * Is the calculation completed?
     */
    isCompleted(): boolean {
        return this.data.status === 'completed';
    }

    /**
     * Is the calculation a draft?
     */
    isDraft(): boolean {
        return this.data.status === 'draft';
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
}

