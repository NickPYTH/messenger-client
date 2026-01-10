import { Avatar, Flex, Typography } from 'antd';
import { useDispatch, useSelector } from 'react-redux';
import { useEffect, useState } from 'react';
import { ConversationModel } from 'entities/ConversationModel';
import { RootStateType } from 'store/store';
import { MessageModel } from 'entities/MessageModel';
import { useWebSocket } from 'app/WebSocketProvider/ui/WebSocketProvider';
import { setSelectedConversation } from 'store/slice/GeneralSlice';

const { Text } = Typography;

type PropsType = {
    conversation: ConversationModel;
};

export const ConversationItem = (props: PropsType) => {
    // Store
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
    // -----

    // Effects
    const { registerHandler } = useWebSocket();
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
    }, [registerHandler]);
    // -----

    // Handlers
    const selectConversationIdHandler = () => {
        if (selectedConversation?.id == props.conversation.id)
            dispatch(setSelectedConversation(null));
        else dispatch(setSelectedConversation(props.conversation));
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
            }}
            onClick={selectConversationIdHandler}
        >
            <Flex align={'center'} gap={'small'}>
                <Avatar
                    style={{ height: 50, minWidth: 50 }}
                    src="https://storage.ws.pho.to/s2/6b3b4c3d6708259901c7ab83f3bcaa8306d63a31_m.jpeg"
                    size={'large'}
                />
                <Flex vertical justify="space-between">
                    <Text>{props.conversation.title}</Text>
                    <Text style={{ fontSize: 12 }}>
                        {fromYou ? 'Вы: ' : ''}
                        {lastMessage.slice(0, 50)}
                    </Text>
                </Flex>
            </Flex>
        </Flex>
    );
};
