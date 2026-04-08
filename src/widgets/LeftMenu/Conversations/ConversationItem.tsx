import {Avatar, Flex, Typography} from 'antd';
import {useDispatch, useSelector} from 'react-redux';
import React, {useEffect, useState} from 'react';
import {CONVERSATION_TYPE} from '../../../shared/config/constants';
import { MessageModel } from '../../../entities/message';
import { useWebSocket } from '../../../app/providers/WebSocketProvider/ui/WebSocketProvider';
import { setSelectedConversation } from '../../../app/store/slice/GeneralSlice';
import { RootStateType } from '../../../app/store/store';
import {ConversationMemberModel, ConversationModel } from '../../../entities/conversation';

const { Text } = Typography;

type PropsType = {
    conversation: ConversationModel;
};

export const ConversationItem = (props: PropsType) => {
    // Store
    const { registerHandler } = useWebSocket();
    const dispatch = useDispatch();
    const selectedConversation = useSelector(
        (state: RootStateType) => state.currentUser.selectedConversation
    );
    const currentUser = useSelector((state: RootStateType) => state.currentUser.user);
    const [lastMessage, setLastMessage] = useState<string>(
        props.conversation.last_message?.text ?? ''
    );
    const [fromYou, setFromYou] = useState(
        props.conversation.last_message?.sender?.id == currentUser?.id
    );
    const conversations = useSelector(
        (state: RootStateType) => state.currentUser.conversations
    );
    // -----

    // States
    const [conversationTitle, setConversationTitle] = useState("#Название чата#");
    const [isGroupChat, setIsGroupChat] = useState(false);
    const [profile, setProfile] = useState<ConversationMemberModel | null>(null);
    // -----

    // Effects
    useEffect(() => {
        if (conversations) {
            let title = "";
            let isGroup = false;

            const conversation: ConversationModel | undefined = conversations.find(
                (c: ConversationModel) => c.id == props.conversation?.id
            );

            if (conversation) {
                // Определяем тип чата
                isGroup = conversation.type === CONVERSATION_TYPE.GROUP;
                setIsGroupChat(isGroup);

                if (isGroup) {
                    // Групповой чат - используем название группы
                    title = conversation.title || "Групповой чат";
                } else {
                    // Личный чат - ищем собеседника
                    const profile: any | undefined = conversation.members?.find(
                        (profile: any) => profile?.user.id != currentUser?.id
                    );

                    if (profile) {
                        title = `${profile.user.profile.last_name} ${profile.user.profile.first_name} ${profile.user.profile.second_name}`;
                        setProfile(profile);
                    } else {
                        title = "#Название чата#";
                    }
                }
            } else {
                title = "#Название чата#";
            }

            setConversationTitle(title);
        }
    }, [conversations, currentUser?.id, props.conversation?.id]);

    useEffect(() => {
        // Регистрируем обработчик для сообщений чата
        const removeHandler = registerHandler(
            'message_created',
            (data: { entity: MessageModel }) => {
                if (data.entity.conversation == props.conversation.id) {
                    setLastMessage(data.entity.text);
                    setFromYou(data.entity.sender?.id == currentUser?.id);
                }
            }
        );
        // Удаляем обработчик при размонтировании компонента
        return removeHandler;
    }, [registerHandler, props.conversation.id, currentUser?.id]);
    // -----


    // Handlers
    const selectConversationIdHandler = () => {
        if (selectedConversation?.id == props.conversation.id) {
            dispatch(setSelectedConversation(null));
        } else {
            dispatch(setSelectedConversation(props.conversation));
        }
    };
    // -----

    return (
        <Flex
            vertical
            className="chatItem"
            style={{
                background:
                    selectedConversation?.id == props.conversation.id ? '#d7e1f2' : 'inherit',
                marginRight: 3,
                marginLeft: 3,
                padding: '8px 12px',
                cursor: 'pointer',
                borderRadius: 8,
                transition: 'background-color 0.2s',
            }}
            onClick={selectConversationIdHandler}
        >
            <Flex align={'center'} gap={'small'}>
                <div style={{width: 40}}>
                    <Avatar
                        style={{width: 40, height: 40}}
                        src={profile?.user.profile.avatar?.replace(":9000", "/storage")}
                        size={'large'}
                    />
                </div>
                <Flex vertical justify="space-between" style={{ flex: 1 }}>
                    <Flex justify="space-between" align="center">
                        <Text strong style={{ fontSize: 14 }}>
                            {conversationTitle}
                        </Text>
                    </Flex>
                    <Text
                        type="secondary"
                        style={{
                            fontSize: 12,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            maxWidth: 200
                        }}
                    >
                        {fromYou ? 'Вы: ' : ''}
                        {lastMessage.length > 50 ? `${lastMessage.slice(0, 35)}...` : lastMessage}
                    </Text>
                </Flex>
            </Flex>
        </Flex>
    );
};