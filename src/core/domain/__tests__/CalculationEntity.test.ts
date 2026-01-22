import { describe, test, expect } from 'vitest';
import { CalculationEntity } from '../CalculationEntity';
import type { Calculation, CalculationStatus } from '../../../features/dashboard/dashboard.types';

// Mock helper to generate valid DTOs
const mockCalculation = (
    status: CalculationStatus,
    overrides: Partial<Calculation> = {}
): Calculation =>
    ({
        id: 1,
        status,
        organizationName: 'Test Org',
        createdDate: '2025-01-01T00:00:00Z',
        manager_id: undefined,
        user_id: 'user1',
        type: 'Biuro',
        totalArea: 100,
        zonesCount: 2,
        unreadComments: 0,
        comments: [],
        results: {
            summary: [
                {
                    inventory: 'Chair',
                    quantity: 10,
                    price: 100,
                    total: 1000,
                    color: '#000',
                    supplier_id: 'sup1',
                },
                {
                    inventory: 'Table',
                    quantity: 5,
                    price: 200,
                    total: 1000,
                    color: '#FFF',
                    supplier_id: 'sup1',
                },
            ],
            byZone: [],
        },
        ...overrides,
    }) as unknown as Calculation;

describe('CalculationEntity', () => {
    describe('Status Transitions (State Machine)', () => {
        test('should allow valid transition from DRAFT to SENT', () => {
            const entity = new CalculationEntity(mockCalculation('draft'));
            expect(entity.canTransitionTo('sent')).toBe(true);
        });

        test('should prevent invalid transition from DRAFT to INVOICE', () => {
            const entity = new CalculationEntity(mockCalculation('draft'));
            expect(entity.canTransitionTo('invoice')).toBe(false);
        });

        test('should allow EXPERT to CHANGES or INVOICE', () => {
            const entity = new CalculationEntity(mockCalculation('expert'));
            expect(entity.canTransitionTo('changes')).toBe(true);
            expect(entity.canTransitionTo('invoice')).toBe(true);
        });

        test('should prevent EXPERT to COMPLETED directly', () => {
            const entity = new CalculationEntity(mockCalculation('expert'));
            expect(entity.canTransitionTo('completed')).toBe(false);
        });

        test('should allow cycle CHANGES -> REVISION -> EXPERT', () => {
            // changes -> revision
            const changes = new CalculationEntity(mockCalculation('changes'));
            expect(changes.canTransitionTo('revision')).toBe(true);

            // revision -> expert
            const revision = new CalculationEntity(mockCalculation('revision'));
            expect(revision.canTransitionTo('expert')).toBe(true);
        });

        test('should allow loop CHANGES -> SENT (resubmit without revision)', () => {
            const entity = new CalculationEntity(mockCalculation('changes'));
            expect(entity.canTransitionTo('sent')).toBe(true);
        });

        test('should default to no transitions if status is unknown', () => {
            const entity = new CalculationEntity(mockCalculation('unknown' as CalculationStatus));
            expect(entity.canTransitionTo('sent')).toBe(false);
        });
    });

    describe('Business Logic: Financials', () => {
        test('should calculate total cost from summary items', () => {
            const entity = new CalculationEntity(mockCalculation('draft'));
            // (10*100 + 5*200) * 1.20 = 2000 * 1.2 = 2400
            expect(entity.totalCost).toBe(2400);
        });

        test('should use pre-calculated totalCost if no summary items exist', () => {
            const entity = new CalculationEntity(
                mockCalculation('draft', {
                    totalCost: 5000,
                    results: { summary: [], byZone: [] },
                })
            );
            expect(entity.totalCost).toBe(5000);
        });

        test('should handle missing results gracefully', () => {
            const entity = new CalculationEntity(mockCalculation('draft', { results: undefined }));
            expect(entity.totalCost).toBe(0);
        });

        test('should count total items correctly', () => {
            const entity = new CalculationEntity(mockCalculation('draft'));
            expect(entity.totalItems).toBe(2); // 2 rows in summary
        });
    });

    describe('Invariants & Permissions', () => {
        test('isEditableByClient should be true for DRAFT and CHANGES', () => {
            expect(new CalculationEntity(mockCalculation('draft')).isEditableByClient()).toBe(true);
            expect(new CalculationEntity(mockCalculation('changes')).isEditableByClient()).toBe(
                true
            );
        });

        test('isEditableByClient should be false for SENT and INVOICE', () => {
            expect(new CalculationEntity(mockCalculation('sent')).isEditableByClient()).toBe(false);
            expect(new CalculationEntity(mockCalculation('invoice')).isEditableByClient()).toBe(
                false
            );
        });

        test('canRequestChanges should be true for SENT and REVISION', () => {
            expect(new CalculationEntity(mockCalculation('sent')).canRequestChanges()).toBe(true);
            expect(new CalculationEntity(mockCalculation('revision')).canRequestChanges()).toBe(
                true
            );
            expect(new CalculationEntity(mockCalculation('changes')).canRequestChanges()).toBe(
                false
            );
        });

        test('canMoveToInvoice should be true for workflow states before invoice', () => {
            expect(new CalculationEntity(mockCalculation('sent')).canMoveToInvoice()).toBe(true);
            expect(new CalculationEntity(mockCalculation('revision')).canMoveToInvoice()).toBe(
                true
            );
            expect(new CalculationEntity(mockCalculation('changes')).canMoveToInvoice()).toBe(true);
            expect(new CalculationEntity(mockCalculation('expert')).canMoveToInvoice()).toBe(true);
            expect(new CalculationEntity(mockCalculation('invoice')).canMoveToInvoice()).toBe(
                false
            );
        });

        test('canBeAssigned should be true only for unassigned non-draft calculations', () => {
            expect(
                new CalculationEntity(
                    mockCalculation('sent', { manager_id: undefined })
                ).canBeAssigned()
            ).toBe(true);
            expect(
                new CalculationEntity(
                    mockCalculation('draft', { manager_id: undefined })
                ).canBeAssigned()
            ).toBe(false);
            expect(
                new CalculationEntity(
                    mockCalculation('sent', { manager_id: 'mgr1' })
                ).canBeAssigned()
            ).toBe(false);
        });

        test('isAssignedTo should correctly identify assigned manager', () => {
            const entity = new CalculationEntity(mockCalculation('sent', { manager_id: 'mgr123' }));
            expect(entity.isAssignedTo('mgr123')).toBe(true);
            expect(entity.isAssignedTo('other')).toBe(false);
        });

        test('canSubmitPayment and isCompleted should correctly identify final states', () => {
            expect(new CalculationEntity(mockCalculation('invoice')).canSubmitPayment()).toBe(true);
            expect(new CalculationEntity(mockCalculation('completed')).isCompleted()).toBe(true);
            expect(new CalculationEntity(mockCalculation('sent')).canSubmitPayment()).toBe(false);
            expect(new CalculationEntity(mockCalculation('payment_review')).isPaymentSent()).toBe(
                true
            );
            expect(new CalculationEntity(mockCalculation('paid')).isPaid()).toBe(true);
        });
    });

    describe('Manager Adjustments & Validation', () => {
        test('should apply global margin to total cost', () => {
            const entity = new CalculationEntity(
                mockCalculation('expert', {
                    manager_adjustments: { global_margin: 1.2 }, // 20% margin
                })
            );
            // Base = 2000. 2000 * 1.2 (margin) = 2400. 2400 * 1.2 (VAT) = 2880
            expect(entity.totalCost).toBe(2880);
        });

        test('should add delivery and service costs', () => {
            const entity = new CalculationEntity(
                mockCalculation('expert', {
                    manager_adjustments: {
                        global_margin: 1.0,
                        delivery_cost: 500,
                        service_cost: 300,
                    },
                })
            );
            // Base = (2000 * 1.0) + 500 + 300 = 2800 Net. 2800 * 1.2 (VAT) = 3360 Total
            expect(entity.totalCost).toBe(3360);
        });

        test('getValidationReport: should return errors for empty specification', () => {
            const entity = new CalculationEntity(
                mockCalculation('sent', {
                    results: { summary: [], byZone: [] },
                })
            );
            const report = entity.getValidationReport();
            expect(report.isValid).toBe(false);
            expect(report.messages.some((m) => m.type === 'error')).toBe(true);
            expect(report.score).toBeLessThan(100);
        });

        test('getValidationReport: should return error for unassigned manager', () => {
            const entity = new CalculationEntity(
                mockCalculation('sent', {
                    manager_id: undefined,
                })
            );
            const report = entity.getValidationReport();
            expect(report.messages.some((m) => m.text.includes('Менеджер не назначен'))).toBe(true);
        });

        test('getValidationReport: should flag low margin warning', () => {
            const entity = new CalculationEntity(
                mockCalculation('expert', {
                    manager_adjustments: { global_margin: 1.02 }, // 2% < 5%
                })
            );
            const report = entity.getValidationReport();
            expect(
                report.messages.some(
                    (m) => m.type === 'warning' && m.text.includes('Низкая маржинальность')
                )
            ).toBe(true);
        });
    });
});
