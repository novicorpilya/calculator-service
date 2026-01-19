import { type IChatRepository } from '../repositories/ChatRepository';
import { type IBroadcastService } from './BroadcastService';
import { chatStorage, ChatStorage } from './ChatStorage';
import {
    type Message,
    type ChatRecipient,
    type UnreadCounts,
    type MessageCreatePayload,
    type MessageEventType,
    type ChatEventPayload,
    type MessageAckPayload,
    type TombstonePayload,
} from '../types';
import type { ActionResult, VoidResult } from '@/core/types/results';
import type { PaginationParams, PaginatedResult } from '@/core/types/pagination';
import { logger } from '@/core/logging';

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
    sendMediaMessage(file: File | Blob, payload: MessageCreatePayload): Promise<ActionResult<Message>>;
    markDirectAsRead(senderId: string, receiverId: string): Promise<VoidResult>;
    markProjectAsRead(calculationId: string, userId: string): Promise<VoidResult>;
    markAllAsRead(userId: string): Promise<VoidResult>;
    getRecipients(userId: string): Promise<ActionResult<ChatRecipient[]>>;
    getUnreadCounts(userId: string): Promise<ActionResult<UnreadCounts>>;
    getMessagesDelta(
        userId: string,
        contactId: string,
        afterTimestamp: string
    ): Promise<ActionResult<Message[]>>;
    getCalculationMessagesDelta(
        calculationId: string,
        afterTimestamp: string
    ): Promise<ActionResult<Message[]>>;
    getMessagesDeltaBySeq(
        userId: string,
        contactId: string,
        afterSeqId: number
    ): Promise<ActionResult<Message[]>>;
    getCalculationMessagesDeltaBySeq(
        calculationId: string,
        afterSeqId: number
    ): Promise<ActionResult<Message[]>>;
    getDeletedMessagesDelta(
        userId: string,
        contactId: string,
        afterTimestamp: string
    ): Promise<ActionResult<TombstonePayload[]>>;
    clearHistory(userId: string, contactId: string): Promise<VoidResult>;
    uploadAttachment(file: File): Promise<ActionResult<string>>;
    uploadVoiceMessage(blob: Blob): Promise<ActionResult<string>>;
    syncReadStatus(
        calculation: { id: string | number },
        currentUser: { id: string }
    ): Promise<boolean>;
    sendSyncSignal(calcId: string | number, type: string): Promise<ActionResult<void>>;
    broadcastMessageAck(ack: MessageAckPayload): Promise<boolean>;
    subscribeToMessages(
        callback: (payload: ChatEventPayload, eventType: MessageEventType) => void,
        calculationId?: string,
        userId?: string
    ): () => void;
    subscribeToProjects(
        callback: (payload: { id: string | number; isSignal?: boolean }) => void
    ): () => void;
    processOutbox(): Promise<void>;
}

export class ChatService implements IChatService {
    private repository: IChatRepository;
    private broadcast: IBroadcastService;
    private storage: ChatStorage;
    private isProcessingOutbox = false;

    constructor(repository: IChatRepository, broadcast: IBroadcastService) {
        this.repository = repository;
        this.broadcast = broadcast;
        this.storage = chatStorage;
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
        const { calculation_id, receiver_id, sender_id, content, image_url, voice_url, voice_duration, client_message_id, ...metadata } = payload;

        if (!calculation_id && !receiver_id) {
            return {
                success: false,
                error: { message: 'Either calculation_id or receiver_id must be provided' },
            };
        }

        // Check if online
        if (!navigator.onLine) {
            await this.storage.addToOutbox({
                type: 'SEND_MESSAGE',
                payload,
                createdAt: new Date().toISOString(),
                status: 'pending',
            });
            return { success: false, error: { message: 'Offline: Message added to outbox' } };
        }

        const options = {
            metadata,
            image_url: image_url || undefined,
            voice_url: voice_url || undefined,
            voice_duration: voice_duration || undefined,
            client_message_id: client_message_id || undefined
        };

        const res = calculation_id
            ? await this.repository.sendProjectMessage(sender_id, calculation_id, content || '', options)
            : await this.repository.sendDirectMessage(sender_id, receiver_id!, content || '', options);

        if (res.success && res.data) {
            await this.storage.saveMessages([res.data]);
            // Fire-and-forget broadcast. ACK is for UI only, retry is pointless since DB already has the message.
            this.broadcast.broadcastNewMessage(res.data);
        }

        return res;
    }

