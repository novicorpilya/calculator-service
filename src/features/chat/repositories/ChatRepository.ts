import { type SupabaseClient } from '@supabase/supabase-js';
import {
    type Message,
    MessageSchema,
    type ChatRecipient,
    RecipientSchema,
    type UnreadCounts,
    UnreadCountsSchema,
} from '../types';
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
import type { ActionResult, VoidResult } from '@/core/types/results';

export interface IChatRepository {
    getMessages(userId: string, contactId: string): Promise<ActionResult<Message[]>>;
    getMessagesPaginated(
        userId: string,
        contactId: string,
        pagination?: PaginationParams
    ): Promise<ActionResult<PaginatedResult<Message>>>;
    getCalculationMessages(calculationId: string): Promise<ActionResult<Message[]>>;
    getCalculationMessagesPaginated(
        calculationId: string,
        pagination?: PaginationParams
    ): Promise<ActionResult<PaginatedResult<Message>>>;
    getRecipients(userId: string): Promise<ActionResult<ChatRecipient[]>>;
    getUnreadCounts(userId: string): Promise<ActionResult<UnreadCounts>>;
    sendDirectMessage(
        senderId: string,
        receiverId: string,
        content: string,
        metadata?: Record<string, unknown>
    ): Promise<ActionResult<Message>>;
    sendProjectMessage(
        senderId: string,
        projectId: string,
        content: string,
        metadata?: Record<string, unknown>
    ): Promise<ActionResult<Message>>;
    deleteMessage(id: string): Promise<VoidResult>;
    markDirectAsRead(contactId: string, currentUserId: string): Promise<VoidResult>;
    markProjectAsRead(projectId: string, currentUserId: string): Promise<VoidResult>;
    editMessage(id: string, content: string): Promise<VoidResult>;
    uploadFile(file: File | Blob, bucket: string): Promise<ActionResult<string>>;
    clearHistory(userId: string, contactId: string): Promise<VoidResult>;
    clearProjectHistory(calculationId: string): Promise<VoidResult>;
}

export class ChatRepository implements IChatRepository {
    private client: SupabaseClient;
    private logger: ILogger;

    constructor(client: SupabaseClient, logger: ILogger) {
        this.client = client;
        this.logger = logger;
    }

    private wrapError(error: unknown): { message: string } {
        return { message: error instanceof Error ? error.message : String(error) };
    }

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

            const validated = z.array(MessageSchema).safeParse(data);
            if (!validated.success) {
                this.logger.error('Message data validation failed', { error: validated.error });
                return { success: false, error: { message: 'Data format error' } };
            }

