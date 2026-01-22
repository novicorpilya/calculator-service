import { describe, it, expect } from 'vitest';
import { StatusValidator } from '../StatusValidator';

describe('StatusValidator', () => {
    it('should allow valid transitions', () => {
        expect(StatusValidator.canTransition('draft', 'sent')).toBe(true);
        expect(StatusValidator.canTransition('sent', 'expert')).toBe(true);
        expect(StatusValidator.canTransition('paid', 'processing')).toBe(true);
    });

    it('should block invalid transitions', () => {
        expect(StatusValidator.canTransition('draft', 'paid')).toBe(false);
        expect(StatusValidator.canTransition('completed', 'draft')).toBe(false);
    });

    it('should correctly handle client editing permissions', () => {
        expect(StatusValidator.canEditByClient('draft', false)).toBe(true);
        expect(StatusValidator.canEditByClient('sent', false)).toBe(false);
        expect(StatusValidator.canEditByClient('draft', true)).toBe(false); // Locked
    });

    it('should correctly handle inventory management permissions', () => {
        expect(StatusValidator.canManageInventory('expert', false)).toBe(true);
        expect(StatusValidator.canManageInventory('paid', false)).toBe(false);
    });

    it('should identify paid statuses correctly', () => {
        expect(StatusValidator.isPaid('paid')).toBe(true);
        expect(StatusValidator.isPaid('shipping')).toBe(true);
        expect(StatusValidator.isPaid('draft')).toBe(false);
    });
});