    async deleteMessage(messageId: string): Promise<VoidResult> {
        if (!navigator.onLine) {
            await this.storage.addToOutbox({
                type: 'DELETE_MESSAGE',
                payload: { messageId },
                createdAt: new Date().toISOString(),
                status: 'pending'
            });
            return { success: true };
        }

        const messageRes = await this.repository.getMessageById(messageId);
        if (!messageRes.success || !messageRes.data) return { success: false, error: messageRes.error };

        const res = await this.repository.deleteMessage(messageId);
        if (res.success) {
            await this.broadcast.broadcastMessageDelete(messageRes.data);
        }
        return res;
    }

    async editMessage(messageId: string, content: string): Promise<VoidResult> {
        if (!navigator.onLine) {
            await this.storage.addToOutbox({
                type: 'EDIT_MESSAGE',
                payload: { messageId, content },
                createdAt: new Date().toISOString(),
                status: 'pending'
            });
            // Optimistic local update
            await this.storage.updateMessage(messageId, { content, is_edited: true });
            return { success: true };
        }

        const res = await this.repository.editMessage(messageId, content);
        if (res.success) {
            const messageRes = await this.repository.getMessageById(messageId);
            if (messageRes.success && messageRes.data) {
                await this.broadcast.broadcastMessageUpdate(messageRes.data);
            }
        }
        return res;
    }

    async sendMediaMessage(file: File | Blob, payload: MessageCreatePayload): Promise<ActionResult<Message>> {
        if (!navigator.onLine) {
            await this.storage.addToOutbox({
                type: 'UPLOAD_MEDIA',
                payload: { file, messagePayload: payload },
                createdAt: new Date().toISOString(),
                status: 'pending'
            });
            return { success: false, error: { message: 'Offline: Media added to outbox' } };
        }

        const bucket = file instanceof File ? 'attachments' : 'voice-messages';
        const uploadRes = await this.repository.uploadFile(file, bucket);
        if (!uploadRes.success || !uploadRes.data) return { success: false, error: uploadRes.error };

        const finalPayload = {
            ...payload,
            image_url: bucket === 'attachments' ? uploadRes.data : undefined,
            voice_url: bucket === 'voice-messages' ? uploadRes.data : undefined,
        };

        return this.sendMessage(finalPayload);
    }

    async markDirectAsRead(senderId: string, receiverId: string): Promise<VoidResult> {
        if (!navigator.onLine) {
            await this.storage.addToOutbox({
                type: 'MARK_READ',
                payload: { senderId, receiverId },
                createdAt: new Date().toISOString(),
                status: 'pending',
            });
            return { success: true };
        }

        const res = await this.repository.markDirectAsRead(senderId, receiverId);
        if (res?.success) {
            await this.broadcast.broadcastMessagesRead(senderId, undefined, receiverId);
        }
        return res || { success: false, error: { message: 'Failed to mark as read' } };
    }

    async markProjectAsRead(calculationId: string, userId: string): Promise<VoidResult> {
        const res = await this.repository.markProjectAsRead(calculationId, userId);
        if (res?.success) {
            // Find who to notify about the read event (the other party)
            const calcRes = await this.repository.getCalculationMessages(calculationId);
            let otherUserId: string | undefined;
            
            if (calcRes.success && calcRes.data && calcRes.data.length > 0) {
                // Find someone who sent a message to us
                const lastMsgFromOther = calcRes.data.find(m => m.sender_id !== userId);
                otherUserId = lastMsgFromOther?.sender_id || undefined;
            }

            // If we couldn't find from messages, the repository already has logic to find users 
            // but for speed we just broadcast to the room + the identified user.
            await this.broadcast.broadcastMessagesRead(otherUserId || userId, calculationId, userId);
        }
        return res || { success: false, error: { message: 'Failed to mark as read' } };
    }

