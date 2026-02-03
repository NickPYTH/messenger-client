import { ConversationItem } from './ConversationItem';
import { Empty, Flex, Spin } from 'antd';
import React, { useEffect } from 'react';
import { conversationsAPI } from 'service/ConversationsService';
import { ConversationModel } from 'entities/ConversationModel';
import { useWebSocket } from '../../../../../app/WebSocketProvider/ui/WebSocketProvider';

export const ConversationsList = () => {
    // Hooks
    const { isConnected, registerHandler, sendMessage } = useWebSocket();
    // -----

    // Web requests
    const {
        data: conversations,
        isLoading: isConversationsLoading,
        refetch: refetchConversations,
    } = conversationsAPI.useGetAllQuery();
    // -----

    // Effects
    useEffect(() => {
        refetchConversations();
    }, []);
    useEffect(() => {
        if (conversations) {
            // Регистрируем обработчик для новых сообщений чата
            const newMessageHandler = registerHandler('message_created', (data) => {
                console.log(conversations);
                const conversationId = data?.entity.conversation;
                if (conversations.find((c: ConversationModel) => c.id == conversationId)) {
                    console.log('try to show');
                    showApp();
                }
            });
            // Удаляем обработчик при размонтировании компонента
            return newMessageHandler;
        }
    }, [registerHandler, conversations]);
    // -----

    // Handlers
    const showApp = async () => {
        // Используем window.electronAPI если настроен preload
        // или напрямую ipcRenderer если nodeIntegration: true
        const screenshotData =
            (await (window as any).electronAPI?.showApp?.()) ||
            (await (window as any).ipcRenderer?.invoke?.('show-app'));
        if (screenshotData) {
            console.log('Скриншот создан');
        } else {
            console.log('Не удалось создать скриншот');
        }
        const audio =
            (await (window as any).electronAPI?.playNotificationSound?.()) ||
            (await (window as any).ipcRenderer?.invoke?.('play-notification-sound', 'message'));
        if (audio) {
            console.log('audio создан');
        } else {
            console.log('Не удалось создать audio');
        }
    };
    // -----

    return (
        <Flex vertical>
            {conversations?.map((conversation: ConversationModel) => {
                return <ConversationItem key={conversation.id} conversation={conversation} />;
            })}
            {isConversationsLoading && <Spin style={{ marginTop: 50 }} />}
            {conversations?.length == 0 && <Empty description={'У вас нет начатых чатов'} style={{ marginTop: 50 }} />}
        </Flex>
    );
};
