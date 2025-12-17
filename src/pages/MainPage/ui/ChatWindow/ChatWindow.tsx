import {Badge, Button, Divider, Empty, Flex, Input, Popconfirm} from "antd"
import {RootStateType} from "../../../../store/store";
import {Message} from "./Message";
import {useDispatch, useSelector} from "react-redux";
import {conversationsAPI} from "../../../../service/ConversationsService";
import {messageAPI} from "../../../../service/MessageService";
import {useEffect, useRef, useState} from "react";
import {MessageModel} from "../../../../entities/MessageModel";
import {useWebSocket} from "../../../../app/WebSocketProvider/ui/WebSocketProvider";
import { DeleteOutlined, FileAddOutlined, SendOutlined } from "@ant-design/icons";
import {setSelectedConversationId} from "../../../../store/slice/GeneralSlice";
import TextArea from "antd/es/input/TextArea";

const {Search} = Input;


export const ChatWindow = () => {

    // Store
    const dispatch = useDispatch();
    const selectedConversationId = useSelector((state: RootStateType) => state.currentUser.selectedConversationId);
    const currentUser = useSelector((state: RootStateType) => state.currentUser.user);
    const { registerHandler } = useWebSocket();
    // -----

    // Refs
    const bottomRef = useRef(null);
    // -----

    // States
    const [text, setText] = useState<string>("");
    const [messages, setMessages] = useState<MessageModel[]>([]);
    // -----

    // Web requests
    const [createMessage, {
        isSuccess: isCreateMessageSuccess,
        isLoading: isCreateMessageLoading
    }] = messageAPI.useCreateMutation();
    const [getConversationMessages, {
        data: messagesFromRequest,
    }] = conversationsAPI.useGetMessagesMutation();
    const [deleteConversation, {
        isSuccess: isDeleteConversationSuccess,
    }] = conversationsAPI.useDeleteMutation();
    // -----

    // Effects
    useEffect(() => {
        if (selectedConversationId)
            getConversationMessages(selectedConversationId);
    }, []);
    useEffect(() => {
        if (messagesFromRequest){
            setMessages(messagesFromRequest);
            setTimeout(()=>handleScrollToBottom(), 100);
        }
    }, [messagesFromRequest]);
    useEffect(() => {
        if (isCreateMessageSuccess)
            setText("");
    }, [isCreateMessageSuccess]);
    useEffect(() => {
        // Регистрируем обработчик для сообщений чата
        const removeHandler = registerHandler('message_created', (data) => {
            setMessages(prev => {
                // Проверяем, нет ли уже такого сообщения
                const exists = prev.some(msg => msg.id === data.entity?.id);
                return exists ? prev : [...prev, data.entity];
            });
            setTimeout(() => handleScrollToBottom(), 100);
        });
        // Удаляем обработчик при размонтировании компонента
        return removeHandler;
    }, [registerHandler]);
    useEffect(() => {
        if (isDeleteConversationSuccess)
            dispatch(setSelectedConversationId(null));
    }, [isDeleteConversationSuccess]);
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
    const handleScrollToBottom = () => {
        if (bottomRef.current) {
            //@ts-ignore
            bottomRef.current.scrollIntoView({
                behavior: 'smooth', // Плавная анимация
                block: 'end',       // Выровнять по нижней границе
            });
        }
    };
    const deleteConversationHandler = () => {
        if (selectedConversationId)
            deleteConversation(selectedConversationId);
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
            <div style={{width: '100%', height: 49, marginBottom: 2}}>
                <Flex vertical gap={'small'} justify={'space-between'} style={{height: '100%'}}>
                    <Flex gap={'small'} align={'center'} justify={'end'} style={{height: '100%'}}>
                        <Popconfirm title={"Вы точно хотите удалить переписку?"}
                                    okText={"Да"}
                                    cancelText={"Отменить"}
                                    onConfirm={deleteConversationHandler}>
                            <Button type='primary' danger icon={<DeleteOutlined />}>
                                Удалить переписку
                            </Button>
                        </Popconfirm>
                    </Flex>
                </Flex>

                <Divider style={{width: '100%', margin: 0}}/>
            </div>
            <Flex
            vertical
             style={{
                overflowY: 'auto',
                padding: '10px 0'
            }}>
                {messages.map((message, index) => (
                    <Message 
                        key={index}
                        data={message}
                        fromYou={message.sender?.id == currentUser?.id}
                    />
                ))}
                {messages.length == 0 && <Empty style={{marginTop: 50}} description={"Сообщений пока нет..."}/>}
                <div ref={bottomRef} style={{ height: '0px' }} />
            </Flex>
            
            <Flex style={{height: 100}} justify={'center'} align={'center'} gap={'small'}>
                <TextArea value={text} onChange={changeTextHandler}
                          style={{ maxWidth: 600, width: '100%'}}
                          placeholder="Введите сообщение..."
                          allowClear/>
                <Badge count={3}>
                    <Button style={{height: 50, width: 50}} onClick={createMessageHandler} disabled={isCreateMessageLoading} icon={<FileAddOutlined />} />
                </Badge>
                <Button style={{height: 50, width: 50}} type={'primary'} onClick={createMessageHandler} disabled={isCreateMessageLoading} icon={<SendOutlined />} />
            </Flex>
        </Flex>
    )
}