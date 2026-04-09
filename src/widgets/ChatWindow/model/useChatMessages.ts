// widgets/ChatWindow/model/useChatMessages.ts
import { useEffect, useState, useCallback, useRef } from 'react';
import { MessageModel } from 'entities/message';
import { conversationsAPI } from 'entities/conversation';
import { useWebSocket } from 'app/providers/WebSocketProvider';
import { cacheService } from 'shared/lib/cache/cacheService';

const PAGE_SIZE = 50;

const useChatMessages = (conversationId?: number) => {
    const [messages, setMessages] = useState<MessageModel[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [isFromCache, setIsFromCache] = useState(false);
    const [hasMore, setHasMore] = useState(true);

    const { registerHandler } = useWebSocket();
    const [getConversationMessages] = conversationsAPI.useGetMessagesMutation();

    const currentOffset = useRef(0);
    const isLoadingMoreRef = useRef(false);

    // Загрузка сообщений
    const loadMessages = useCallback(
        async (offset: number = 0, isLoadMore: boolean = false) => {
            if (!conversationId) return;

            if (isLoadMore) {
                if (isLoadingMoreRef.current || !hasMore) return;
                isLoadingMoreRef.current = true;
                setLoadingMore(true);
            } else {
                setLoading(true);
            }

            try {
                // Для первой загрузки проверяем кеш
                if (offset === 0 && !isLoadMore) {
                    const hasCache = await cacheService.hasCache(conversationId);
                    if (hasCache) {
                        const cachedMessages = await cacheService.getMessages(
                            conversationId,
                            PAGE_SIZE
                        );
                        if (cachedMessages.length > 0) {
                            setMessages(cachedMessages);
                            setIsFromCache(true);
                            setLoading(false);
                        }
                    }
                }

                // Загружаем с сервера
                const result = await getConversationMessages(conversationId).unwrap();

                if (result && result) {
                    const newMessages = result;
                    const hasMoreData = false;

                    setHasMore(hasMoreData);

                    if (isLoadMore) {
                        // Добавляем старые сообщения в начало
                        setMessages((prev) => [...newMessages, ...prev]);
                    } else {
                        setMessages(newMessages);
                    }

                    currentOffset.current = offset + newMessages.length;

                    // Сохраняем в кеш
                    if (!isLoadMore) {
                        await cacheService.saveMessages(conversationId, newMessages);
                        setIsFromCache(false);
                    }
                }
            } catch (error) {
                console.error('Ошибка загрузки сообщений:', error);
            } finally {
                if (isLoadMore) {
                    isLoadingMoreRef.current = false;
                    setLoadingMore(false);
                } else {
                    setLoading(false);
                }
            }
        },
        [conversationId, getConversationMessages, hasMore]
    );

    // Загрузка старых сообщений (скролл вверх)
    const loadMoreMessages = useCallback(() => {
        if (!loadingMore && hasMore && !isLoadingMoreRef.current) {
            loadMessages(currentOffset.current, true);
        }
    }, [loadingMore, hasMore, loadMessages]);

    // Инициальная загрузка
    useEffect(() => {
        if (conversationId) {
            currentOffset.current = 0;
            setHasMore(true);
            setMessages([]);
            loadMessages(0, false);
        }
    }, [conversationId]);

    // WebSocket обработчики
    useEffect(() => {
        const addMessageHandler = registerHandler('message_created', async (data) => {
            const newMessage = data.entity as MessageModel;

            if (newMessage.conversation !== conversationId) return;

            setMessages((prev) => {
                const exists = prev.some((msg) => msg.id === newMessage.id);
                if (exists) return prev;

                // Новое сообщение добавляем в конец
                return [...prev, newMessage];
            });

            await cacheService.addMessage(newMessage);
        });

        const updateMessageHandler = registerHandler('message_updated', async (data) => {
            const updatedMessage = data.entity as MessageModel;

            if (updatedMessage.conversation !== conversationId) return;

            setMessages((prev) =>
                prev.map((msg) => (msg.id === updatedMessage.id ? updatedMessage : msg))
            );

            await cacheService.updateMessage(updatedMessage);
        });

        const deleteMessageHandler = registerHandler('message_deleted', async (data) => {
            const deletedMessage = data.entity as MessageModel;

            if (deletedMessage.conversation !== conversationId) return;

            setMessages((prev) => prev.filter((msg) => msg.id !== deletedMessage.id));

            if (deletedMessage.id) {
                await cacheService.deleteMessage(deletedMessage.id.toString());
            }
        });

        return () => {
            addMessageHandler();
            updateMessageHandler();
            deleteMessageHandler();
        };
    }, [registerHandler, conversationId]);

    return {
        messages,
        loading,
        loadingMore,
        isFromCache,
        hasMore,
        loadMoreMessages,
        refresh: () => loadMessages(0, false),
    };
};

export default useChatMessages;
