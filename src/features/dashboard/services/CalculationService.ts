import type { ICalculationRepository } from '../repositories/CalculationRepository';
import type { Calculation } from '../dashboard.types';
import { ApplicationError } from '@/core/errors/AppErrors';
import { supabase } from '@/services/supabase';
import type { IChatService } from '@/features/chat/services/ChatService';

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
    getRegistry(): Promise<{ id: string | number; created_at: string }[]>;
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

    async getRegistry(): Promise<{ id: string | number; created_at: string }[]> {
        return this.repository.getRegistry();
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
                let action = '';
                switch (updates.status) {
                    case 'sent': action = 'submit'; break;
                    case 'invoice': action = 'approve'; break;
                    case 'changes': action = 'reject'; break;
                    case 'revision': action = 'resolve'; break;
                    // draft and others (paid, shipping, etc) fall through to direct update
                }

                if (action) {
                    const contentValues: Partial<Calculation> = { ...updates };
                    delete contentValues.status;

                    // Update content first if needed
                    if (Object.keys(contentValues).length > 0) {
                        await this.repository.updateContent(id, contentValues);
                    }

                    // Execute status action atomically
                    return await this.repository.executeAction(id, action);
                }
            }

            // Non-status updates or direct status changes (e.g., draft, on_hold, paid, etc.)
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
                // Fetch manager's profile for their name
                const registry = await this.repository.getRegistry();
                const projectIndex = registry.findIndex(r => String(r.id) === String(id));
                const projectNumber = projectIndex >= 0 ? projectIndex + 1 : '—';

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

                const welcomeMessage = `Здравствуйте! 👋\nМеня зовут ${managerName}, я ваш персональный менеджер по проекту #${projectNumber}.\n\nЧто я буду делать:\n\n🔍 Проверю корректность ваших расчётов и параметров\n💬 Отвечу на все вопросы по инвентарю и HACCP-стандартам\n💰 Сформирую оптимальное коммерческое предложение\n📋 Подготовлю счёт и документы к оплате\n\nЯ буду с вами на всех этапах — от проверки заявки до получения товара. Обычно на аудит и формирование предложения уходит 1-2 рабочих дня.\n\nЕсли у вас есть вопросы, специальные пожелания или дополнительные материалы (планировки, фото зон, особые требования) — пишите прямо сюда в чат или отправляйте файлы. 😊\n\nПриступаю к работе! 🚀`;

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
}
