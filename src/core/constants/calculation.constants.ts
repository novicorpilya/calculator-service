/**
 * Centralized Calculation Statuses and Actions
 * Use these constants instead of magic strings to prevent typos and ease refactoring.
 */

export const CALCULATION_STATUS = {
    DRAFT: 'draft',
    SENT: 'sent',
    EXPERT: 'expert',
    CHANGES: 'changes',
    REVISION: 'revision',
    INVOICE: 'invoice',
    PAYMENT_REVIEW: 'payment_review',
    PAID: 'paid',
    PROCESSING: 'processing',
    SENT_TO_WAREHOUSE: 'sent_to_warehouse',
    READY: 'ready',
    SHIPPING: 'shipping',
    COMPLETED: 'completed',
    CLOSED: 'closed',
} as const;

export const CALCULATION_ACTION = {
    SUBMIT: 'submit',
    APPROVE: 'approve',
    REJECT: 'reject',
    RESOLVE: 'resolve',
    ASSIGN: 'assign',
    ACCEPT_PAYMENT: 'accept_payment',
    SUBMIT_PAYMENT: 'submit_payment',
    REJECT_PAYMENT: 'reject_payment',
    START_PROCESSING: 'start_processing',
    SEND_TO_WAREHOUSE: 'send_to_warehouse',
    MARK_READY: 'mark_ready',
    START_SHIPPING: 'start_shipping',
    FINISH_PROJECT: 'finish_project',
    LOG_ERROR: 'log_error',
} as const;
