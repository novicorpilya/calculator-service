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
    getCalculationMessagesPaginated(calculationId: string, pagination?: PaginationParams): Promise<PaginatedResult<Message>>;
    getRecipients(userId: string): Promise<ChatRecipient[]>;
    getUnreadCounts(userId: string): Promise<UnreadCounts>;
    sendDirectMessage(senderId: string, receiverId: string, content: string, metadata?: any): Promise<Message>;
    sendProjectMessage(senderId: string, projectId: string, content: string, metadata?: any): Promise<Message>;
    deleteMessage(id: string): Promise<void>;
    markDirectAsRead(contactId: string, currentUserId: string): Promise<void>;
    markProjectAsRead(projectId: string, currentUserId: string): Promise<void>;
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

    async getCalculationMessagesPaginated(
        calculationId: string,
        pagination: PaginationParams = { page: 1, pageSize: DEFAULT_PAGE_SIZE }
    ): Promise<PaginatedResult<Message>> {
        const { from, to } = calculateOffset(pagination);

        const { count, error: countError } = await this.client
            .from('messages')
            .select('*', { count: 'exact', head: true })
            .eq('calculation_id', calculationId);

        if (countError) throw new InfrastructureError('COUNT_CALC_MESSAGES_FAILED', countError);

        const { data, error } = await this.client
            .from('messages')
            .select('*')
            .eq('calculation_id', calculationId)
            .order('created_at', { ascending: false })
            .range(from, to);

        if (error) throw new InfrastructureError('FETCH_CALC_MESSAGES_PAGINATED_FAILED', error);

        const messages = z.array(MessageSchema).parse(data?.reverse() || []);
        return createPaginatedResult(messages, pagination, count || 0);
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

        // Logic: Post-process RPC data to ensure consistent structures
        const mappedData = (data || []).map((item: Record<string, any>) => {
            const rawLastMessage = item.last_message || item.lastMessage;
            
            // Critical Fix: If last_message exists but lacks essential fields (like created_at),
            // it's likely a partial stale join in the DB view. Handle safely.
            let lastMessage = null;
            if (rawLastMessage && typeof rawLastMessage === 'object' && rawLastMessage.created_at) {
                lastMessage = {
                    content: rawLastMessage.content || null,
                    created_at: rawLastMessage.created_at,
                    sender_id: rawLastMessage.sender_id || null,
                    image_url: rawLastMessage.image_url || null,
                    voice_url: rawLastMessage.voice_url || null,
                };
            } else if (rawLastMessage) {
                this.logger.debug('Received partial last_message from RPC', { item_id: item.id, rawLastMessage });
            }

            return {
                ...item,
                lastMessage
            };
        });

        const validated = z.array(RecipientSchema).safeParse(mappedData);
        if (!validated.success) {
            this.logger.error('Recipient data validation failed', { error: validated.error, rawData: mappedData });
            // Return partially mapped data as fallback to avoid crashing the UI, but log the error
            return mappedData as ChatRecipient[];
        }

        return validated.data;
    }

    async getUnreadCounts(userId: string): Promise<UnreadCounts> {
        const counts: UnreadCounts = {
            total: 0,
            perSender: {},
            perProject: {}
        };

        // 1. Fetch Direct unread messages (traditional is_read logic)
        const { data: directUnread, error: directError } = await this.client
            .from('messages')
            .select('sender_id')
            .is('calculation_id', null)
            .eq('receiver_id', userId)
            .eq('is_read', false);

        if (directError) throw new InfrastructureError('FETCH_DIRECT_UNREAD_FAILED', directError);
        
        (directUnread || []).forEach((m) => {
            if (m.sender_id) {
                counts.perSender[m.sender_id] = (counts.perSender[m.sender_id] || 0) + 1;
                counts.total++;
            }
        });

        // 2. Fetch Project unread messages using Independent Markers
        const { data: markers } = await this.client
            .from('chat_read_markers')
            .select('calculation_id, last_read_at')
            .eq('user_id', userId);

        const markerMap = new Map((markers || []).map(m => [m.calculation_id, new Date(m.last_read_at).getTime()]));

        const { data: projectMsgs, error: projectError } = await this.client
            .from('messages')
            .select('sender_id, calculation_id, created_at')
            .not('calculation_id', 'is', null)
            .neq('sender_id', userId)
            .or(`receiver_id.eq.${userId},receiver_id.is.null`);

        if (projectError) throw new InfrastructureError('FETCH_PROJECT_UNREAD_FAILED', projectError);

        (projectMsgs || []).forEach((m) => {
            if (!m.calculation_id) return;
            
            const lastReadTime = markerMap.get(m.calculation_id) || 0;
            const msgTime = new Date(m.created_at).getTime();

            if (msgTime > lastReadTime) {
                const calcId = String(m.calculation_id);
                counts.perProject[calcId] = (counts.perProject[calcId] || 0) + 1;
                counts.total++;
            }
        });

        return counts;
    }

    async sendDirectMessage(senderId: string, receiverId: string, content: string, metadata: any = {}): Promise<Message> {
        const { data, error } = await this.client
            .from('messages')
            .insert({
                sender_id: senderId,
                receiver_id: receiverId,
                calculation_id: null,
                content,
                ...metadata
            })
            .select()
            .single();

        if (error) throw new InfrastructureError('SEND_DIRECT_FAILED', error);
        return MessageSchema.parse(data);
    }

    async sendProjectMessage(senderId: string, projectId: string, content: string, metadata: any = {}): Promise<Message> {
        const { data, error } = await this.client
            .from('messages')
            .insert({
                sender_id: senderId,
                receiver_id: null,
                calculation_id: projectId,
                content,
                ...metadata
            })
            .select()
            .single();

        if (error) throw new InfrastructureError('SEND_PROJECT_FAILED', error);
        return MessageSchema.parse(data);
    }

    async deleteMessage(id: string): Promise<void> {
        const { error } = await this.client.from('messages').delete().eq('id', id);
        if (error) throw new InfrastructureError('DELETE_MESSAGE_FAILED', error);
    }

    async markDirectAsRead(contactId: string, currentUserId: string): Promise<void> {
        const { error } = await this.client
            .from('messages')
            .update({ is_read: true })
            .eq('sender_id', contactId)
            .eq('receiver_id', currentUserId)
            .eq('is_read', false);

        if (error) throw new InfrastructureError('MARK_DIRECT_READ_FAILED', error);
    }

    async markProjectAsRead(projectId: string, currentUserId: string): Promise<void> {
        const { error } = await this.client
            .from('chat_read_markers')
            .upsert({
                user_id: currentUserId,
                calculation_id: projectId,
                last_read_at: new Date().toISOString()
            }, {
                onConflict: 'user_id,calculation_id'
            });

        if (error) throw new InfrastructureError('MARK_PROJECT_READ_FAILED', error);
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
