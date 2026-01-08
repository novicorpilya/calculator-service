import { type SupabaseClient } from '@supabase/supabase-js';
import { type Message, MessageSchema, type ChatRecipient, RecipientSchema, type UnreadCounts } from '../domain/schemas';
import { InfrastructureError } from '@/core/errors/AppErrors';
import { z } from 'zod';
import { type ILogger } from '@/core/logging/LogManager';
import { isValidUUID } from '@/core/validation';
import {
    type PaginationParams,
    type PaginatedResult,
    DEFAULT_PAGE_SIZE,
    calculateOffset,
    createPaginatedResult,
} from '@/core/types/pagination';

export interface IChatRepository {
    getMessages(userId: string, contactId: string): Promise<Message[]>;
    getMessagesPaginated(userId: string, contactId: string, pagination?: PaginationParams): Promise<PaginatedResult<Message>>;
    getCalculationMessages(calculationId: string): Promise<Message[]>;
    getRecipients(userId: string): Promise<ChatRecipient[]>;
    getUnreadCounts(userId: string): Promise<UnreadCounts>;
    sendMessage(message: Partial<Message>): Promise<Message>;
    deleteMessage(id: string): Promise<void>;
    markAsRead(contactId: string, currentUserId: string, calculationId?: string): Promise<void>;
    editMessage(id: string, content: string): Promise<void>;
    uploadFile(file: File | Blob, bucket: string): Promise<string>;
    clearHistory(userId: string, contactId: string): Promise<void>;
    clearProjectHistory(calculationId: string): Promise<void>;
}

export class ChatRepository implements IChatRepository {
    private client: SupabaseClient;
    private logger: ILogger;

    constructor(client: SupabaseClient, logger: ILogger) {
        this.client = client;
        this.logger = logger;
    }

    async getMessages(userId: string, contactId: string): Promise<Message[]> {
        const { data, error } = await this.client
            .from('messages')
            .select('*')
            .or(`and(sender_id.eq.${userId},receiver_id.eq.${contactId}),and(sender_id.eq.${contactId},receiver_id.eq.${userId})`)
            .order('created_at', { ascending: true });

        if (error) {
            this.logger.error('Failed to fetch messages', { userId, contactId }, error);
            throw new InfrastructureError('FETCH_MESSAGES_FAILED', error);
        }
        return z.array(MessageSchema).parse(data);
    }

    async getCalculationMessages(calculationId: string): Promise<Message[]> {
        const { data, error } = await this.client
            .from('messages')
            .select('*')
            .eq('calculation_id', calculationId)
            .order('created_at', { ascending: true });

        if (error) {
            this.logger.error('Failed to fetch calculation messages', { calculationId }, error);
            throw new InfrastructureError('FETCH_CALC_MESSAGES_FAILED', error);
        }
        return z.array(MessageSchema).parse(data);
    }

    /**
     * Fetch messages with pagination support.
     * Returns data in reverse chronological order (newest first) for infinite scroll.
     */
    async getMessagesPaginated(
        userId: string,
        contactId: string,
        pagination: PaginationParams = { page: 1, pageSize: DEFAULT_PAGE_SIZE }
    ): Promise<PaginatedResult<Message>> {
        const { from, to } = calculateOffset(pagination);

        // Get total count first
        const { count, error: countError } = await this.client
            .from('messages')
            .select('*', { count: 'exact', head: true })
            .or(`and(sender_id.eq.${userId},receiver_id.eq.${contactId}),and(sender_id.eq.${contactId},receiver_id.eq.${userId})`);

        if (countError) {
            this.logger.error('Failed to count messages', { userId, contactId }, countError);
            throw new InfrastructureError('COUNT_MESSAGES_FAILED', countError);
        }

        // Get paginated data (newest first for loading older messages)
        const { data, error } = await this.client
            .from('messages')
            .select('*')
            .or(`and(sender_id.eq.${userId},receiver_id.eq.${contactId}),and(sender_id.eq.${contactId},receiver_id.eq.${userId})`)
            .order('created_at', { ascending: false })
            .range(from, to);

        if (error) {
            this.logger.error('Failed to fetch paginated messages', { userId, contactId, pagination }, error);
            throw new InfrastructureError('FETCH_MESSAGES_PAGINATED_FAILED', error);
        }

        // Reverse to show oldest first in UI, but loaded newest first
        const messages = z.array(MessageSchema).parse(data?.reverse() || []);
        return createPaginatedResult(messages, pagination, count || 0);
    }

