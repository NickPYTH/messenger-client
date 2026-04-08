import { MessageModel } from 'entities/message';
import { DBSchema, IDBPDatabase, openDB } from 'idb';

interface ChatDB extends DBSchema {
    messages: {
        key: string; // `${conversationId}_${messageId}`
        value: MessageModel;
        indexes: {
            'by-conversation': string;
            'by-conversation-and-date': [string, number];
        };
    };
    conversations: {
        key: number; // conversationId
        value: {
            id: number;
            lastSyncTime: number;
            lastMessageId?: number;
            totalMessages: number;
        };
    };
}

class CacheService {
    private db: IDBPDatabase<ChatDB> | null = null;
    private readonly DB_NAME = 'ChatCache';
    private readonly DB_VERSION = 1;

    async init() {
        if (this.db) return this.db;

        this.db = await openDB<ChatDB>(this.DB_NAME, this.DB_VERSION, {
            upgrade(db) {
                // Хранилище сообщений
                const messageStore = db.createObjectStore('messages', {
                    keyPath: 'id',
                });
                messageStore.createIndex('by-conversation', 'conversation');
                messageStore.createIndex('by-conversation-and-date', ['conversation', 'createdAt']);

                // Хранилище метаданных диалогов
                db.createObjectStore('conversations', {
                    keyPath: 'id',
                });
            },
        });

        return this.db;
    }
    // Сохранить сообщения
    async saveMessages(conversationId: number, messages: MessageModel[]) {
        const db = await this.init();
        const tx = db.transaction(['messages', 'conversations'], 'readwrite');

        for (const message of messages) {
            await tx.objectStore('messages').put(message);
        }

        // Обновляем метаданные диалога
        const convStore = tx.objectStore('conversations');
        const existing = await convStore.get(conversationId);

        await convStore.put({
            id: conversationId,
            lastSyncTime: Date.now(),
            lastMessageId: messages[messages.length - 1]?.id,
            totalMessages: (existing?.totalMessages || 0) + messages.length,
        });

        await tx.done;
    }

    // Получить сообщения из кеша
    async getMessages(conversationId: number, limit = 50, offset = 0): Promise<MessageModel[]> {
        const db = await this.init();

        const messages = await db.getAllFromIndex(
            'messages',
            'by-conversation-and-date',
            IDBKeyRange.bound([conversationId, 0], [conversationId, Date.now()])
        );

        return messages
            .sort(
                (a, b) => new Date(a.sent_at ?? '').getTime() - new Date(b.sent_at ?? '').getTime()
            )
            .slice(offset, offset + limit);
    }

    // Получить последние сообщения
    async getLastMessages(conversationId: number, count = 50): Promise<MessageModel[]> {
        const messages = await this.getMessages(conversationId);
        return messages.slice(-count);
    }

    // Добавить одно сообщение
    async addMessage(message: MessageModel) {
        const db = await this.init();
        await db.put('messages', message);
    }

    // Обновить сообщение
    async updateMessage(message: MessageModel) {
        const db = await this.init();
        await db.put('messages', message);
    }

    // Удалить сообщение
    async deleteMessage(messageId: string) {
        const db = await this.init();
        await db.delete('messages', messageId);
    }

    // Проверить есть ли кеш
    async hasCache(conversationId: number): Promise<boolean> {
        const db = await this.init();
        const messages = await this.getMessages(conversationId, 1);
        return messages.length > 0;
    }
}

export const cacheService = new CacheService();
