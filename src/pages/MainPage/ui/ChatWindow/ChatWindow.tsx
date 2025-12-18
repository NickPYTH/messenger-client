import { Badge, Button, Divider, Empty, Flex, Input, Popconfirm, message as antdMessage } from "antd"
import { RootStateType } from "../../../../store/store";
import { Message } from "./Message";
import { useDispatch, useSelector } from "react-redux";
import { conversationsAPI } from "../../../../service/ConversationsService";
import { messageAPI } from "../../../../service/MessageService";
import { useEffect, useRef, useState } from "react";
import { MessageModel } from "../../../../entities/MessageModel";
import { useWebSocket } from "../../../../app/WebSocketProvider/ui/WebSocketProvider";
import { DeleteOutlined, FileAddOutlined, SendOutlined, PaperClipOutlined, EyeOutlined } from "@ant-design/icons";
import { setSelectedConversationId } from "../../../../store/slice/GeneralSlice";
import TextArea from "antd/es/input/TextArea";
import { AttachmentModal } from "./AttachmentModal";
import {FileAttachment} from "../../../../entities/AttachmentModel";


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
    const [visibleAttachmentModal, setVisibleAttachmentModal] = useState(false);
    const [attachments, setAttachments] = useState<FileAttachment[]>([]);
    // -----

    // Web requests
    const [createMessage, {
        isSuccess: isCreateMessageSuccess,
        isLoading: isCreateMessageLoading
    }] = messageAPI.useCreateMutation();

    const [createMessageWithFiles, {
        isLoading: isCreateMessageWithFilesLoading
    }] = messageAPI.useCreateWithFilesMutation();

    const [getConversationMessages, {
        data: messagesFromRequest,
    }] = conversationsAPI.useGetMessagesMutation();

    const [deleteConversation, {
        isSuccess: isDeleteConversationSuccess,
    }] = conversationsAPI.useDeleteMutation();
    // -----

    // Computed
    const isLoading = isCreateMessageLoading || isCreateMessageWithFilesLoading;
    // -----

    // Effects
    useEffect(() => {
        if (selectedConversationId)
            getConversationMessages(selectedConversationId);
    }, [selectedConversationId]);

    useEffect(() => {
        if (messagesFromRequest) {
            setMessages(messagesFromRequest);
            setTimeout(() => handleScrollToBottom(), 100);
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
    const changeTextHandler = (e: any) => {
        setText(e.target.value);
    };

    const createMessageHandler = async () => {
        if ((!text || text.trim() === '') && attachments.length === 0) {
            antdMessage.warning('Введите сообщение или прикрепите файл');
            return;
        }

        if (!selectedConversationId) {
            antdMessage.error('Выберите беседу');
            return;
        }

        try {
            if (attachments.length > 0) {
                // Отправляем сообщение с файлами
                const files = attachments
                    .filter(att => att.originFileObj)
                    .map(att => att.originFileObj as File);

                await createMessageWithFiles({
                    conversation: selectedConversationId,
                    text: text.trim() || undefined,
                    files: files.length > 0 ? files : undefined
                }).unwrap();

                // Успешная отправка с файлами
                antdMessage.success('Сообщение с файлами отправлено');
            } else {
                // Отправляем только текстовое сообщение
                let message: MessageModel = {
                    conversation: selectedConversationId,
                    text: text.trim()
                };
                await createMessage(message).unwrap();

                // Успешная отправка текста
                antdMessage.success('Сообщение отправлено');
            }

            // Сбрасываем состояние
            setText("");
            setAttachments([]);

        } catch (error: any) {
            console.error('Ошибка отправки сообщения:', error);

            // Показываем подробную ошибку
            const errorMessage =
                error.data?.detail ||
                error.data?.files?.[0] ||
                error.data?.text?.[0] ||
                'Ошибка при отправке сообщения';

            antdMessage.error(errorMessage);
        }
    };

    const handleScrollToBottom = () => {
        if (bottomRef.current) {
            //@ts-ignore
            bottomRef.current.scrollIntoView({
                behavior: 'smooth',
                block: 'end',
            });
        }
    };

    const deleteConversationHandler = () => {
        if (selectedConversationId)
            deleteConversation(selectedConversationId);
    };

    const handleFilesSelected = (files: FileAttachment[]) => {
        setAttachments(files);
    };

    const handleRemoveAttachment = (uid: string) => {
        setAttachments(prev => prev.filter(file => file.uid !== uid));
    };

    const handlePreviewAttachment = (file: FileAttachment) => {
        if (file.originFileObj) {
            const url = URL.createObjectURL(file.originFileObj);
            window.open(url, '_blank');
        }
    };

    const formatFileSize = (bytes: number) => {
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    };
    // -----

    // Удаление файла по нажатию клавиши Enter
    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            createMessageHandler();
        }
    };

    return (
        <Flex style={{
            display: 'grid',
            gridTemplateRows: 'auto 1fr auto', // Заголовок, сообщения, инпут
            height: '100vh',
            padding: 5,
            width: '90%',
            overflow: 'hidden'
        }}>
            {visibleAttachmentModal && (
                <AttachmentModal
                    visible={visibleAttachmentModal}
                    onCancel={() => setVisibleAttachmentModal(false)}
                    onFilesSelected={handleFilesSelected}
                    existingFiles={attachments}
                />
            )}

            {/* Заголовок с кнопкой удаления */}
            <div style={{ width: '100%', height: 49, marginBottom: 2 }}>
                <Flex vertical gap={'small'} justify={'space-between'} style={{ height: '100%' }}>
                    <Flex gap={'small'} align={'center'} justify={'end'} style={{ height: '100%' }}>
                        <Popconfirm
                            title={"Вы точно хотите удалить переписку?"}
                            okText={"Да"}
                            cancelText={"Отменить"}
                            onConfirm={deleteConversationHandler}
                        >
                            <Button type='primary' danger icon={<DeleteOutlined />}>
                                Удалить переписку
                            </Button>
                        </Popconfirm>
                    </Flex>
                </Flex>
                <Divider style={{ width: '100%', margin: 0 }} />
            </div>

            {/* Область сообщений */}
            <Flex
                vertical
                style={{
                    overflowY: 'auto',
                    padding: '10px 0'
                }}
            >
                {messages.map((message, index) => (
                    <Message
                        key={index}
                        data={message}
                        fromYou={message.sender?.id == currentUser?.id}
                    />
                ))}
                {messages.length == 0 && <Empty style={{ marginTop: 50 }} description={"Сообщений пока нет..."} />}
                <div ref={bottomRef} style={{ height: '0px' }} />
            </Flex>

            {/* Область ввода сообщения */}
            <Flex
                vertical
                gap="small"
                style={{
                    padding: '10px 0',
                    borderTop: '1px solid #f0f0f0'
                }}
            >
                {/* Список прикрепленных файлов */}
                {attachments.length > 0 && (
                    <Flex
                        vertical
                        gap="small"
                        style={{
                            padding: '8px',
                            background: '#fafafa',
                            borderRadius: '8px',
                            border: '1px solid #d9d9d9'
                        }}
                    >
                        <div style={{ fontSize: '12px', color: '#666' }}>
                            Прикрепленные файлы ({attachments.length}):
                        </div>
                        <Flex vertical gap="4px">
                            {attachments.map((file) => (
                                <Flex
                                    key={file.uid}
                                    justify="space-between"
                                    align="center"
                                    style={{
                                        padding: '4px 8px',
                                        background: '#fff',
                                        borderRadius: '4px',
                                        border: '1px solid #e8e8e8'
                                    }}
                                >
                                    <Flex align="center" gap="small">
                                        <PaperClipOutlined style={{ color: '#1890ff' }} />
                                        <span style={{
                                            fontSize: '12px',
                                            maxWidth: '200px',
                                            overflow: 'hidden',
                                            textOverflow: 'ellipsis',
                                            whiteSpace: 'nowrap'
                                        }}>
                                            {file.name}
                                        </span>
                                        <span style={{ fontSize: '11px', color: '#999' }}>
                                            {formatFileSize(file.size)}
                                        </span>
                                    </Flex>
                                    <Flex gap="4px">
                                        <Button
                                            type="text"
                                            size="small"
                                            icon={<EyeOutlined />}
                                            onClick={() => handlePreviewAttachment(file)}
                                            title="Предпросмотр"
                                        />
                                        <Button
                                            type="text"
                                            size="small"
                                            danger
                                            icon={<DeleteOutlined />}
                                            onClick={() => handleRemoveAttachment(file.uid)}
                                            title="Удалить"
                                        />
                                    </Flex>
                                </Flex>
                            ))}
                        </Flex>
                    </Flex>
                )}

                {/* Поле ввода и кнопки */}
                <Flex justify={'center'} align={'center'} gap={'small'}>
                    <TextArea
                        value={text}
                        onChange={changeTextHandler}
                        onPressEnter={handleKeyPress}
                        style={{ maxWidth: 600, width: '100%' }}
                        placeholder="Введите сообщение..."
                        allowClear
                        autoSize={{ minRows: 1, maxRows: 4 }}
                        disabled={isLoading}
                    />
                    <Badge count={attachments.length}>
                        <Button
                            style={{ height: 50, width: 50 }}
                            onClick={() => setVisibleAttachmentModal(true)}
                            disabled={isLoading}
                            icon={<FileAddOutlined />}
                        />
                    </Badge>
                    <Button
                        style={{ height: 50, width: 50 }}
                        type={'primary'}
                        onClick={createMessageHandler}
                        loading={isLoading}
                        disabled={(!text || text.trim() === '') && attachments.length === 0}
                        icon={<SendOutlined />}
                    />
                </Flex>
            </Flex>
        </Flex>
    )
}