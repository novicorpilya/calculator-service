import type { Message } from '../types';

/**
 * Preloads an image to browser cache to prevent flicker
 */
export async function preloadImage(url: string, retries = 3): Promise<void> {
    for (let i = 0; i < retries; i++) {
        try {
            await new Promise<void>((resolve, reject) => {
                const img = new Image();
                img.onload = () => resolve();
                img.onerror = () => reject();
                img.src = url;
            });
            return;
        } catch (e) {
            if (i === retries - 1) throw e;
            await new Promise((r) => setTimeout(r, 1000 * (i + 1)));
        }
    }
}

/**
 * Stable sorting for chat messages handling same-millisecond insertion
 */
export function sortMessages(msgs: Message[]): Message[] {
    return [...msgs].sort((a, b) => {
        const timeA = new Date(a.created_at).getTime();
        const timeB = new Date(b.created_at).getTime();
        if (timeA !== timeB) return timeA - timeB;
        // Fallback for same-millisecond messages: use stable ID compare
        return String(a.id).localeCompare(String(b.id));
    });
}
