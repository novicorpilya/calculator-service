/**
 * Chat Feature Types - Single Source of Truth
 * All chat-related types must be imported from here.
 */

// ============================================
// MESSAGE TYPES
// ============================================

export interface Message {
    id: string;
    sender_id: string;
    receiver_id: string;
    calculation_id?: string | null;
    content: string | null;
    image_url?: string | null;
    voice_url?: string | null;
    voice_duration?: number | null;
    created_at: string;
    is_read?: boolean;
    reply_to_id?: string | null;
    is_edited?: boolean;
    client_id?: string;
}

export interface MessageCreatePayload {
    sender_id: string;
    receiver_id: string;
    content: string;
    calculation_id?: string;
    image_url?: string;
    voice_url?: string;
    voice_duration?: number;
    reply_to_id?: string;
}

export type MessageEventType = 'INSERT' | 'UPDATE' | 'DELETE';

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

export type UnreadCounts = Record<string, number>;

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
    PHOTO: '📷 Фотография',
    VOICE: '🎤 Голосовое сообщение',
} as const;
