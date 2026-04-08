// widgets/ChatWindow/model/useChatMessages.ts
import { useEffect, useState, useCallback, useRef } from 'react';
import { MessageModel } from 'entities/message';
import { conversationsAPI } from 'entities/conversation';
import { useWebSocket } from 'app/providers/WebSocketProvider';
import { cacheService } from 'shared/lib/cache/cacheService';

const useChatMessages = (conversationId?: number) => {
    const [messages, setMessages] = useState<MessageModel[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [isFromCache, setIsFromCache] = useState(false);
    const [hasMore, setHasMore] = useState(true);
    const [totalMessages, setTotalMessages] = useState(0);

    const { registerHandler } = useWebSocket();
    const [getConversationMessages] = conversationsAPI.useGetMessagesMutation();
    const currentOffset = useRef(0);
    const isLoadingMoreRef = useRef(false);

    // Загрузка сообщений с пагинацией
    const loadMessages = useCallback(
        async (offset: number = 0, limit: number = 50, isLoadMore: boolean = false) => {
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
                            limit
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
                    //const hasMoreData = result || newMessages.length === limit;

                    //setHasMore(hasMoreData);
                    setTotalMessages(result.length || messages.length + newMessages.length);

                    if (isLoadMore) {
                        // Добавляем старые сообщения в начало
                        setMessages((prev) => [...newMessages, ...prev]);
                        currentOffset.current = offset + newMessages.length;
                    } else {
                        setMessages(newMessages);
                        currentOffset.current = newMessages.length;
                    }

                    // Сохраняем в кеш
                    await cacheService.saveMessages(conversationId, newMessages);
                    setIsFromCache(false);
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

    // Загрузка следующих сообщений (при скролле вверх)
    const loadMoreMessages = useCallback(() => {
        if (!loadingMore && hasMore && !isLoadingMoreRef.current) {
            loadMessages(currentOffset.current, 50, true);
        }
    }, [loadingMore, hasMore, loadMessages]);

    // Инициальная загрузка
    useEffect(() => {
        if (conversationId) {
            currentOffset.current = 0;
            setHasMore(true);
            setMessages([]);
            loadMessages(0, 50, false);
        }
    }, [conversationId]);

    // WebSocket обработчики (остаются без изменений)
    useEffect(() => {
        const addMessageHandler = registerHandler('message_created', async (data) => {
            const newMessage = data.entity as MessageModel;

            setMessages((prev) => {
                const exists = prev.some((msg) => msg.id === newMessage.id);
                if (exists) return prev;

                // Добавляем новое сообщение в конец
                const newMessages = [...prev, newMessage];
                // Обновляем offset
                currentOffset.current = newMessages.length;
                return newMessages;
            });

            if (conversationId && newMessage.conversation === conversationId) {
                await cacheService.addMessage(newMessage);
            }
        });

        const updateMessageHandler = registerHandler('message_updated', async (data) => {
            const updatedMessage = data.entity as MessageModel;

            setMessages((prev) =>
                prev.map((msg) => (msg.id === updatedMessage.id ? updatedMessage : msg))
            );

            if (conversationId && updatedMessage.conversation === conversationId) {
                await cacheService.updateMessage(updatedMessage);
            }
        });

        const deleteMessageHandler = registerHandler('message_deleted', async (data) => {
            const deletedMessage = data.entity as MessageModel;

            setMessages((prev) => prev.filter((msg) => msg.id !== deletedMessage.id));

            if (
                conversationId &&
                deletedMessage.conversation === conversationId &&
                deletedMessage.id
            ) {
                await cacheService.deleteMessage(deletedMessage.id.toString() ?? '0');
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
        totalMessages,
        loadMoreMessages,
        refetch: () => loadMessages(0, 50, false),
    };
};

export default useChatMessages;
