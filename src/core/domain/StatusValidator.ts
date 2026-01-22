import { type CalculationStatus } from '@/core/types/calculation';

/**
 * StatusValidator - Pure Domain Component
 * Validates state transitions and status-based permissions.
 */
export class StatusValidator {
    private static readonly ALLOWED_TRANSITIONS: Record<CalculationStatus, CalculationStatus[]> = {
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

    /**
     * Checks if a transition from source to target is logically valid.
     */
    static canTransition(from: CalculationStatus, to: CalculationStatus): boolean {
        if (from === to) return true;
        const possible = this.ALLOWED_TRANSITIONS[from] || [];
        return possible.includes(to);
    }

    /**
     * Business rules for permissions based on status.
     */
    static canEditByClient(status: CalculationStatus, isLocked: boolean): boolean {
        if (isLocked) return false;
        return ['draft', 'changes'].includes(status);
    }

    static canManageInventory(status: CalculationStatus, isLocked: boolean): boolean {
        const forbidden: CalculationStatus[] = [
            'invoice',
            'payment_review',
            'paid',
            'processing',
            'sent_to_warehouse',
            'ready',
            'shipping',
            'completed',
            'closed',
        ];
        return !forbidden.includes(status) && !isLocked;
    }

    static isPaid(status: CalculationStatus): boolean {
        const paidStatuses: CalculationStatus[] = [
            'paid',
            'processing',
            'sent_to_warehouse',
            'ready',
            'shipping',
            'completed',
        ];
        return paidStatuses.includes(status);
    }

    static canBeAssigned(status: CalculationStatus, managerId?: string): boolean {
        return status !== 'draft' && !managerId;
    }

    static canRequestChanges(status: CalculationStatus): boolean {
        return ['sent', 'revision', 'invoice', 'payment_review', 'payment_rejected'].includes(
            status
        );
    }

    static canMoveToInvoice(status: CalculationStatus): boolean {
        return ['sent', 'expert', 'changes', 'revision'].includes(status);
    }

    static isPaymentSent(status: CalculationStatus): boolean {
        return status === 'payment_review';
    }

    static canSubmitPayment(status: CalculationStatus): boolean {
        return status === 'invoice';
    }

    static isCompleted(status: CalculationStatus): boolean {
        return status === 'completed' || status === 'closed';
    }
}
