import { BaseChatRepository } from './BaseChatRepository';
import type { Message } from '../types';
import type { ActionResult, VoidResult } from '@/core/types/results';

export class CommonChatRepository extends BaseChatRepository {
    async getMessageById(id: string): Promise<ActionResult<Message>> {
        try {
            const { data, error } = await this.client
                .from('messages')
                .select('*')
                .eq('id', id)
                .single();

            if (error) return { success: false, error: this.wrapError(error) };
            return this.validateMessage(data);
        } catch (error) {
            return { success: false, error: this.wrapError(error) };
        }
    }

    async deleteMessage(id: string): Promise<VoidResult> {
        try {
            const { error } = await this.client.from('messages').delete().eq('id', id);
            if (error) return { success: false, error: this.wrapError(error) };
            return { success: true };
        } catch (error) {
            return { success: false, error: this.wrapError(error) };
        }
    }

    async editMessage(id: string, content: string): Promise<VoidResult> {
        try {
            const { error } = await this.client
                .from('messages')
                .update({
                    content,
                    is_edited: true,
                })
                .eq('id', id);

            if (error) {
                this.logger.error('Failed to edit message', { id }, error);
                return { success: false, error: this.wrapError(error) };
            }
            return { success: true };
        } catch (error) {
            return { success: false, error: this.wrapError(error) };
        }
    }
}
