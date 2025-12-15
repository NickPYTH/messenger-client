import { Flex, Input } from "antd"
import { RootStateType } from "../../../../store/store";
import { Message } from "./Message";
import {useDispatch, useSelector} from "react-redux";
import {userAPI} from "../../../../service/UserService";
import {conversationsAPI} from "../../../../service/ConversationsService";
import {messageAPI} from "../../../../service/MessageService";
import {useEffect, useState} from "react";
import {MessageModel} from "../../../../entities/MessageModel";

const {Search} = Input;

export const ChatWindow = () => {

    // Store
    const dispatch = useDispatch();
    const selectedConversationId = useSelector((state: RootStateType) => state.currentUser.selectedConversationId);
    const currentUser = useSelector((state: RootStateType) => state.currentUser.user);
    // -----

    // States
    const [text, setText] = useState<string>("");
    const [messages, setMessages] = useState<MessageModel[]>([]);
    // -----

    // Web requests
    const [createMessage, {
        data: createdMessage,
        isSuccess: isCreateMessageSuccess,
        isLoading: isCreateMessageLoading
    }] = messageAPI.useCreateMutation();
    const [getConversationMessages, {
        data: messagesFromRequest,
        isSuccess: isGetConversationMessagesSuccess,
        isLoading: isGetConversationMessagesLoading
    }] = conversationsAPI.useGetMessagesMutation();
    // -----

    // Effects
    useEffect(() => {
        if (selectedConversationId)
            getConversationMessages(selectedConversationId);
    }, []);
    useEffect(() => {
        if (messagesFromRequest){
            setMessages(messagesFromRequest);
        }
    }, [messagesFromRequest]);
    useEffect(() => {
        if (isCreateMessageSuccess)
            setText("");
    }, [isCreateMessageSuccess]);
    // -----

    // Handlers
    const changeTextHandler = (e:any) => {
        setText(e.target.value);
    };
    const createMessageHandler = () => {
        if (text && selectedConversationId) {
            let message: MessageModel = {
                conversation: selectedConversationId,
                text
            };
            createMessage(message);
        }
    };
    // -----

    return(
        <Flex style={{
            display: 'grid',
            gridTemplateRows: '1fr auto', // Сообщения занимают всё пространство, инпут - по содержимому
            height: '100vh',
            padding: 5,
            width: '90%',
            overflow: 'hidden'
        }}>
            <Flex
            vertical
             style={{
                overflowY: 'auto',
                padding: '10px 0'
            }}>
                {messages.map((message, index) => (
                    <Message 
                        key={index}
                        text={message.text} 
                        fromYou={message.sender?.id == currentUser?.id}
                    />
                ))}
            </Flex>
            
            <div style={{
                height: 50,
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center'
            }}>
                <Search
                    value={text}
                    onChange={changeTextHandler}
                    style={{ maxWidth: 600, width: '100%' }}
                    placeholder="Введите сообщение"
                    allowClear
                    enterButton="Отправить"
                    onSearch={createMessageHandler}
                />
            </div>
        </Flex>
    )
}