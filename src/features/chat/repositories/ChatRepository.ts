import { type SupabaseClient } from '@supabase/supabase-js';
import {
    type Message,
    type ChatRecipient,
    type UnreadCounts,
    type TombstonePayload,
} from '../types';
import { type ILogger } from '@/core/logging/LogManager';
import {
    type PaginationParams,
    type PaginatedResult,
} from '@/core/types/pagination';
import type { ActionResult, VoidResult } from '@/core/types/results';

import { DirectChatRepository } from './DirectChatRepository';
import { ProjectChatRepository } from './ProjectChatRepository';
import { AttachmentChatRepository } from './AttachmentChatRepository';
import { CommonChatRepository } from './CommonChatRepository';
import { RecipientRepository } from './RecipientRepository';

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
    getMessageById(id: string): Promise<ActionResult<Message>>;
    getRecipients(userId: string): Promise<ActionResult<ChatRecipient[]>>;
    getUnreadCounts(userId: string): Promise<ActionResult<UnreadCounts>>;
    sendDirectMessage(
        senderId: string,
        receiverId: string,
        content: string,
        options?: { metadata?: Record<string, unknown>, image_url?: string, voice_url?: string, voice_duration?: number, client_message_id?: string }
    ): Promise<ActionResult<Message>>;
    sendProjectMessage(
        senderId: string,
        projectId: string,
        content: string,
        options?: { metadata?: Record<string, unknown>, image_url?: string, voice_url?: string, voice_duration?: number, client_message_id?: string }
    ): Promise<ActionResult<Message>>;
    deleteMessage(id: string): Promise<VoidResult>;
    markDirectAsRead(contactId: string, currentUserId: string): Promise<VoidResult>;
    markProjectAsRead(projectId: string, currentUserId: string): Promise<VoidResult>;
    editMessage(id: string, content: string): Promise<VoidResult>;
    uploadFile(file: File | Blob, bucket: string): Promise<ActionResult<string>>;
    clearHistory(userId: string, contactId: string): Promise<VoidResult>;
    clearProjectHistory(calculationId: string): Promise<VoidResult>;
}

/**
 * Facade for Chat Repositories.
 * Orchestrates specialized repositories to maintain a clean public API while 
 * segregating responsibilities.
 */
export class ChatRepository implements IChatRepository {
    private direct: DirectChatRepository;
    private project: ProjectChatRepository;
    private attachment: AttachmentChatRepository;
    private common: CommonChatRepository;
    private recipients: RecipientRepository;

    constructor(client: SupabaseClient, logger: ILogger) {
        this.direct = new DirectChatRepository(client, logger);
        this.project = new ProjectChatRepository(client, logger);
        this.attachment = new AttachmentChatRepository(client, logger);
        this.common = new CommonChatRepository(client, logger);
        this.recipients = new RecipientRepository(client, logger);
    }

    // Direct Messages
    getMessages = (u: string, c: string) => this.direct.getMessages(u, c);
    getMessagesPaginated = (u: string, c: string, p?: PaginationParams) => this.direct.getMessagesPaginated(u, c, p);
    getMessagesDelta = (u: string, c: string, t: string) => this.direct.getMessagesDelta(u, c, t);
    getMessagesDeltaBySeq = (u: string, c: string, s: number) => this.direct.getMessagesDeltaBySeq(u, c, s);
    getDeletedMessagesDelta = (u: string, c: string, t: string) => this.direct.getDeletedMessagesDelta(u, c, t);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    sendDirectMessage = (s: string, r: string, c: string, o?: any) => this.direct.sendDirectMessage(s, r, c, o);
    getUnreadCounts = (u: string) => this.direct.getUnreadCounts(u);
    markDirectAsRead = (c: string, u: string) => this.direct.markDirectAsRead(c, u);
    clearHistory = (u: string, c: string) => this.direct.clearHistory(u, c);

    // Project Messages
    getCalculationMessages = (id: string) => this.project.getCalculationMessages(id);
    getCalculationMessagesPaginated = (id: string, p?: PaginationParams) => this.project.getCalculationMessagesPaginated(id, p);
    getCalculationMessagesDelta = (id: string, t: string) => this.project.getCalculationMessagesDelta(id, t);
    getCalculationMessagesDeltaBySeq = (id: string, s: number) => this.project.getCalculationMessagesDeltaBySeq(id, s);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    sendProjectMessage = (s: string, p: string, c: string, o?: any) => this.project.sendProjectMessage(s, p, c, o);
    markProjectAsRead = (p: string, u: string) => this.project.markProjectAsRead(p, u);
    clearProjectHistory = (id: string) => this.project.clearProjectHistory(id);

    // Common CRUD
    getMessageById = (id: string) => this.common.getMessageById(id);
    deleteMessage = (id: string) => this.common.deleteMessage(id);
    editMessage = (id: string, c: string) => this.common.editMessage(id, c);

    // Attachments
    uploadFile = (f: File | Blob, b: string) => this.attachment.uploadFile(f, b);
    getSignedUrl = (p: string, b: string, e: number) => this.attachment.getSignedUrl(p, b, e);

    // Recipients
    getRecipients = (u: string) => this.recipients.getRecipients(u);
}
