import { BaseChatRepository } from './BaseChatRepository';
import { type Message } from '../types';
import { type PaginationParams, type PaginatedResult, calculateOffset, createPaginatedResult } from '@/core/types/pagination';
import type { ActionResult, VoidResult } from '@/core/types/results';

export class ProjectChatRepository extends BaseChatRepository {
    async getCalculationMessages(calculationId: string): Promise<ActionResult<Message[]>> {
        try {
            const { data, error } = await this.client
                .from('messages')
                .select('*')
                .eq('calculation_id', calculationId)
                .order('created_at', { ascending: true });

            if (error) {
                this.logger.error('Failed to fetch calculation messages', { calculationId }, error);
                return { success: false, error: this.wrapError(error) };
            }

            return this.validateMessages(data);
        } catch (error) {
            return { success: false, error: this.wrapError(error) };
        }
    }

    async getCalculationMessagesPaginated(
        calculationId: string,
        pagination?: PaginationParams
    ): Promise<ActionResult<PaginatedResult<Message>>> {
        try {
            const { from, to } = calculateOffset(pagination);
            const { data, error, count } = await this.client
                .from('messages')
                .select('*', { count: 'exact' })
                .eq('calculation_id', calculationId)
                .order('created_at', { ascending: false })
                .range(from, to);

            if (error) {
                this.logger.error('Failed to fetch paginated calculation messages', { calculationId }, error);
                return { success: false, error: this.wrapError(error) };
            }

            const validated = this.validateMessages(data);
            if (!validated.success || !validated.data) {
                return { success: false, error: validated.error || { message: 'Validation failed' } };
            }

            return {
                success: true,
                data: createPaginatedResult(validated.data.reverse(), pagination, count || 0),
            };
        } catch (error) {
            return { success: false, error: this.wrapError(error) };
        }
    }

    async getCalculationMessagesDelta(
        calculationId: string,
        afterTimestamp: string
    ): Promise<ActionResult<Message[]>> {
        try {
            const { data, error } = await this.client
                .from('messages')
                .select('*')
                .eq('calculation_id', calculationId)
                .gt('updated_at', afterTimestamp)
                .order('created_at', { ascending: true });

            if (error) return { success: false, error: this.wrapError(error) };
            return this.validateMessages(data);
        } catch (error) {
            return { success: false, error: this.wrapError(error) };
        }
    }

    async getCalculationMessagesDeltaBySeq(
        calculationId: string,
        afterSeqId: number
    ): Promise<ActionResult<Message[]>> {
        try {
            const { data, error } = await this.client
                .from('messages')
                .select('*')
                .eq('calculation_id', calculationId)
                .gt('sequence_id', afterSeqId)
                .order('sequence_id', { ascending: true });

            if (error) return { success: false, error: this.wrapError(error) };
            return this.validateMessages(data);
        } catch (error) {
            return { success: false, error: this.wrapError(error) };
        }
    }

    async sendProjectMessage(
        senderId: string,
        projectId: string,
        content: string,
        options: { metadata?: Record<string, unknown>, image_url?: string, voice_url?: string, voice_duration?: number, client_message_id?: string } = {}
    ): Promise<ActionResult<Message>> {
        try {
            const { data, error } = await this.client
                .from('messages')
                .insert({
                    sender_id: senderId,
                    calculation_id: projectId,
                    content,
                    metadata: options.metadata || {},
                    image_url: options.image_url,
                    voice_url: options.voice_url,
                    voice_duration: options.voice_duration,
                    client_message_id: options.client_message_id,
                })
                .select('*')
                .single();

            if (error) {
                this.logger.error('Failed to send project message', { senderId, projectId }, error);
                return { success: false, error: this.wrapError(error) };
            }

            return this.validateMessage(data);
        } catch (error) {
            return { success: false, error: this.wrapError(error) };
        }
    }

    async markProjectAsRead(projectId: string, currentUserId: string): Promise<VoidResult> {
        try {
            const { error } = await this.client.rpc('mark_project_messages_read', {
                p_project_id: projectId,
                p_user_id: currentUserId,
            });

            if (error) {
                this.logger.error('Failed to mark project messages as read', { projectId }, error);
                return { success: false, error: this.wrapError(error) };
            }
            return { success: true };
        } catch (error) {
            return { success: false, error: this.wrapError(error) };
        }
    }

    async clearProjectHistory(calculationId: string): Promise<VoidResult> {
        try {
            const { error } = await this.client
                .from('messages')
                .delete()
                .eq('calculation_id', calculationId);

            if (error) return { success: false, error: this.wrapError(error) };
            return { success: true };
        } catch (error) {
            return { success: false, error: this.wrapError(error) };
        }
    }
}
