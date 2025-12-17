import {Avatar, Flex, Typography} from "antd"
import {ConversationModel} from "../../../../../entities/ConversationModel";
import {useDispatch, useSelector} from "react-redux";
import {setSelectedConversationId} from "../../../../../store/slice/GeneralSlice";
import {useEffect, useState} from "react";
import {RootStateType} from "../../../../../store/store";
import {useWebSocket} from "../../../../../app/WebSocketProvider/ui/WebSocketProvider";
import {MessageModel} from "../../../../../entities/MessageModel";

const { Text } = Typography;

type PropsType = {
    conversation: ConversationModel;
}

export const ConversationItem = (props:PropsType) => {

    // Store
    const dispatch = useDispatch();
    const selectedConversationId = useSelector((state: RootStateType) => state.currentUser.selectedConversationId);
    const currentUser = useSelector((state: RootStateType) => state.currentUser.user);
    const [lastMessage, setLastMessage] = useState<string>(props.conversation.last_message?.text ?? "");
    const [fromYou, setFromYou] = useState(props.conversation.last_message?.sender?.id == currentUser?.id);
    // -----

    // Effects
    const { registerHandler } = useWebSocket();
    useEffect(() => {
        // Регистрируем обработчик для сообщений чата
        const removeHandler = registerHandler('message_created', (data: {entity: MessageModel}) => {
            if (data.entity.conversation == props.conversation.id) {
                setLastMessage(data.entity.text);
                setFromYou(data.entity.sender?.id == currentUser?.id);
            }
        });
        // Удаляем обработчик при размонтировании компонента
        return removeHandler;
    }, [registerHandler]);
    // -----

    // Handlers
    const selectConversationIdHandler = () => {
        if (selectedConversationId == props.conversation.id)
            dispatch(setSelectedConversationId(null));
        else
            dispatch(setSelectedConversationId(props.conversation.id));
    }
    // -----

    return(
        <Flex vertical className="chatItem" onClick={selectConversationIdHandler}>
            <Flex align={"center"} gap={'small'}>
                <Avatar src="https://storage.ws.pho.to/s2/6b3b4c3d6708259901c7ab83f3bcaa8306d63a31_m.jpeg"  size={"large"}/>
                <Flex vertical justify="space-between">
                    <Text>{props.conversation.title}</Text>
                    <Text style={{fontSize: 12}}>{fromYou ? "Вы: " : ""}{lastMessage}</Text>
                </Flex>
            </Flex>
        </Flex>
    )
}