    async getRecipients(userId: string): Promise<ChatRecipient[]> {
        // Validation: Prevent RPC call if userId is invalid (fixes 400 Bad Request)
        if (!isValidUUID(userId)) {
            this.logger.warn('getRecipients blocked: invalid userId', { userId });
            return [];
        }

        const { data, error } = await this.client.rpc('get_chat_recipients_v2', {
            p_user_id: userId,
        });

        if (error) {
            this.logger.error('RPC get_chat_recipients_v2 failed', { userId, error });
            throw new InfrastructureError('FETCH_RECIPIENTS_FAILED', error);
        }

        // Fix: DB returns 'last_message' (snake_case), but Schema/UI expects 'lastMessage' (camelCase)
        const mappedData = (data || []).map((item: Record<string, unknown>) => ({
            ...item,
            lastMessage: item.last_message || item.lastMessage
        }));

        return z.array(RecipientSchema).parse(mappedData);
    }

    async getUnreadCounts(userId: string): Promise<UnreadCounts> {
        const { data, error } = await this.client
            .from('messages')
            .select('sender_id')
            .eq('receiver_id', userId)
            .eq('is_read', false);

        if (error) throw new InfrastructureError('FETCH_UNREAD_FAILED', error);

        const counts: Record<string, number> = {};
        (data || []).forEach((m) => {
            counts[m.sender_id] = (counts[m.sender_id] || 0) + 1;
        });
        return counts;
    }

    async sendMessage(message: Partial<Message>): Promise<Message> {
        // Strip undefined fields to prevent Supabase 400 errors
        const cleanMessage = Object.fromEntries(
            Object.entries(message).filter(([, v]) => v !== undefined)
        );

        const { data, error } = await this.client
            .from('messages')
            .insert(cleanMessage)
            .select()
            .single();

        if (error) {
            this.logger.error('Failed to send message', { payload: cleanMessage, supabaseError: error }, error);
            throw new InfrastructureError('SEND_MESSAGE_FAILED', error);
        }
        return MessageSchema.parse(data);
    }

    async deleteMessage(id: string): Promise<void> {
        const { error } = await this.client.from('messages').delete().eq('id', id);
        if (error) throw new InfrastructureError('DELETE_MESSAGE_FAILED', error);
    }

    async markAsRead(contactId: string, currentUserId: string, calculationId?: string): Promise<void> {
        let query = this.client
            .from('messages')
            .update({ is_read: true })
            .eq('sender_id', contactId)
            .eq('receiver_id', currentUserId)
            .eq('is_read', false);

        if (calculationId) {
            query = query.eq('calculation_id', calculationId);
        }

        const { error } = await query;
        if (error) throw new InfrastructureError('MARK_READ_FAILED', error);
    }

    async editMessage(id: string, content: string): Promise<void> {
        const { error } = await this.client
            .from('messages')
            .update({
                content,
                is_edited: true
            })
            .eq('id', id);

        if (error) {
            this.logger.error('Failed to edit message', { id }, error);
            throw new InfrastructureError('EDIT_MESSAGE_FAILED', error);
        }
    }

    async uploadFile(file: File | Blob, bucket: string): Promise<string> {
        const fileExt = file instanceof File ? file.name.split('.').pop() : 'webm';
        const fileName = `${crypto.randomUUID()}.${fileExt}`;
        const filePath = filePathForBucket(bucket, fileName);

        const { error: uploadError } = await this.client.storage
            .from(bucket)
            .upload(filePath, file, {
                cacheControl: '3600',
                upsert: false
            });

        if (uploadError) {
            this.logger.error(`Failed to upload to ${bucket}`, { filePath }, uploadError);
            throw new InfrastructureError('UPLOAD_FAILED', uploadError);
        }

        const { data } = this.client.storage.from(bucket).getPublicUrl(filePath);
        return data.publicUrl;
    }

    async clearHistory(userId: string, contactId: string): Promise<void> {
        const { error } = await this.client
            .from('messages')
            .delete()
            .or(`and(sender_id.eq.${userId},receiver_id.eq.${contactId}),and(sender_id.eq.${contactId},receiver_id.eq.${userId})`);

        if (error) {
            this.logger.error('Failed to clear history', { userId, contactId }, error);
            throw new InfrastructureError('CLEAR_HISTORY_FAILED', error);
        }
    }

    async clearProjectHistory(calculationId: string): Promise<void> {
        // 1. Get messages to clean up storage later if needed? 
        // Note: For now we just delete records. Storage cleanup should ideally be done in Service layer if needed.
        const { error } = await this.client
            .from('messages')
            .delete()
            .eq('calculation_id', calculationId);

        if (error) {
            this.logger.error('Failed to clear project history', { calculationId }, error);
            throw new InfrastructureError('CLEAR_PROJECT_HISTORY_FAILED', error);
        }
    }
}

function filePathForBucket(bucket: string, fileName: string): string {
    if (bucket === 'attachments') return `chat/${fileName}`;
    if (bucket === 'voice-messages') return `voice/${fileName}`;
    return fileName;
}
