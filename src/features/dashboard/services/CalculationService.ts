import type {
    ICalculationRepository,
    PaginationParams,
    PaginatedResult,
} from '../repositories/CalculationRepository';
import type { Calculation, CalculationResults } from '../dashboard.types';
import { CALCULATION_STATUS, CALCULATION_ACTION } from '@/core/constants/calculation.constants';
import { calculateTotalCost } from '@/core/domain/calculator.utils';
import { logger } from '@/core/logging';
import type { ActionResult, VoidResult } from '@/core/types/results';

export interface ICalculationService {
    getMyCalculations(userId: string): Promise<ActionResult<Calculation[]>>;
    getCalculation(id: string | number): Promise<ActionResult<Calculation>>;
    getUnassigned(): Promise<ActionResult<Calculation[]>>;
    getManagerWorkload(managerId: string): Promise<ActionResult<Calculation[]>>;
    getPaginated(params: PaginationParams): Promise<ActionResult<PaginatedResult<Calculation>>>;
    create(calc: Partial<Calculation>, userId: string): Promise<ActionResult<Calculation>>;
    update(id: string | number, updates: Partial<Calculation>): Promise<ActionResult<Calculation>>;
    delete(id: string | number): Promise<VoidResult>;
    assignToMe(id: string | number, managerId: string): Promise<ActionResult<Calculation>>;
    adjustExpert(
        id: string | number,
        results: CalculationResults,
        adjustments: Record<string, unknown>,
        version: number
    ): Promise<ActionResult<Calculation>>;
    uploadReceipt(id: string | number, file: File, userId: string): Promise<ActionResult<string>>;
    getSignedReceiptUrl(path: string): Promise<ActionResult<string>>;
    acquireLock(id: string | number): Promise<ActionResult<Calculation>>;
    releaseLock(id: string | number): Promise<ActionResult<Calculation>>;
}

export class CalculationService implements ICalculationService {
    private repository: ICalculationRepository;

    constructor(repository: ICalculationRepository) {
        this.repository = repository;
    }

    private wrapError(error: unknown): { message: string } {
        return { message: error instanceof Error ? error.message : String(error) };
    }

    async getMyCalculations(userId: string): Promise<ActionResult<Calculation[]>> {
        if (!userId) return { success: false, error: { message: 'User ID is required' } };
        return this.repository.getByUserId(userId);
    }

    async getCalculation(id: string | number): Promise<ActionResult<Calculation>> {
        return this.repository.getById(id);
    }

    async getUnassigned(): Promise<ActionResult<Calculation[]>> {
        return this.repository.getUnassigned();
    }

    async getManagerWorkload(managerId: string): Promise<ActionResult<Calculation[]>> {
        return this.repository.getManagerWorkload(managerId);
    }

    async getPaginated(
        params: PaginationParams
    ): Promise<ActionResult<PaginatedResult<Calculation>>> {
        return this.repository.getPaginated(params);
    }

    async create(calc: Partial<Calculation>, userId: string): Promise<ActionResult<Calculation>> {
        if (!userId) return { success: false, error: { message: 'User ID is required' } };
        return this.repository.create(calc, userId);
    }

