import { type Message } from '../types';

/**
 * ChatStorage - Native IndexedDB wrapper for Offline Persistence and Outbox
 */
export class ChatStorage {
    private dbName = 'chat_v2_storage';
    private dbVersion = 1;
    private db: IDBDatabase | null = null;

    private async getDB(): Promise<IDBDatabase> {
        if (this.db) return this.db;

        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, this.dbVersion);

            request.onupgradeneeded = (event) => {
                const db = (event.target as IDBOpenDBRequest).result;

                // Messages Store: Cached history
                if (!db.objectStoreNames.contains('messages')) {
                    const msgStore = db.createObjectStore('messages', { keyPath: 'id' });
                    msgStore.createIndex('chat_id', ['sender_id', 'receiver_id']);
                    msgStore.createIndex('calculation_id', 'calculation_id');
                    msgStore.createIndex('server_seq_id', 'server_seq_id');
                    msgStore.createIndex('created_at', 'created_at');
                }

                // Outbox Store: Pending outgoing actions
                if (!db.objectStoreNames.contains('outbox')) {
                    const outboxStore = db.createObjectStore('outbox', {
                        keyPath: 'id',
                        autoIncrement: true,
                    });
                    outboxStore.createIndex('status', 'status');
                }

                // Metadata Store: Sync markers (last_seq_id, last_timestamp)
                if (!db.objectStoreNames.contains('metadata')) {
                    db.createObjectStore('metadata', { keyPath: 'key' });
                }
            };

            request.onsuccess = () => {
                this.db = request.result;
                resolve(request.result);
            };

            request.onerror = () => reject(request.error);
        });
    }

    // --- Messages ---

    async saveMessages(messages: Message[]): Promise<void> {
        const db = await this.getDB();
        const tx = db.transaction('messages', 'readwrite');
        const store = tx.objectStore('messages');
        messages.forEach((m) => store.put(m));
        return new Promise((r, j) => {
            tx.oncomplete = () => r();
            tx.onerror = () => j(tx.error);
        });
    }

    async getCachedMessages(
        currentUserId: string,
        contactId: string,
        limit = 50
    ): Promise<Message[]> {
        const db = await this.getDB();
        return new Promise((resolve) => {
            const tx = db.transaction('messages', 'readonly');
            const store = tx.objectStore('messages');
            const index = store.index('created_at');
            const messages: Message[] = [];

            // Simple filtering in memory for complex or compound indexes if not optimal
            const request = index.openCursor(null, 'prev');
            request.onsuccess = (event) => {
                const cursor = (event.target as IDBRequest<IDBCursorWithValue>).result;
                if (cursor) {
                    const m = cursor.value as Message;
                    const isDirect =
                        (m.sender_id === currentUserId && m.receiver_id === contactId) ||
                        (m.sender_id === contactId && m.receiver_id === currentUserId);

                    if (isDirect && !m.calculation_id) {
                        messages.push(m);
                    }

                    if (messages.length < limit) {
                        cursor.continue();
                    } else {
                        resolve(messages.reverse());
                    }
                } else {
                    resolve(messages.reverse());
                }
            };
        });
    }

    async deleteMessages(ids: string[]): Promise<void> {
        const db = await this.getDB();
        const tx = db.transaction('messages', 'readwrite');
        const store = tx.objectStore('messages');
        ids.forEach((id) => store.delete(id));
    }

    // --- Metadata ---

    async setMeta(key: string, value: unknown): Promise<void> {
        const db = await this.getDB();
        const tx = db.transaction('metadata', 'readwrite');
        tx.objectStore('metadata').put({ key, value });
    }

    async getMeta<T>(key: string): Promise<T | null> {
        const db = await this.getDB();
        return new Promise((resolve) => {
            const request = db.transaction('metadata', 'readonly').objectStore('metadata').get(key);
            request.onsuccess = () => resolve(request.result?.value || null);
            request.onerror = () => resolve(null);
        });
    }

    // --- Outbox ---

    async addToOutbox(action: {
        type: string;
        payload: unknown;
        createdAt: string;
        status: 'pending' | 'failed';
    }): Promise<number> {
        const db = await this.getDB();
        return new Promise((resolve) => {
            const tx = db.transaction('outbox', 'readwrite');
            const request = tx.objectStore('outbox').add(action);
            request.onsuccess = () => resolve(request.result as number);
        });
    }

    async getOutbox(): Promise<unknown[]> {
        const db = await this.getDB();
        return new Promise((resolve) => {
            const request = db
                .transaction('outbox', 'readonly')
                .objectStore('outbox')
                .getAll();
            request.onsuccess = () => resolve(request.result);
        });
    }

    async removeFromOutbox(id: number): Promise<void> {
        const db = await this.getDB();
        const tx = db.transaction('outbox', 'readwrite');
        tx.objectStore('outbox').delete(id);
    }

    async updateMessage(id: string, updates: Partial<Message>): Promise<void> {
        const db = await this.getDB();
        const tx = db.transaction('messages', 'readwrite');
        const store = tx.objectStore('messages');
        const request = store.get(id);
        request.onsuccess = () => {
            if (request.result) {
                store.put({ ...request.result, ...updates });
            }
        };
    }
}

export const chatStorage = new ChatStorage();
