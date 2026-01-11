/**
 * Chat Feature Types - Single Source of Truth
 * All chat-related types must be imported from here.
 */

// ============================================
// MESSAGE TYPES
// ============================================

export interface Message {
    id: string;
    sender_id: string | null;
    receiver_id: string | null;
    calculation_id?: string | null;
    content: string | null;
    image_url?: string | null;
    voice_url?: string | null;
    voice_duration?: number | null;
    is_edited?: boolean;
    client_message_id?: string | null;
    created_at: string;
    is_read?: boolean;
    status?: 'pending' | 'sent' | 'error';
}

export interface MessageCreatePayload {
    sender_id: string;
    receiver_id?: string | null;
    content: string;
    calculation_id?: string | null;
    image_url?: string | null;
    voice_url?: string | null;
    voice_duration?: number | null;
    reply_to_id?: string | null;
    client_message_id?: string | null;
}

export type MessageEventType = 'INSERT' | 'UPDATE' | 'DELETE' | 'READ' | 'RECONNECT';

export interface MessageEvent {
    type: MessageEventType;
    message: Message;
}

// ============================================
// RECIPIENT TYPES
// ============================================

export interface ChatRecipient {
    id: string;
    organization_name: string | null;
    role: string;
    first_name?: string | null;
    last_name?: string | null;
    lastMessage?: LastMessagePreview | null;
}

export interface LastMessagePreview {
    content: string | null;
    created_at: string | null;
    sender_id: string | null;
    image_url?: string | null;
    voice_url?: string | null;
}

export interface UnreadCounts {
    total: number;
    perSender: Record<string, number>;
    perProject: Record<string, number>;
}

// ============================================
// UI STATE TYPES
// ============================================

export interface ContextMenuState {
    x: number;
    y: number;
    message: Message;
}

export interface PendingAttachment {
    file: File;
    preview: string;
    isUploading?: boolean;
}

// ============================================
// CONSTANTS
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
