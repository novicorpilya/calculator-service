import type { ICalculationRepository } from '../repositories/CalculationRepository';
import type { Calculation, CalculationResults } from '../dashboard.types';
import { ApplicationError } from '@/core/errors/AppErrors';
import { CALCULATION_STATUS, CALCULATION_ACTION } from '@/core/constants/calculation.constants';
import { calculateTotalCost } from '@/core/domain/calculator.utils';
import { logger } from '@/app/services';

export interface ICalculationService {
    getMyCalculations(userId: string): Promise<Calculation[]>;
    getCalculation(id: string | number): Promise<Calculation>;
    getUnassigned(): Promise<Calculation[]>;
    getManagerWorkload(managerId: string): Promise<Calculation[]>;
    create(calc: Partial<Calculation>, userId: string): Promise<Calculation>;
    update(id: string | number, updates: Partial<Calculation>): Promise<Calculation>;
    delete(id: string | number): Promise<void>;
    assignToMe(id: string | number, managerId: string): Promise<Calculation>;
    adjustExpert(id: string | number, results: CalculationResults, adjustments: Record<string, any>, version: number): Promise<Calculation>;
    uploadReceipt(id: string | number, file: File, userId: string): Promise<string>;
    getSignedReceiptUrl(path: string): Promise<string>;
    acquireLock(id: string | number): Promise<Calculation>;
    releaseLock(id: string | number): Promise<Calculation>;
}

export class CalculationService implements ICalculationService {
    private repository: ICalculationRepository;

    constructor(repository: ICalculationRepository) {
        this.repository = repository;
    }

    async getMyCalculations(userId: string): Promise<Calculation[]> {
        if (!userId) throw new ApplicationError('USER_ID_REQUIRED', 'User ID is required');
        return this.repository.getByUserId(userId);
    }

    async getCalculation(id: string | number): Promise<Calculation> {
        return this.repository.getById(id);
    }

    async getUnassigned(): Promise<Calculation[]> {
        return this.repository.getUnassigned();
    }

    async getManagerWorkload(managerId: string): Promise<Calculation[]> {
        return this.repository.getManagerWorkload(managerId);
    }



    // IMPLEMENTATION: Atomic Operations & Event Sourcing
    // We use a Repository pattern to abstract the data layer (Supabase RPC).
    // All state mutations (Create, Update Status) are handled atomically in the DB
    // to ensure consistency. Events are emitted by DB Triggers (CDC), not by this service,
    // to guarantee reliability (Event-Driven Architecture).

    async create(calc: Partial<Calculation>, userId: string): Promise<Calculation> {
        if (!userId) throw new ApplicationError('USER_ID_REQUIRED', 'User ID is required');

        // SECURITY: We delegate creation to a secure RPC ('create_calculation_atomic').
        // This ensures:
        // 1. user_id is forcibly taken from Auth Context (anti-spoofing).
        // 2. Initial Status is validated.
        // 3. 'calculation.created' or 'calculation.submitted' event is auto-emitted by the DB.
        return this.repository.create(calc, userId);
    }

    async update(id: string | number, updates: Partial<Calculation>): Promise<Calculation> {
        try {
            const finalUpdates = { ...updates };

            // If results are updated, recalculate total cost before saving
            if (updates.results?.summary) {
                finalUpdates.totalCost = calculateTotalCost(updates.results.summary);
            }

            if (updates.status) {
                // Determine action name
                let action: string = updates.status;
                switch (updates.status) {
                    case CALCULATION_STATUS.SENT: action = CALCULATION_ACTION.SUBMIT; break;
                    case CALCULATION_STATUS.INVOICE: action = CALCULATION_ACTION.APPROVE; break;
                    case CALCULATION_STATUS.CHANGES: action = CALCULATION_ACTION.REJECT; break;
                    case CALCULATION_STATUS.REVISION: action = CALCULATION_ACTION.RESOLVE; break;
                    case CALCULATION_STATUS.PAID: action = CALCULATION_ACTION.ACCEPT_PAYMENT; break;
                }

                const contentUpdates: Partial<Calculation> = { ...finalUpdates };
                delete contentUpdates.status;

                if (Object.keys(contentUpdates).length > 0) {
                    await this.repository.updateContent(id, contentUpdates);
                }

                return await this.repository.executeAction(id, action);
            }

            // Non-status updates (only data changes)
            return await this.repository.updateContent(id, finalUpdates);
        } catch (error: unknown) {
            const errMsg = error instanceof Error ? error.message : String(error);
            await this.recordError(id, `Update Error: ${errMsg}`);
            throw error;
        }
    }

    private async recordError(id: string | number, message: string) {
        try {
            await this.repository.executeAction(id, 'log_error', message);
        } catch (e) {
            logger.error('Failed to record error in audit trail', { error: e });
        }
    }

    async delete(id: string | number): Promise<void> {
        return this.repository.delete(id);
    }

    async assignToMe(id: string | number, managerId: string): Promise<Calculation> {
        try {
            const result = await this.repository.executeAction(id, 'assign', 'Project assigned to expert', { manager_id: managerId });

            return result;
        } catch (error: unknown) {
            const errMsg = error instanceof Error ? error.message : String(error);
            await this.recordError(id, `Assignment Error: ${errMsg}`);
            throw error;
        }
    }

    async adjustExpert(id: string | number, results: CalculationResults, adjustments: Record<string, any>, version: number): Promise<Calculation> {
        try {
            return await this.repository.adjustCalculationExpert(id, results, adjustments, version);
        } catch (error: unknown) {
            const errMsg = error instanceof Error ? error.message : String(error);
            await this.recordError(id, `Expert Adjustment Error: ${errMsg}`);
            throw error;
        }
    }

    async uploadReceipt(id: string | number, file: File, userId: string): Promise<string> {
        try {
            const fileExt = file.name.split('.').pop();
            const fileName = `receipt_${Date.now()}.${fileExt}`;
            const filePath = `${userId}/${id}/${fileName}`;

            const { error: uploadError } = await (this.repository as any).client.storage
                .from('receipts')
                .upload(filePath, file);

            if (uploadError) {
                throw new ApplicationError('UPLOAD_FAILED', uploadError.message);
            }

            return filePath;
        } catch (error: unknown) {
            const errMsg = error instanceof Error ? error.message : String(error);
            await this.recordError(id, `Receipt Upload Error: ${errMsg}`);
            throw error;
        }
    }

    async getSignedReceiptUrl(path: string): Promise<string> {
        try {
            const { data, error } = await (this.repository as any).client.storage
                .from('receipts')
                .createSignedUrl(path, 3600);

            if (error) throw error;
            return data.signedUrl;
        } catch (error: unknown) {
            logger.error('[CalculationService] Failed to get signed URL', { error });
            throw new ApplicationError('SIGNED_URL_FAILED', 'Could not retrieve file access');
        }
    }

    async acquireLock(id: string | number): Promise<Calculation> {
        return this.repository.acquireLock(id);
    }

    async releaseLock(id: string | number): Promise<Calculation> {
        return this.repository.releaseLock(id);
    }
}
