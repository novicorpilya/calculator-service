import { type IChatRepository } from '../repositories/ChatRepository';
import { type IBroadcastService } from './BroadcastService';
import {
    type Message,
    type ChatRecipient,
    type UnreadCounts,
    type MessageCreatePayload,
    type MessageEventType,
    type ChatEventPayload,
} from '../types';
import type { ActionResult, VoidResult } from '@/core/types/results';
import type { PaginationParams, PaginatedResult } from '@/core/types/pagination';

export interface IChatService {
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
    sendMessage(payload: MessageCreatePayload): Promise<ActionResult<Message>>;
    deleteMessage(messageId: string): Promise<VoidResult>;
    editMessage(messageId: string, content: string): Promise<VoidResult>;
    markDirectAsRead(senderId: string, receiverId: string): Promise<VoidResult>;
    markProjectAsRead(calculationId: string, userId: string): Promise<VoidResult>;
    getRecipients(userId: string): Promise<ActionResult<ChatRecipient[]>>;
    getUnreadCounts(userId: string): Promise<ActionResult<UnreadCounts>>;
    clearHistory(userId: string, contactId: string): Promise<VoidResult>;
    uploadAttachment(file: File): Promise<ActionResult<string>>;
    uploadVoiceMessage(blob: Blob): Promise<ActionResult<string>>;
    syncReadStatus(
        calculation: { id: string | number },
        currentUser: { id: string }
    ): Promise<boolean>;
    sendSyncSignal(calcId: string | number, type: string): Promise<ActionResult<void>>;
    subscribeToMessages(
        callback: (payload: ChatEventPayload, eventType: MessageEventType) => void,
        calculationId?: string,
        userId?: string
    ): () => void;
    subscribeToProjects(
        callback: (payload: { id: string | number; isSignal?: boolean }) => void
    ): () => void;
}

export class ChatService implements IChatService {
    private repository: IChatRepository;
    private broadcast: IBroadcastService;

    constructor(repository: IChatRepository, broadcast: IBroadcastService) {
        this.repository = repository;
        this.broadcast = broadcast;
    }

    async getMessages(userId: string, contactId: string): Promise<ActionResult<Message[]>> {
        return this.repository.getMessages(userId, contactId);
    }

    async getMessagesPaginated(
        userId: string,
        contactId: string,
        pagination?: PaginationParams
    ): Promise<ActionResult<PaginatedResult<Message>>> {
        return this.repository.getMessagesPaginated(userId, contactId, pagination);
    }

    async getCalculationMessages(calculationId: string): Promise<ActionResult<Message[]>> {
        return this.repository.getCalculationMessages(calculationId);
    }

    async getCalculationMessagesPaginated(
        calculationId: string,
        pagination?: PaginationParams
    ): Promise<ActionResult<PaginatedResult<Message>>> {
        return this.repository.getCalculationMessagesPaginated(calculationId, pagination);
    }

    async sendMessage(payload: MessageCreatePayload): Promise<ActionResult<Message>> {
        const { calculation_id, receiver_id, sender_id, content, ...metadata } = payload;

        if (!calculation_id && !receiver_id) {
            return {
                success: false,
                error: { message: 'Either calculation_id or receiver_id must be provided' },
            };
        }

        const res = calculation_id
            ? await this.repository.sendProjectMessage(sender_id, calculation_id, content, metadata)
            : await this.repository.sendDirectMessage(sender_id, receiver_id!, content, metadata);

        if (res.success && res.data) {
            // ACTIVE PUSH: Notify others immediately via broadcast (Fast Path)
            await this.broadcast.broadcastNewMessage(res.data);
        }

        return res;
    }

    async deleteMessage(messageId: string): Promise<VoidResult> {
        return this.repository.deleteMessage(messageId);
    }

    async editMessage(messageId: string, content: string): Promise<VoidResult> {
        return this.repository.editMessage(messageId, content);
    }

    async markDirectAsRead(senderId: string, receiverId: string): Promise<VoidResult> {
        const res = await this.repository.markDirectAsRead(senderId, receiverId);
        if (res?.success) {
            await this.broadcast.broadcastMessagesRead(receiverId, undefined, receiverId);
        }
        return res || { success: false, error: { message: 'Failed to mark as read' } };
    }

    async markProjectAsRead(calculationId: string, userId: string): Promise<VoidResult> {
        const res = await this.repository.markProjectAsRead(calculationId, userId);
        if (res?.success) {
            await this.broadcast.broadcastMessagesRead(userId, calculationId, userId);
        }
        return res || { success: false, error: { message: 'Failed to mark as read' } };
    }

    async syncReadStatus(
        calculation: { id: string | number },
        currentUser: { id: string }
    ): Promise<boolean> {
        if (!calculation?.id || !currentUser?.id) return false;

        const calcIdStr = String(calculation.id);
        const res = await this.markProjectAsRead(calcIdStr, currentUser.id);
        return res.success;
    }

    async getRecipients(userId: string): Promise<ActionResult<ChatRecipient[]>> {
        return this.repository.getRecipients(userId);
    }

    async getUnreadCounts(userId: string): Promise<ActionResult<UnreadCounts>> {
        return this.repository.getUnreadCounts(userId);
    }

    async clearHistory(userId: string, contactId: string): Promise<VoidResult> {
        const res = await this.repository.clearHistory(userId, contactId);
        if (res.success) {
            await this.broadcast.broadcastClearHistory(userId, contactId);
        }
        return res;
    }

    async uploadAttachment(file: File): Promise<ActionResult<string>> {
        return this.repository.uploadFile(file, 'attachments');
    }

    async uploadVoiceMessage(blob: Blob): Promise<ActionResult<string>> {
        return this.repository.uploadFile(blob, 'voice-messages');
    }

    async sendSyncSignal(
        calcId: string | number,
        type: string = 'UPDATE'
    ): Promise<ActionResult<void>> {
        try {
            await this.broadcast.broadcastProjectPulse(calcId, type);
            return { success: true };
        } catch {
            return { success: false, error: { message: 'Failed to broadcast project pulse' } };
        }
    }

    subscribeToMessages(
        callback: (payload: ChatEventPayload, eventType: MessageEventType) => void,
        calculationId?: string,
        userId?: string
    ): () => void {
        return this.broadcast.subscribeToMessages(callback, calculationId, userId);
    }
    subscribeToProjects(
        callback: (payload: { id: string | number; isSignal?: boolean }) => void
    ): () => void {
        return this.broadcast.subscribeToProjects((p) => {
            callback({ id: p.id, isSignal: p.isSignal });
        });
    }
}
