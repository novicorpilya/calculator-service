import type { ICalculationRepository } from '../repositories/CalculationRepository';
import type { Calculation } from '../dashboard.types';
import { ApplicationError } from '@/core/errors/AppErrors';
import { supabase } from '@/services/supabase';
import type { IChatService } from '@/features/chat/services/ChatService';
import { CALCULATION_STATUS, CALCULATION_ACTION } from '@/core/constants/calculation.constants';
import { CHAT_TEMPLATES } from '@/features/chat/constants/templates';

export interface ICalculationService {
    getMyCalculations(userId: string): Promise<Calculation[]>;
    getCalculation(id: string | number): Promise<Calculation>;
    getUnassigned(): Promise<Calculation[]>;
    getManagerWorkload(managerId: string): Promise<Calculation[]>;
    create(calc: Partial<Calculation>, userId: string): Promise<Calculation>;
    update(id: string | number, updates: Partial<Calculation>): Promise<Calculation>;
    delete(id: string | number): Promise<void>;
    assignToMe(id: string | number, managerId: string): Promise<Calculation>;
    adjustExpert(id: string | number, results: any, adjustments: any, version: number): Promise<Calculation>;
    uploadReceipt(id: string | number, file: File, userId: string): Promise<string>;
    getSignedReceiptUrl(path: string): Promise<string>;
}

export class CalculationService implements ICalculationService {
    private repository: ICalculationRepository;
    private chatService: IChatService;

    constructor(repository: ICalculationRepository, chatService: IChatService) {
        this.repository = repository;
        this.chatService = chatService;
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



    // ATOMIC CREATE
    async create(calc: Partial<Calculation>, userId: string): Promise<Calculation> {
        if (!userId) throw new ApplicationError('USER_ID_REQUIRED', 'User ID is required');

        // Use Repository AtomicRPC method
        // No client-side audit logic needed anymore
        return this.repository.create(calc, userId);
    }

    async update(id: string | number, updates: Partial<Calculation>): Promise<Calculation> {
        try {
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

                const contentUpdates: Partial<Calculation> = { ...updates };
                delete contentUpdates.status;

                if (Object.keys(contentUpdates).length > 0) {
                    await this.repository.updateContent(id, contentUpdates);
                }

                return await this.repository.executeAction(id, action);
            }

            // Non-status updates (only data changes)
            return await this.repository.updateContent(id, updates);
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
            console.error('Failed to record error in audit trail', e);
        }
    }

    async delete(id: string | number): Promise<void> {
        return this.repository.delete(id);
    }

    async assignToMe(id: string | number, managerId: string): Promise<Calculation> {
        try {
            const result = await this.repository.executeAction(id, 'assign', 'Project assigned to expert', { manager_id: managerId });

            // Send automated welcome message
            try {
                const projectNumber = result.project_number || '—';

                // Fetch manager's profile directly for accurate name
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('first_name, last_name')
                    .eq('id', managerId)
                    .single();

                let managerName = 'Ваш персональный менеджер';
                if (profile) {
                    const firstName = profile.first_name || '';
                    const lastName = profile.last_name || '';
                    const fullName = `${firstName} ${lastName}`.trim();
                    if (fullName) {
                        managerName = fullName;
                    }
                }

                const welcomeMessage = CHAT_TEMPLATES.WELCOME(managerName, projectNumber);

                if (result.user_id) {
                    await this.chatService.sendMessage({
                        calculation_id: String(id),
                        sender_id: managerId,
                        receiver_id: result.user_id,
                        content: welcomeMessage,
                    });
                }
            } catch (msgError) {
                // Non-critical: don't fail the assignment if message fails
                console.warn('[CalculationService] Failed to send welcome message:', msgError);
            }

            return result;
        } catch (error: unknown) {
            const errMsg = error instanceof Error ? error.message : String(error);
            await this.recordError(id, `Assignment Error: ${errMsg}`);
            throw error;
        }
    }

    async adjustExpert(id: string | number, results: any, adjustments: any, version: number): Promise<Calculation> {
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
            console.error('[CalculationService] Failed to get signed URL', error);
            throw new ApplicationError('SIGNED_URL_FAILED', 'Could not retrieve file access');
        }
    }
}