    async update(
        id: string | number,
        updates: Partial<Calculation>
    ): Promise<ActionResult<Calculation>> {
        try {
            const finalUpdates = { ...updates };

            if (updates.results?.summary) {
                finalUpdates.totalCost = calculateTotalCost(updates.results.summary);
            }

            if (updates.status) {
                let action: string = updates.status;
                switch (updates.status) {
                    case CALCULATION_STATUS.SENT:
                        action = CALCULATION_ACTION.SUBMIT;
                        break;
                    case CALCULATION_STATUS.INVOICE:
                        action = CALCULATION_ACTION.APPROVE;
                        break;
                    case CALCULATION_STATUS.CHANGES:
                        action = CALCULATION_ACTION.REJECT;
                        break;
                    case CALCULATION_STATUS.REVISION:
                        action = CALCULATION_ACTION.RESOLVE;
                        break;
                    case CALCULATION_STATUS.PAID:
                        action = CALCULATION_ACTION.ACCEPT_PAYMENT;
                        break;
                    case CALCULATION_STATUS.PAYMENT_REVIEW:
                        action = CALCULATION_ACTION.SUBMIT_PAYMENT;
                        break;
                }

                const currentRes = await this.repository.getById(id);
                if (!currentRes.success || !currentRes.data) return currentRes;

                const current = currentRes.data;
                if (
                    current.status === CALCULATION_STATUS.PAYMENT_REVIEW &&
                    updates.status === CALCULATION_STATUS.INVOICE
                ) {
                    action = CALCULATION_ACTION.REJECT_PAYMENT;
                }

                const contentUpdates: Partial<Calculation> = { ...finalUpdates };
                delete contentUpdates.status;

                if (Object.keys(contentUpdates).length > 0) {
                    const upRes = await this.repository.updateContent(id, contentUpdates);
                    if (!upRes.success) return upRes;
                }

                return this.repository.executeAction(id, action);
            }

            return this.repository.updateContent(id, finalUpdates);
        } catch (error: unknown) {
            const errMsg = error instanceof Error ? error.message : String(error);
            await this.recordError(id, `Update Error: ${errMsg}`);
            return { success: false, error: this.wrapError(error) };
        }
    }

    private async recordError(id: string | number, message: string) {
        try {
            await this.repository.executeAction(id, 'log_error', message);
        } catch (e) {
            logger.error('Failed to record error in audit trail', { error: e });
        }
    }

    async delete(id: string | number): Promise<VoidResult> {
        return this.repository.delete(id);
    }

    async assignToMe(id: string | number, managerId: string): Promise<ActionResult<Calculation>> {
        const res = await this.repository.executeAction(
            id,
            'assign',
            'Project assigned to expert',
            { manager_id: managerId }
        );
        if (!res.success) {
            const errMsg = res.error?.message || 'Assignment failure';
            await this.recordError(id, `Assignment Error: ${errMsg}`);
        }
        return res;
    }

    async adjustExpert(
        id: string | number,
        results: CalculationResults,
        adjustments: Record<string, unknown>,
        version: number
    ): Promise<ActionResult<Calculation>> {
        const res = await this.repository.adjustCalculationExpert(
            id,
            results,
            adjustments,
            version
        );
        if (!res.success) {
            const errMsg = res.error?.message || 'Adjustment failure';
            await this.recordError(id, `Expert Adjustment Error: ${errMsg}`);
        }
        return res;
    }

    async uploadReceipt(
        id: string | number,
        file: File,
        userId: string
    ): Promise<ActionResult<string>> {
        try {
            const fileExt = file.name.split('.').pop();
            const fileName = `receipt_${Date.now()}.${fileExt}`;
            const filePath = `${userId}/${id}/${fileName}`;

            const res = await this.repository.uploadFile(filePath, file, 'receipts');
            if (!res.success) {
                const errMsg = res.error?.message || 'Upload failure';
                await this.recordError(id, `Receipt Upload Error: ${errMsg}`);
                return { success: false, error: res.error };
            }
            return { success: true, data: filePath };
        } catch (error: unknown) {
            const errMsg = error instanceof Error ? error.message : String(error);
            await this.recordError(id, `Receipt Upload Error: ${errMsg}`);
            return { success: false, error: this.wrapError(error) };
        }
    }

    async getSignedReceiptUrl(path: string): Promise<ActionResult<string>> {
        return this.repository.createSignedUrl(path, 'receipts', 3600);
    }

    async acquireLock(id: string | number): Promise<ActionResult<Calculation>> {
        return this.repository.acquireLock(id);
    }

    async releaseLock(id: string | number): Promise<ActionResult<Calculation>> {
        return this.repository.releaseLock(id);
    }
}
