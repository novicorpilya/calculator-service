import { type IChatRepository } from '../repositories/ChatRepository';
import { type IBroadcastService } from './BroadcastService';
import { type Message, type ChatRecipient, type UnreadCounts, type MessageCreatePayload } from '../types';
import { type PaginationParams, type PaginatedResult, DEFAULT_PAGE_SIZE } from '@/core/types/pagination';

export interface IChatService {
    getMessages(userId: string, contactId: string): Promise<Message[]>;
    getCalculationMessages(calculationId: string): Promise<Message[]>;
    getMessagesPaginated(userId: string, contactId: string, pagination?: PaginationParams): Promise<PaginatedResult<Message>>;
    sendMessage(params: MessageCreatePayload): Promise<Message>;
    deleteMessage(messageId: string): Promise<void>;
    editMessage(messageId: string, content: string): Promise<void>;
    markAsRead(contactId: string, userId: string, calculationId?: string): Promise<void>;
    getRecipients(userId: string): Promise<ChatRecipient[]>;
    getUnreadCounts(userId: string): Promise<UnreadCounts>;
    uploadAttachment(file: File): Promise<string>;
    uploadVoiceMessage(blob: Blob): Promise<string>;
    clearHistory(userId: string, contactId: string): Promise<void>;
    clearProjectHistory(calculationId: string): Promise<void>;
    subscribeToMessages(callback: (msg: Message, eventType: 'INSERT' | 'UPDATE' | 'DELETE') => void, calculationId?: string): () => void;
    subscribeToProjects(callback: (payload: { id: string; type: string; ts: number; isSignal?: boolean }) => void): () => void;
    sendSyncSignal(calcId: string | number, type: string): Promise<void>;
}

export class ChatService implements IChatService {
    private repository: IChatRepository;
    private broadcast: IBroadcastService;

    constructor(
        repository: IChatRepository,
        broadcast: IBroadcastService
    ) {
        this.repository = repository;
        this.broadcast = broadcast;
    }

    async getMessages(userId: string, contactId: string): Promise<Message[]> {
        if (!userId || !contactId) return [];
        return this.repository.getMessages(userId, contactId);
    }

    async getCalculationMessages(calculationId: string): Promise<Message[]> {
        if (!calculationId) return [];
        return this.repository.getCalculationMessages(calculationId);
    }

    /**
     * Get messages with pagination support.
     * Used for infinite scroll in chat UI.
     */
    async getMessagesPaginated(
        userId: string,
        contactId: string,
        pagination: PaginationParams = { page: 1, pageSize: DEFAULT_PAGE_SIZE }
    ): Promise<PaginatedResult<Message>> {
        if (!userId || !contactId) {
            return {
                data: [],
                pagination: {
                    page: pagination.page,
                    pageSize: pagination.pageSize,
                    total: 0,
                    totalPages: 0,
                    hasMore: false,
                    hasPrevious: false,
                },
            };
        }
        return this.repository.getMessagesPaginated(userId, contactId, pagination);
    }

    async sendMessage(params: MessageCreatePayload): Promise<Message> {
        const message = await this.repository.sendMessage(params);

        // Broadcast notification
        await this.broadcast.broadcastNewMessage(message, params.calculation_id);

        return message;
    }

    async deleteMessage(messageId: string): Promise<void> {
        await this.repository.deleteMessage(messageId);
        await this.broadcast.broadcastMessageDelete(messageId);
    }

    async editMessage(messageId: string, content: string): Promise<void> {
        await this.repository.editMessage(messageId, content);
        // We might want to broadcast a full message update or just the content
        await this.broadcast.broadcastMessageUpdate({ id: messageId, content, is_edited: true });
    }

    async markAsRead(contactId: string, userId: string, calculationId?: string): Promise<void> {
        await this.repository.markAsRead(contactId, userId, calculationId);
        await this.broadcast.broadcastMessagesRead(userId);
    }

    async getRecipients(userId: string): Promise<ChatRecipient[]> {
        return this.repository.getRecipients(userId);
    }

    async getUnreadCounts(userId: string): Promise<UnreadCounts> {
        return this.repository.getUnreadCounts(userId);
    }

    async uploadAttachment(file: File): Promise<string> {
        return this.repository.uploadFile(file, 'attachments');
    }

    async uploadVoiceMessage(blob: Blob): Promise<string> {
        return this.repository.uploadFile(blob, 'voice-messages');
    }

    async clearHistory(userId: string, contactId: string): Promise<void> {
        await this.repository.clearHistory(userId, contactId);
        await this.broadcast.broadcastClearHistory(userId, contactId);
    }

    async clearProjectHistory(calculationId: string): Promise<void> {
        await this.repository.clearProjectHistory(calculationId);
        // Note: Storage cleanup logic is currently in the old service. 
        // In a real production app, we would handle this via a dedicated MediaService or here.
    }

    /**
     * Subscribe to real-time message updates
     */
    subscribeToMessages(
        callback: (msg: Message, eventType: 'INSERT' | 'UPDATE' | 'DELETE') => void,
        calculationId?: string
    ): () => void {
        return this.broadcast.subscribeToMessages(callback, calculationId);
    }

    subscribeToProjects(callback: (payload: { id: string; type: string; ts: number; isSignal?: boolean }) => void): () => void {
        return this.broadcast.subscribeToProjects(callback);
    }

    async sendSyncSignal(calcId: string | number, type: string = 'UPDATE'): Promise<void> {
        await this.broadcast.broadcastProjectPulse(calcId, type);
    }
}
