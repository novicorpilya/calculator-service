import { type Message } from '../types';

/**
 * Sort messages by created_at ascending (oldest first)
 * This is the single source of truth for message ordering
 */
export function sortMessages(messages: Message[]): Message[] {
    return [...messages].sort(
        (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    );
}

/**
 * Preload an image into browser cache
 * Used for "media-first" rendering strategy
 */
export function preloadImage(src: string): Promise<void> {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve();
        img.onerror = () => reject(new Error(`Failed to preload: ${src}`));
        img.src = src;
    });
}

/**
 * Merge new messages into existing array, avoiding duplicates
 * Returns a new sorted array
 */
export function mergeMessages(existing: Message[], incoming: Message[]): Message[] {
    const existingIds = new Set(existing.map(m => m.id));
    const newMsgs = incoming.filter(m => !existingIds.has(m.id));
    if (newMsgs.length === 0) return existing;
    return sortMessages([...existing, ...newMsgs]);
}

/**
 * Replace optimistic (temp) message with real server message
 * Matches by client_message_id or heuristics
 */
export function replaceOptimisticMessage(
    messages: Message[],
    serverMsg: Message,
    currentUserId: string
): { messages: Message[]; replaced: boolean } {
    let replaced = false;

    const updated = messages.map(m => {
        if (replaced) return m;

        // Match by client_message_id
        if (serverMsg.client_message_id && m.client_message_id === serverMsg.client_message_id) {
            replaced = true;
            return { ...serverMsg, status: 'sent' as const };
        }

        // Fallback: match temp messages by content/media
        if (m.id.startsWith('temp-') && m.sender_id === currentUserId) {
            const contentMatch = m.content === serverMsg.content && m.content !== '';
            const mediaMatch = 
                (m.image_url && serverMsg.image_url) || 
                (m.voice_url && serverMsg.voice_url);
            
            if (contentMatch || mediaMatch) {
                replaced = true;
                return { ...serverMsg, status: 'sent' as const };
            }
        }

        return m;
    });

    return { messages: updated, replaced };
}

/**
 * Get the latest server_seq_id from a message array
 */
export function getLatestSeqId(messages: Message[]): number {
    if (messages.length === 0) return 0;
    return Math.max(...messages.map(m => m.server_seq_id || 0));
}

/**
 * Check if there's a gap in sequence IDs
 */
export function hasSequenceGap(lastSeqId: number, newSeqId: number): boolean {
    return lastSeqId > 0 && newSeqId > lastSeqId + 1;
}

/**
 * Generate file path for storage bucket
 */
export function filePathForBucket(_bucket: string, fileName: string): string {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    return `${year}/${month}/${fileName}`;
}
