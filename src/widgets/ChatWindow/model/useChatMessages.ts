import { useEffect, useState } from 'react';
import { MessageModel } from 'entities/message';
import { conversationsAPI } from 'entities/conversation';
import { useWebSocket } from 'app/providers/WebSocketProvider';

const useChatMessages = (conversationId?: number) => {
    const [messages, setMessages] = useState<MessageModel[]>([]);
    const { registerHandler } = useWebSocket();
    const [getConversationMessages, { data: messagesFromRequest }] =
        conversationsAPI.useGetMessagesMutation();

    // Загрузка сообщений
    useEffect(() => {
        if (conversationId) {
            getConversationMessages(conversationId);
        }
    }, [conversationId, getConversationMessages]);

    useEffect(() => {
        if (messagesFromRequest) {
            setMessages(messagesFromRequest);
        }
    }, [messagesFromRequest]);

    // WebSocket обработчики
    useEffect(() => {
        const addMessageHandler = registerHandler('message_created', (data) => {
            setMessages((prev) => {
                const exists = prev.some((msg) => msg.id === data.entity?.id);
                return exists ? prev : [...prev, data.entity];
            });
        });

        const updateMessageHandler = registerHandler('message_updated', (data) => {
            setMessages((prev) => {
                const message = data.entity as MessageModel;
                return prev.map((msg) => (msg.id === message.id ? message : msg));
            });
        });

        const deleteMessageHandler = registerHandler('message_deleted', (data) => {
            setMessages((prev) => prev.filter((msg) => msg.id !== data.entity?.id));
        });

        return () => {
            addMessageHandler();
            updateMessageHandler();
            deleteMessageHandler();
        };
    }, [registerHandler]);

    return { messages, setMessages };
};

export default useChatMessages;
