import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CalculationService } from '../CalculationService';
import type { ICalculationRepository } from '../../repositories/CalculationRepository';
import type { IVersionService } from '@/features/dashboard/manager/services/version.service';
import type { IConfigService } from '@/services/config.service';
import { DEFAULT_BUSINESS_RULES } from '@/core/config/business.config';
import { CALCULATION_STATUS } from '@/core/constants/calculation.constants';
import type { Calculation } from '../../dashboard.types';

describe('CalculationService', () => {
    let service: CalculationService;
    let mockRepo: ICalculationRepository;
    let mockVersionService: IVersionService;
    let mockConfigService: IConfigService;

    beforeEach(() => {
        mockRepo = {
            getById: vi.fn(),
            getByUserId: vi.fn(),
            getUnassigned: vi.fn(),
            getManagerWorkload: vi.fn(),
            getPaginated: vi.fn(),
            create: vi.fn(),
            updateContent: vi.fn(),
            delete: vi.fn(),
            executeAction: vi.fn(),
            adjustCalculationExpert: vi.fn(),
            uploadFile: vi.fn(),
            createSignedUrl: vi.fn(),
            acquireLock: vi.fn(),
            releaseLock: vi.fn(),
            getVersions: vi.fn(),
            getDashboardStats: vi.fn(),
            smartReorder: vi.fn(),
            clearVersions: vi.fn(),
        } as unknown as ICalculationRepository;

        mockVersionService = {
            createSnapshot: vi.fn(),
            getVersions: vi.fn(),
            getVersion: vi.fn(),
        } as unknown as IVersionService;

        mockConfigService = {
            getBusinessRules: vi.fn().mockResolvedValue(DEFAULT_BUSINESS_RULES),
        } as unknown as IConfigService;

        service = new CalculationService(mockRepo, mockVersionService, mockConfigService);
    });

    describe('update', () => {
        it('should execute action when status is provided', async () => {
            const mockCalc = { id: 'calc-1', status: CALCULATION_STATUS.DRAFT };
            vi.mocked(mockRepo.getById).mockResolvedValue({
                success: true,
                data: mockCalc as unknown as Calculation,
            });
            vi.mocked(mockRepo.executeAction).mockResolvedValue({
                success: true,
                data: { ...mockCalc, status: CALCULATION_STATUS.SENT } as unknown as Calculation,
            });

            const result = await service.update('calc-1', { status: CALCULATION_STATUS.SENT });

            expect(mockRepo.executeAction).toHaveBeenCalledWith(
                'calc-1',
                'submit',
                undefined,
                expect.any(Object)
            );
            expect(result.success).toBe(true);
        });

        it('should update content when no status is provided', async () => {
            const mockCalc = { id: 'calc-1', status: CALCULATION_STATUS.DRAFT };
            vi.mocked(mockRepo.getById).mockResolvedValue({
                success: true,
                data: mockCalc as unknown as Calculation,
            });
            const updates = { totalArea: 100 };
            vi.mocked(mockRepo.updateContent).mockResolvedValue({
                success: true,
                data: { ...mockCalc, ...updates } as unknown as Calculation,
            });

            const result = await service.update('calc-1', updates);

            expect(mockRepo.updateContent).toHaveBeenCalledWith(
                'calc-1',
                expect.objectContaining(updates)
            );
            expect(result.success).toBe(true);
        });
    });
});