    async markAllAsRead(userId: string): Promise<VoidResult> {
        // 1. Optimistic Broadcast: Tell all tabs/users to clear UI IMMEDIATELY
        // This is what makes badges disappear "Mgnovenno" (Instantly)
        this.broadcast.broadcastMessagesRead(userId, undefined, userId);

        // 2. Perform background DB update
        const res = await this.repository.markAllAsRead(userId);
        return res;
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

    async getMessagesDelta(
        userId: string,
        contactId: string,
        afterTimestamp: string
    ): Promise<ActionResult<Message[]>> {
        return this.repository.getMessagesDelta(userId, contactId, afterTimestamp);
    }

    async getCalculationMessagesDelta(
        calculationId: string,
        afterTimestamp: string
    ): Promise<ActionResult<Message[]>> {
        return this.repository.getCalculationMessagesDelta(calculationId, afterTimestamp);
    }

    async getMessagesDeltaBySeq(
        userId: string,
        contactId: string,
        afterSeqId: number
    ): Promise<ActionResult<Message[]>> {
        return this.repository.getMessagesDeltaBySeq(userId, contactId, afterSeqId);
    }

    async getCalculationMessagesDeltaBySeq(
        calculationId: string,
        afterSeqId: number
    ): Promise<ActionResult<Message[]>> {
        return this.repository.getCalculationMessagesDeltaBySeq(calculationId, afterSeqId);
    }

    async getDeletedMessagesDelta(
        userId: string,
        contactId: string,
        afterTimestamp: string
    ): Promise<ActionResult<TombstonePayload[]>> {
        return this.repository.getDeletedMessagesDelta(userId, contactId, afterTimestamp);
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

    async broadcastMessageAck(ack: MessageAckPayload): Promise<boolean> {
        return this.broadcast.broadcastMessageAck(ack);
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

    async processOutbox(): Promise<void> {
        if (!navigator.onLine || this.isProcessingOutbox) return;
        this.isProcessingOutbox = true;
        
        const OUTBOX_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours
        const now = Date.now();
        
        try {
            const items = await this.storage.getOutbox();
            for (const rawItem of items) {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const item = rawItem as { id: number; type: string; payload: any; createdAt: string; status: string };
                // TTL check: discard stale items
                const itemAge = now - new Date(item.createdAt).getTime();
                if (itemAge > OUTBOX_TTL_MS) {
                    logger.warn(`[Outbox] Discarding stale item (${Math.round(itemAge / 3600000)}h old)`, { type: item.type });
                    await this.storage.removeFromOutbox(item.id);
                    continue;
                }
                
                try {
                    if (item.type === 'SEND_MESSAGE') {
                        await this.sendMessage(item.payload);
                    } else if (item.type === 'MARK_READ') {
                        await this.markDirectAsRead(item.payload.senderId, item.payload.receiverId);
                    } else if (item.type === 'DELETE_MESSAGE') {
                        await this.deleteMessage(item.payload.messageId);
                    } else if (item.type === 'EDIT_MESSAGE') {
                        await this.editMessage(item.payload.messageId, item.payload.content);
                    } else if (item.type === 'UPLOAD_MEDIA') {
                        await this.sendMediaMessage(item.payload.file, item.payload.messagePayload);
                    }
                    await this.storage.removeFromOutbox(item.id);
                } catch (e) {
                    logger.error('Failed to process outbox item', { item, error: e });
                }
            }
        } finally {
            this.isProcessingOutbox = false;
        }
    }
}
