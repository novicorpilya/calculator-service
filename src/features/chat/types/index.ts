import { z } from 'zod';

/**
 * Chat Feature Types - Single Source of Truth
 */

// ============================================
// ZOD SCHEMAS (Database & Validation)
// ============================================

export const MessageSchema = z.object({
    id: z.string(),
    sender_id: z.string().nullable(),
    receiver_id: z.string().nullable(),
    calculation_id: z.string().nullable().optional(),
    content: z.string().nullable(),
    image_url: z.string().nullable().optional(),
    voice_url: z.string().nullable().optional(),
    voice_duration: z.number().nullable().optional(),
    is_edited: z.boolean().default(false),
    is_read: z.boolean().default(false),
    client_message_id: z.string().nullable().optional(),
    created_at: z.string(),
    message_type: z.string().nullable().optional(),
    metadata: z.any().optional(),
    event_reference_id: z.string().nullable().optional(),
    reply_to_id: z.string().nullable().optional(),
    // UI-only status
    status: z.enum(['pending', 'sent', 'error']).optional(),
});

export type Message = z.infer<typeof MessageSchema>;

export const MessageCreatePayloadSchema = z.object({
    sender_id: z.string(),
    receiver_id: z.string().nullable().optional(),
    content: z.string(),
    calculation_id: z.string().nullable().optional(),
    image_url: z.string().nullable().optional(),
    voice_url: z.string().nullable().optional(),
    voice_duration: z.number().nullable().optional(),
    reply_to_id: z.string().nullable().optional(),
    client_message_id: z.string().nullable().optional(),
});

export type MessageCreatePayload = z.infer<typeof MessageCreatePayloadSchema>;

export type MessageEventType = 'INSERT' | 'UPDATE' | 'DELETE' | 'READ' | 'RECONNECT' | 'TYPING';

export interface BroadcastSignal {
    id: string;
}

export type ChatEventPayload =
    | Message
    | ReadEventPayload
    | TypingEventPayload
    | HistoryClearedPayload
    | BroadcastSignal;

export interface MessageEvent {
    type: MessageEventType;
    payload: ChatEventPayload;
}

// ============================================
// RECIPIENT TYPES
// ============================================

export const RecipientSchema = z.object({
    id: z.string(),
    organization_name: z.string().nullable(),
    role: z.string(),
    first_name: z.string().nullable().optional(),
    last_name: z.string().nullable().optional(),
    lastMessage: z
        .object({
            id: z.string().nullable().optional(),
            content: z.string().nullable(),
            created_at: z.string().nullable(),
            sender_id: z.string().nullable(),
            image_url: z.string().nullable().optional(),
            voice_url: z.string().nullable().optional(),
        })
        .nullable()
        .optional(),
});

export type ChatRecipient = z.infer<typeof RecipientSchema>;

export const UnreadCountsSchema = z.object({
    total: z.number(),
    perSender: z.record(z.string(), z.number()),
    perProject: z.record(z.string(), z.number()),
});

export type UnreadCounts = z.infer<typeof UnreadCountsSchema>;

// ============================================
// CONSTANTS & UI
// ============================================

export const CHAT_CHANNELS = {
    GLOBAL_SYNC: 'system_global_sync',
    CHAT_PREFIX: 'chat_room_',
    NOTIFICATIONS: 'chat_notifications',
} as const;

export const MESSAGE_SNIPPETS = {
    PHOTO: '📷 Изображение',
    VOICE: '🎤 Голосовое сообщение',
    EMOJI: '😊 Смайлик',
} as const;

// ============================================
// UI STATE TYPES
// ============================================

// ============================================
// REALTIME PAYLOADS
// ============================================

export interface ReadEventPayload {
    readerId: string;
    calculationId?: string;
    receiverId?: string;
}

export interface TypingEventPayload {
    sender_id: string;
    receiver_id?: string;
}

export interface HistoryClearedPayload {
    sender_id: string;
    receiver_id: string;
}

export interface ContextMenuState {
    message: Message;
    x: number;
    y: number;
}
