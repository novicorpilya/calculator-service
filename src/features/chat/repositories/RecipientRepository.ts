import { BaseChatRepository } from './BaseChatRepository';
import { type ChatRecipient, RecipientSchema } from '../types';
import { isValidUUID } from '@/core/validation';
import { z } from 'zod';
import type { ActionResult } from '@/core/types/results';

export class RecipientRepository extends BaseChatRepository {
    async getRecipients(userId: string): Promise<ActionResult<ChatRecipient[]>> {
        try {
            if (!isValidUUID(userId)) {
                this.logger.warn('getRecipients blocked: invalid userId', { userId });
                return { success: true, data: [] };
            }

            this.logger.info('Calling RPC get_chat_recipients_v5', { userId });

            const { data, error } = await this.client.rpc('get_chat_recipients_v5', {
                p_user_id: userId,
            });

            if (error) {
                this.logger.error('RPC get_chat_recipients_v5 failed', { userId, error });
                console.error('[RecipientRepository] RPC v5 failed', error);
                return { success: false, error: this.wrapError(error) };
            }

            const mappedData = (data || []).map((item: Record<string, unknown>) => {
                const rawLastMessage = (item.last_message || item.lastMessage) as Record<
                    string,
                    unknown
                > | null;

                let lastMessage = null;
                if (
                    rawLastMessage &&
                    typeof rawLastMessage === 'object' &&
                    rawLastMessage.created_at
                ) {
                    lastMessage = {
                        id: (rawLastMessage.id as string) || null,
                        content: (rawLastMessage.content as string) || null,
                        created_at: rawLastMessage.created_at as string,
                        sender_id: (rawLastMessage.sender_id as string) || null,
                        image_url: (rawLastMessage.image_url as string) || null,
                        voice_url: (rawLastMessage.voice_url as string) || null,
                    };
                }

                return {
                    id: item.id as string,
                    organization_name: (item.organization_name as string) || null,
                    role: item.role as string,
                    first_name: (item.first_name as string) || null,
                    last_name: (item.last_name as string) || null,
                    avatar_url: (item.avatar_url as string) || null,
                    lastMessage,
                };
            });

            const validated = z.array(RecipientSchema).safeParse(mappedData);
            if (!validated.success) {
                this.logger.error('Recipient data validation failed', {
                    error: validated.error,
                    rawData: mappedData,
                });
                return { success: true, data: mappedData as ChatRecipient[] };
            }

            return { success: true, data: validated.data };
        } catch (error) {
            return { success: false, error: this.wrapError(error) };
        }
    }
}
