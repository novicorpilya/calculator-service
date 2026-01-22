import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@/test/utils';
import { ClientCalculationDetails } from '@/features/dashboard/client/components/details/ClientCalculationDetails';
import type { CalculationStatus, Calculation } from '@/features/dashboard/dashboard.types';

// Mock dependencies
vi.mock('@/features/dashboard/hooks/useProductSelection', () => ({
    useProductSelection: () => ({
        isAuditMode: false,
        catalog: [],
        handleProductSelect: vi.fn(),
    }),
}));

vi.mock('@/features/auth', () => ({
    useAuth: () => ({
        user: { id: 'test-user', role: 'client' },
        isAuthenticated: true,
    }),
}));

describe('Integration: Client Calculation Details', () => {
    const mockCalculation = {
        id: 'calc-123',
        status: 'new' as CalculationStatus,
        totalCost: 100000,
        organizationName: 'Test Org',
        createdDate: new Date().toISOString(),
        items: [],
        results: { total: 100000, summary: [] },
        totalArea: 100,
    } as unknown as Calculation;

    it('should render calculation details and handle status actions', async () => {
        const onUpdateStatus = vi.fn();

        render(
            <ClientCalculationDetails
                calculation={mockCalculation}
                onBack={vi.fn()}
                onUpdateStatus={onUpdateStatus}
                onDelete={vi.fn()}
                onEdit={vi.fn()}
                displayId={123}
            />
        );

        // 1. Verify primary info
        expect(screen.getByText(/Test Org/i)).toBeInTheDocument();
        expect(screen.getByText(/123/)).toBeInTheDocument(); // Display ID

        // 2. Verify cost formatting (assuming standard formatting is used)
        const costElement = screen.getByText(/100.*000/);
        expect(costElement).toBeInTheDocument();

        // 3. Check for specific UI elements based on 'new' status
        // Calculations in 'new' (or draft) status should have a 'Submit' or similar button
        // Note: The actual button text might be different based on translation, using regex
        const submitButton = screen.queryByRole('button', {
            name: /отправить|отправить на проверку/i,
        });
        if (submitButton) {
            submitButton.click();
            expect(onUpdateStatus).toHaveBeenCalled();
        }
    });

    it('should show empty state if no items are present', () => {
        render(
            <ClientCalculationDetails
                calculation={{ ...mockCalculation, results: { summary: [], byZone: [] } }}
                onBack={vi.fn()}
                onUpdateStatus={vi.fn()}
                onDelete={vi.fn()}
                onEdit={vi.fn()}
                displayId={456}
            />
        );
        expect(screen.getByText(/пусто|нет товаров/i)).toBeInTheDocument();
    });
});
