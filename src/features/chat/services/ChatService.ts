import { type IChatRepository } from '../repositories/ChatRepository';
import { type IBroadcastService } from './BroadcastService';
import { type Message, type ChatRecipient, type UnreadCounts, type MessageCreatePayload, type MessageEventType } from '../types';
import { type PaginationParams, type PaginatedResult, DEFAULT_PAGE_SIZE } from '@/core/types/pagination';

export interface IChatService {
    getMessages(userId: string, contactId: string): Promise<Message[]>;
    getCalculationMessages(calculationId: string): Promise<Message[]>;
    getCalculationMessagesPaginated(calculationId: string, pagination?: PaginationParams): Promise<PaginatedResult<Message>>;
    getMessagesPaginated(userId: string, contactId: string, pagination?: PaginationParams): Promise<PaginatedResult<Message>>;
    sendMessage(params: MessageCreatePayload): Promise<Message>;
    deleteMessage(messageId: string): Promise<void>;
    editMessage(messageId: string, content: string): Promise<void>;
    markDirectAsRead(contactId: string, userId: string): Promise<void>;
    markProjectAsRead(projectId: string, userId: string): Promise<void>;
    syncReadStatus(calculation: { id: string | number; managerId?: string; userId?: string }, currentUser: { id: string }): Promise<boolean>;
    getRecipients(userId: string): Promise<ChatRecipient[]>;
    getUnreadCounts(userId: string): Promise<UnreadCounts>;
    uploadAttachment(file: File): Promise<string>;
    uploadVoiceMessage(blob: Blob): Promise<string>;
    clearHistory(userId: string, contactId: string): Promise<void>;
    clearProjectHistory(calculationId: string): Promise<void>;
    subscribeToMessages(callback: (msg: Message, eventType: MessageEventType) => void, calculationId?: string, userId?: string): () => void;
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

    async getCalculationMessagesPaginated(
        calculationId: string,
        pagination: PaginationParams = { page: 1, pageSize: DEFAULT_PAGE_SIZE }
    ): Promise<PaginatedResult<Message>> {
        if (!calculationId) {
            return {
                data: [],
                pagination: { page: 1, pageSize: 20, total: 0, totalPages: 0, hasMore: false, hasPrevious: false }
            };
        }
        return this.repository.getCalculationMessagesPaginated(calculationId, pagination);
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
        const { sender_id, content, calculation_id, receiver_id, ...metadata } = params;

        if (calculation_id) {
            return this.repository.sendProjectMessage(sender_id, calculation_id, content || '', metadata);
        }
        if (receiver_id) {
            return this.repository.sendDirectMessage(sender_id, receiver_id, content || '', metadata);
        }
        throw new Error('Message must have either calculation_id or receiver_id');
    }

    async deleteMessage(messageId: string): Promise<void> {
        await this.repository.deleteMessage(messageId);
    }

    async editMessage(messageId: string, content: string): Promise<void> {
        await this.repository.editMessage(messageId, content);
    }

    async markDirectAsRead(contactId: string, userId: string): Promise<void> {
        await this.repository.markDirectAsRead(contactId, userId);
        await this.broadcast.broadcastMessagesRead(userId);
    }

    async markProjectAsRead(projectId: string, userId: string): Promise<void> {
        await this.repository.markProjectAsRead(projectId, userId);
        await this.broadcast.broadcastMessagesRead(userId, projectId);
    }

    async syncReadStatus(calculation: { id: string | number; managerId?: string; userId?: string }, currentUser: { id: string }): Promise<boolean> {
        let shouldInvalidate = false;
        const calcIdStr = String(calculation.id);

        if (calculation.managerId) {
            try {
                await this.markProjectAsRead(calcIdStr, currentUser.id);
                shouldInvalidate = true;
            } catch (error) {
                // Silently log
            }
        }

        if (calculation.userId && currentUser.id !== calculation.userId) {
            try {
                await this.markProjectAsRead(calcIdStr, currentUser.id);
                shouldInvalidate = true;
            } catch (error) {
                // Silently log
            }
        }

        return shouldInvalidate;
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
        callback: (msg: Message, eventType: MessageEventType) => void,
        calculationId?: string,
        userId?: string
    ): () => void {
        return this.broadcast.subscribeToMessages(callback, calculationId, userId);
    }

    subscribeToProjects(callback: (payload: { id: string; type: string; ts: number; isSignal?: boolean }) => void): () => void {
        return this.broadcast.subscribeToProjects(callback);
    }

    async sendSyncSignal(calcId: string | number, type: string = 'UPDATE'): Promise<void> {
        await this.broadcast.broadcastProjectPulse(calcId, type);
    }
}
