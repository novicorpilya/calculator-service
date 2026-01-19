import { BaseChatRepository } from './BaseChatRepository';
import { type Message, type TombstonePayload, UnreadCountsSchema, type UnreadCounts } from '../types';
import { type PaginationParams, type PaginatedResult, calculateOffset, createPaginatedResult } from '@/core/types/pagination';
import type { ActionResult, VoidResult } from '@/core/types/results';

export class DirectChatRepository extends BaseChatRepository {
    async getMessages(userId: string, contactId: string): Promise<ActionResult<Message[]>> {
        try {
            const { data, error } = await this.client
                .from('messages')
                .select('*')
                .or(
                    `and(sender_id.eq.${userId},receiver_id.eq.${contactId}),and(sender_id.eq.${contactId},receiver_id.eq.${userId})`
                )
                .order('created_at', { ascending: true });

            if (error) {
                this.logger.error('Failed to fetch messages', { userId, contactId }, error);
                return { success: false, error: this.wrapError(error) };
            }

            return this.validateMessages(data);
        } catch (error) {
            return { success: false, error: this.wrapError(error) };
        }
    }

    async getMessagesPaginated(
        userId: string,
        contactId: string,
        pagination?: PaginationParams
    ): Promise<ActionResult<PaginatedResult<Message>>> {
        try {
            const { from, to } = calculateOffset(pagination);
            const { data, error, count } = await this.client
                .from('messages')
                .select('*', { count: 'exact' })
                .or(
                    `and(sender_id.eq.${userId},receiver_id.eq.${contactId}),and(sender_id.eq.${contactId},receiver_id.eq.${userId})`
                )
                .order('created_at', { ascending: false })
                .range(from, to);

            if (error) {
                this.logger.error('Failed to fetch paginated messages', { userId, contactId }, error);
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

    async getMessagesDelta(
        userId: string,
        contactId: string,
        afterTimestamp: string
    ): Promise<ActionResult<Message[]>> {
        try {
            const { data, error } = await this.client
                .from('messages')
                .select('*')
                .or(
                    `and(sender_id.eq.${userId},receiver_id.eq.${contactId}),and(sender_id.eq.${contactId},receiver_id.eq.${userId})`
                )
                .gt('updated_at', afterTimestamp)
                .order('created_at', { ascending: true });

            if (error) return { success: false, error: this.wrapError(error) };
            return this.validateMessages(data);
        } catch (error) {
            return { success: false, error: this.wrapError(error) };
        }
    }

    async getMessagesDeltaBySeq(
        userId: string,
        contactId: string,
        afterSeqId: number
    ): Promise<ActionResult<Message[]>> {
        try {
            const { data, error } = await this.client
                .from('messages')
                .select('*')
                .or(
                    `and(sender_id.eq.${userId},receiver_id.eq.${contactId}),and(sender_id.eq.${contactId},receiver_id.eq.${userId})`
                )
                .gt('server_seq_id', afterSeqId)
                .order('server_seq_id', { ascending: true });

            if (error) return { success: false, error: this.wrapError(error) };
            return this.validateMessages(data);
        } catch (error) {
            return { success: false, error: this.wrapError(error) };
        }
    }

    async getDeletedMessagesDelta(
        userId: string,
        contactId: string,
        afterTimestamp: string
    ): Promise<ActionResult<TombstonePayload[]>> {
        try {
            const { data, error } = await this.client
                .from('message_tombstones')
                .select('*')
                .or(
                    `and(sender_id.eq.${userId},receiver_id.eq.${contactId}),and(sender_id.eq.${contactId},receiver_id.eq.${userId})`
                )
                .gt('deleted_at', afterTimestamp);

            if (error) return { success: false, error: this.wrapError(error) };
            return { success: true, data: data as TombstonePayload[] };
        } catch (error) {
            return { success: false, error: this.wrapError(error) };
        }
    }

    async sendDirectMessage(
        senderId: string,
        receiverId: string,
        content: string,
        options: { metadata?: Record<string, unknown>, image_url?: string, voice_url?: string, voice_duration?: number, client_message_id?: string } = {}
    ): Promise<ActionResult<Message>> {
        try {
            const { data, error } = await this.client
                .from('messages')
                .insert({
                    sender_id: senderId,
                    receiver_id: receiverId,
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
                this.logger.error('Failed to send direct message', { senderId, receiverId }, error);
                return { success: false, error: this.wrapError(error) };
            }

            return this.validateMessage(data);
        } catch (error) {
            return { success: false, error: this.wrapError(error) };
        }
    }

    async getUnreadCounts(userId: string): Promise<ActionResult<UnreadCounts>> {
        try {
            const { data, error } = await this.client.rpc('get_unread_counts_v2', {
                user_id_param: userId,
            });

            if (error) return { success: false, error: this.wrapError(error) };

            const validated = UnreadCountsSchema.safeParse(data);
            if (!validated.success) {
                return { success: false, error: { message: 'Invalid unread counts format' } };
            }

            return { success: true, data: validated.data };
        } catch (error) {
            return { success: false, error: this.wrapError(error) };
        }
    }

    async markDirectAsRead(contactId: string, currentUserId: string): Promise<VoidResult> {
        try {
            const { error } = await this.client.rpc('mark_messages_as_read_v2', {
                p_contact_id: contactId,
                p_user_id: currentUserId,
            });

            if (error) {
                this.logger.error('Failed to mark direct messages as read', { contactId }, error);
                return { success: false, error: this.wrapError(error) };
            }
            return { success: true };
        } catch (error) {
            return { success: false, error: this.wrapError(error) };
        }
    }

    async clearHistory(userId: string, contactId: string): Promise<VoidResult> {
        try {
            const { error } = await this.client.from('messages').delete().or(
                `and(sender_id.eq.${userId},receiver_id.eq.${contactId}),and(sender_id.eq.${contactId},receiver_id.eq.${userId})`
            );

            if (error) return { success: false, error: this.wrapError(error) };
            return { success: true };
        } catch (error) {
            return { success: false, error: this.wrapError(error) };
        }
    }
}
