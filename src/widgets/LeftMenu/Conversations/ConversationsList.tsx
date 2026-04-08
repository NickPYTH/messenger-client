import {ConversationItem} from './ConversationItem';
import {Empty, Flex, Spin} from 'antd';
import React, {useEffect} from 'react';
import {useDispatch, useSelector} from "react-redux";
import {ConversationModel} from '../../../entities/conversation';
import { conversationsAPI } from '../../../entities/conversation/api/conversationApi';
import { RootStateType } from '../../../app/store/store';
import { setConversations } from '../../../app/store/slice/GeneralSlice';
import { useWebSocket } from '../../../app/providers/WebSocketProvider';

export const ConversationsList = () => {
    // Store

    // -----

    // Hooks
    const { isConnected, registerHandler, sendMessage } = useWebSocket();
    const dispatch = useDispatch();
    const selectedConversation = useSelector((state: RootStateType) => state.currentUser.selectedConversation);
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
            dispatch(setConversations(conversations));
            // Регистрируем обработчик для новых сообщений чата
            const newMessageHandler = registerHandler('message_created', (data) => {
                const conversationId = data?.entity.conversation;
                if (conversations.find((c: ConversationModel) => c.id == conversationId) && selectedConversation?.id != conversationId) {
                    console.log('try to show');
                    showApp();
                }
            });
            // Удаляем обработчик при размонтировании компонента
            return newMessageHandler;
        }
    }, [registerHandler, conversations, selectedConversation]);
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