            return { success: true, data: validated.data };
        } catch (error) {
            return { success: false, error: this.wrapError(error) };
        }
    }

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

            const validated = z.array(MessageSchema).safeParse(data);
            if (!validated.success) {
                this.logger.error('Calculation message validation failed', {
                    error: validated.error,
                });
                return { success: false, error: { message: 'Data format error' } };
            }

            return { success: true, data: validated.data };
        } catch (error) {
            return { success: false, error: this.wrapError(error) };
        }
    }

    async getCalculationMessagesPaginated(
        calculationId: string,
        pagination: PaginationParams = { page: 1, pageSize: DEFAULT_PAGE_SIZE }
    ): Promise<ActionResult<PaginatedResult<Message>>> {
        try {
            const { from, to } = calculateOffset(pagination);

            const { count, error: countError } = await this.client
                .from('messages')
                .select('*', { count: 'exact', head: true })
                .eq('calculation_id', calculationId);

            if (countError) return { success: false, error: this.wrapError(countError) };

            const { data, error } = await this.client
                .from('messages')
                .select('*')
                .eq('calculation_id', calculationId)
                .order('created_at', { ascending: false })
                .range(from, to);

            if (error) return { success: false, error: this.wrapError(error) };

            const messages = z.array(MessageSchema).parse(data?.reverse() || []);
            return { success: true, data: createPaginatedResult(messages, pagination, count || 0) };
        } catch (error) {
            return { success: false, error: this.wrapError(error) };
        }
    }

    async getMessagesPaginated(
        userId: string,
        contactId: string,
        pagination: PaginationParams = { page: 1, pageSize: DEFAULT_PAGE_SIZE }
    ): Promise<ActionResult<PaginatedResult<Message>>> {
        try {
            const { from, to } = calculateOffset(pagination);

            // Get total count first
            const { count, error: countError } = await this.client
                .from('messages')
                .select('*', { count: 'exact', head: true })
                .or(
                    `and(sender_id.eq.${userId},receiver_id.eq.${contactId}),and(sender_id.eq.${contactId},receiver_id.eq.${userId})`
                );

            if (countError) {
                this.logger.error('Failed to count messages', { userId, contactId }, countError);
                return { success: false, error: this.wrapError(countError) };
            }

            // Get paginated data (newest first for loading older messages)
            const { data, error } = await this.client
                .from('messages')
                .select('*')
                .or(
                    `and(sender_id.eq.${userId},receiver_id.eq.${contactId}),and(sender_id.eq.${contactId},receiver_id.eq.${userId})`
                )
                .order('created_at', { ascending: false })
                .range(from, to);

            if (error) {
                this.logger.error(
                    'Failed to fetch paginated messages',
                    { userId, contactId, pagination },
                    error
                );
                return { success: false, error: this.wrapError(error) };
            }

            // Reverse to show oldest first in UI, but loaded newest first
            const rawMessages = data?.reverse() || [];
            const validated = z.array(MessageSchema).safeParse(rawMessages);
            if (!validated.success) {
                this.logger.error('Paginated message validation failed', {
                    error: validated.error,
                });
                return { success: false, error: { message: 'Data format error' } };
            }

            return {
                success: true,
                data: createPaginatedResult(validated.data, pagination, count || 0),
            };
        } catch (error) {
            return { success: false, error: this.wrapError(error) };
        }
    }

    async getRecipients(userId: string): Promise<ActionResult<ChatRecipient[]>> {
        try {
            // Validation: Prevent RPC call if userId is invalid (fixes 400 Bad Request)
            if (!isValidUUID(userId)) {
                this.logger.warn('getRecipients blocked: invalid userId', { userId });
                return { success: true, data: [] };
            }

            const { data, error } = await this.client.rpc('get_chat_recipients_v2', {
                p_user_id: userId,
            });

            if (error) {
                this.logger.error('RPC get_chat_recipients_v2 failed', { userId, error });
                return { success: false, error: this.wrapError(error) };
            }

            // Logic: Post-process RPC data to ensure consistent structures
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
                } else if (rawLastMessage) {
                    this.logger.debug('Received partial last_message from RPC', {
                        item_id: item.id,
                        rawLastMessage,
                    });
                }

                return {
                    ...item,
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

    async getUnreadCounts(userId: string): Promise<ActionResult<UnreadCounts>> {
        try {
            const counts: UnreadCounts = {
                total: 0,
                perSender: {},
                perProject: {},
            };

            // 1. Fetch Direct unread messages (traditional is_read logic)
            const { data: directUnread, error: directError } = await this.client
                .from('messages')
                .select('sender_id')
                .is('calculation_id', null)
                .eq('receiver_id', userId)
                .eq('is_read', false);

            if (directError) return { success: false, error: this.wrapError(directError) };

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

            const markerMap = new Map(
                (markers || []).map((m) => [m.calculation_id, new Date(m.last_read_at).getTime()])
            );

            const { data: projectMsgs, error: projectError } = await this.client
                .from('messages')
                .select('sender_id, calculation_id, created_at')
                .not('calculation_id', 'is', null)
                .neq('sender_id', userId)
                .or(`receiver_id.eq.${userId},receiver_id.is.null`);

            if (projectError) return { success: false, error: this.wrapError(projectError) };

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

            const validated = UnreadCountsSchema.safeParse(counts);
            if (!validated.success) {
                this.logger.error('Unread counts validation failed', { error: validated.error });
                return { success: true, data: counts }; // Soft failure: return raw counts
            }

            return { success: true, data: validated.data };
        } catch (error) {
            return { success: false, error: this.wrapError(error) };
        }
    }

    async sendDirectMessage(
        senderId: string,
        receiverId: string,
        content: string,
        metadata: Record<string, unknown> = {}
    ): Promise<ActionResult<Message>> {
        try {
            const { data, error } = await this.client
                .from('messages')
                .insert({
                    sender_id: senderId,
                    receiver_id: receiverId,
                    calculation_id: null,
                    content,
                    ...metadata,
                })
                .select()
                .single();

            if (error) return { success: false, error: this.wrapError(error) };

            const validated = MessageSchema.safeParse(data);
            if (!validated.success) {
                this.logger.error('Direct message insertion validation failed', {
                    error: validated.error,
                });
                return { success: false, error: { message: 'Data format error after saving' } };
            }

            return { success: true, data: validated.data };
        } catch (error) {
            return { success: false, error: this.wrapError(error) };
        }
    }

    async sendProjectMessage(
        senderId: string,
        projectId: string,
        content: string,
        metadata: Record<string, unknown> = {}
    ): Promise<ActionResult<Message>> {
        try {
            const { data, error } = await this.client
                .from('messages')
                .insert({
                    sender_id: senderId,
                    receiver_id: null,
                    calculation_id: projectId,
                    content,
                    ...metadata,
                })
                .select()
                .single();

            if (error) return { success: false, error: this.wrapError(error) };

            const validated = MessageSchema.safeParse(data);
            if (!validated.success) {
                this.logger.error('Project message insertion validation failed', {
                    error: validated.error,
                });
                return { success: false, error: { message: 'Data format error after saving' } };
            }

            return { success: true, data: validated.data };
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

    async markDirectAsRead(contactId: string, currentUserId: string): Promise<VoidResult> {
        try {
            const { error } = await this.client
                .from('messages')
                .update({ is_read: true })
                .eq('sender_id', contactId)
                .eq('receiver_id', currentUserId)
                .eq('is_read', false);

            if (error) return { success: false, error: this.wrapError(error) };
            return { success: true };
        } catch (error) {
            return { success: false, error: this.wrapError(error) };
        }
    }

    async markProjectAsRead(projectId: string, currentUserId: string): Promise<VoidResult> {
        try {
            const { error } = await this.client.rpc('mark_messages_as_read', {
                p_calculation_id: projectId,
                p_user_id: currentUserId,
            });

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

    async uploadFile(file: File | Blob, bucket: string): Promise<ActionResult<string>> {
        try {
            const fileExt = file instanceof File ? file.name.split('.').pop() : 'webm';
            const fileName = `${crypto.randomUUID()}.${fileExt}`;
            const filePath = filePathForBucket(bucket, fileName);

            const { error: uploadError } = await this.client.storage
                .from(bucket)
                .upload(filePath, file, {
                    cacheControl: '3600',
                    upsert: false,
                });

            if (uploadError) {
                this.logger.error(`Failed to upload to ${bucket}`, { filePath }, uploadError);
                return { success: false, error: this.wrapError(uploadError) };
            }

            const { data } = this.client.storage.from(bucket).getPublicUrl(filePath);
            return { success: true, data: data.publicUrl };
        } catch (error) {
            return { success: false, error: this.wrapError(error) };
        }
    }

    async clearHistory(userId: string, contactId: string): Promise<VoidResult> {
        try {
            const { error } = await this.client
                .from('messages')
                .delete()
                .or(
                    `and(sender_id.eq.${userId},receiver_id.eq.${contactId}),and(sender_id.eq.${contactId},receiver_id.eq.${userId})`
                );

            if (error) {
                this.logger.error('Failed to clear history', { userId, contactId }, error);
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

            if (error) {
                this.logger.error('Failed to clear project history', { calculationId }, error);
                return { success: false, error: this.wrapError(error) };
            }
            return { success: true };
        } catch (error) {
            return { success: false, error: this.wrapError(error) };
        }
    }
}

function filePathForBucket(bucket: string, fileName: string): string {
    if (bucket === 'attachments') return `chat/${fileName}`;
    if (bucket === 'voice-messages') return `voice/${fileName}`;
    return fileName;
}
