import { Badge, Button, Empty, Flex, Popover } from 'antd';
import { Message } from './Message';
import { useSelector } from 'react-redux';
import React, { useEffect, useRef, useState } from 'react';
import { DeleteOutlined, DesktopOutlined, EyeOutlined, PaperClipOutlined, SendOutlined } from '@ant-design/icons';
import TextArea from 'antd/es/input/TextArea';
import { AttachmentModal } from './AttachmentModal';
import { TopMenu } from './TopMenu/TopMenu';
import type { UploadFile } from 'antd/es/upload/interface';
import { useWebSocket } from 'app/WebSocketProvider/ui/WebSocketProvider';
import { RootStateType } from 'store/store';
import { MessageModel } from 'entities/MessageModel';
import { messageAPI } from 'service/MessageService';
import { conversationsAPI } from 'service/ConversationsService';
import { ScreenShareModal } from '../../../../ScreenShareModal';
import { ScreenshotModal } from './ScreenshotModal';

export const ChatWindow = () => {
    // Store
    const selectedConversation = useSelector((state: RootStateType) => state.currentUser.selectedConversation);
    const currentUser = useSelector((state: RootStateType) => state.currentUser.user);
    const { registerHandler } = useWebSocket();
    // -----

    // Refs
    const bottomRef = useRef<HTMLDivElement>(null);
    // -----

    // States
    const [text, setText] = useState<string>('');
    const [messages, setMessages] = useState<MessageModel[]>([]);
    const [visibleAttachmentModal, setVisibleAttachmentModal] = useState(false);
    const [visibleScreenShareModal, setVisibleScreenShareModal] = useState(false);
    const [visibleScreenshotModal, setVisibleScreenshotModal] = useState(false);
    const [attachments, setAttachments] = useState<UploadFile[]>([]);
    // -----

    // Web requests
    const [createMessage, { isSuccess: isCreateMessageSuccess, isLoading: isCreateMessageLoading }] =
        messageAPI.useCreateMutation();
    const [createMessageWithFiles, { isLoading: isCreateMessageWithFilesLoading }] =
        messageAPI.useCreateWithFilesMutation();
    const [getConversationMessages, { data: messagesFromRequest }] = conversationsAPI.useGetMessagesMutation();

    // -----

    // Computed
    const isLoading = isCreateMessageLoading || isCreateMessageWithFilesLoading;
    // -----

    // Effects
    useEffect(() => {
        if (selectedConversation) getConversationMessages(selectedConversation.id);
    }, [selectedConversation]);

    useEffect(() => {
        if (messagesFromRequest) {
            setMessages(messagesFromRequest);
            setTimeout(() => handleScrollToBottom(), 100);
        }
    }, [messagesFromRequest]);

    useEffect(() => {
        if (isCreateMessageSuccess) setText('');
    }, [isCreateMessageSuccess]);

    useEffect(() => {
        // Регистрируем обработчик для новых сообщений чата
        const addMessageHandler = registerHandler('message_created', (data) => {
            setMessages((prev) => {
                // Проверяем, нет ли уже такого сообщения
                const exists = prev.some((msg) => msg.id === data.entity?.id);
                return exists ? prev : [...prev, data.entity];
            });
            setTimeout(() => handleScrollToBottom(), 100);
        });
        // Удаляем обработчик при размонтировании компонента
        return addMessageHandler;
    }, [registerHandler]);

    useEffect(() => {
        // Регистрируем обработчик для измененных сообщений чата
        const updateMessageHandler = registerHandler('message_updated', (data) => {
            setMessages((prev) => {
                const message = data.entity as MessageModel;
                return prev.map((msg: MessageModel) => (msg.id === message.id ? message : msg));
            });
            setTimeout(() => handleScrollToBottom(), 100);
        });
        // Удаляем обработчик при размонтировании компонента
        return updateMessageHandler;
    }, [registerHandler]);

    useEffect(() => {
        // Регистрируем обработчик для сообщений чата
        const deleteMessageHandler = registerHandler('message_deleted', (data) => {
            setMessages((prev) => {
                return prev.filter((msg: MessageModel) => msg.id != data.entity?.id);
            });
            setTimeout(() => handleScrollToBottom(), 100);
        });
        return deleteMessageHandler;
    }, [registerHandler]);
    // -----

    // Handlers
    const changeTextHandler = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setText(e.target.value);
    };

    const createMessageHandler = async () => {
        if ((!text || text.trim() === '') && attachments.length === 0) {
            return;
        }

        if (!selectedConversation) {
            return;
        }

        try {
            if (attachments.length > 0) {
                // Отправляем сообщение с файлами
                const files = attachments.filter((att) => att.originFileObj).map((att) => att.originFileObj as File);
                console.log(attachments, files);
                await createMessageWithFiles({
                    conversation: selectedConversation.id,
                    text: text.trim() || undefined,
                    files: files.length > 0 ? files : undefined,
                }).unwrap();
            } else {
                // Отправляем только текстовое сообщение
                const message: MessageModel = {
                    conversation: selectedConversation.id,
                    text: text.trim(),
                };
                await createMessage(message).unwrap();
            }

            // Сбрасываем состояние
            setText('');
            setAttachments([]);
        } catch (error: unknown) {
            console.error('Ошибка отправки сообщения:', error);
        }
    };

    const handleScrollToBottom = () => {
        if (bottomRef.current) {
            bottomRef.current.scrollIntoView({
                behavior: 'smooth',
                block: 'end',
            });
        }
    };

    const handleFilesSelected = (files: UploadFile[]) => {
        setAttachments(files);
    };

    const handleRemoveAttachment = (uid: string) => {
        setAttachments((prev) => prev.filter((file) => file.uid !== uid));
    };

    const handlePreviewAttachment = (file: UploadFile) => {
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

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            createMessageHandler();
        }
    };

    const sendInviteLinkHandler = async (text: string) => {
        if (selectedConversation) {
            const message: MessageModel = {
                conversation: selectedConversation.id,
                text,
            };
            await createMessage(message).unwrap();
        }
    };

    const handleSendScreenshot = async (base64Data: string, fileName: string) => {
        try {
            if (!selectedConversation) {
                return;
            }

            // Конвертируем base64 в файл
            const byteCharacters = atob(base64Data);
            const byteNumbers = new Array(byteCharacters.length);

            for (let i = 0; i < byteCharacters.length; i++) {
                byteNumbers[i] = byteCharacters.charCodeAt(i);
            }

            const byteArray = new Uint8Array(byteNumbers);
            const blob = new Blob([byteArray], { type: 'image/png' });
            const file = new File([blob], fileName, { type: 'image/png' });

            // Добавляем файл в attachments
            const newAttachment: any = {
                uid: `screenshot-${Date.now()}`,
                name: fileName,
                status: 'done',
                originFileObj: file,
                size: byteArray.length,
                type: 'image/png',
            };

            setAttachments((prev) => [...prev, newAttachment]);

            // Фокусируемся на поле ввода
            setTimeout(() => {
                const textarea = document.querySelector('textarea');
                if (textarea) textarea.focus();
            }, 100);
        } catch (error) {
            console.error('Ошибка при обработке скриншота:', error);
        }
    };
    // -----

    return (
        <Flex
            style={{
                display: 'grid',
                gridTemplateRows: 'auto 1fr auto',
                height: '100vh',
                padding: '1vw',
                overflow: 'hidden',
                width: '68vw',
            }}
        >
            {visibleScreenShareModal && (
                <ScreenShareModal
                    visible={visibleScreenShareModal}
                    setVisible={setVisibleScreenShareModal}
                    sendInviteLinkHandler={sendInviteLinkHandler}
                />
            )}
            {visibleAttachmentModal && (
                <AttachmentModal
                    visible={visibleAttachmentModal}
                    onCancel={() => setVisibleAttachmentModal(false)}
                    onFilesSelected={handleFilesSelected}
                    existingFiles={attachments as UploadFile[]}
                />
            )}
            <ScreenshotModal
                visible={visibleScreenshotModal}
                setVisible={setVisibleScreenshotModal}
                onSendScreenshot={handleSendScreenshot}
            />

            <TopMenu setVisibleScreenShareModal={setVisibleScreenShareModal} />

            <Flex
                vertical
                style={{
                    overflowY: 'auto',
                    padding: '0px 0',
                }}
            >
                {messages.map((message, index) => (
                    <Message key={index} data={message} fromYou={message.sender?.id == currentUser?.id} />
                ))}
                {messages.length == 0 && <Empty style={{ marginTop: 50 }} description={'Сообщений пока нет...'} />}
                <div ref={bottomRef} style={{ height: '0px' }} />
            </Flex>

            <Flex
                vertical
                gap="small"
                style={{
                    padding: '10px 0',
                    borderTop: '1px solid #f0f0f0',
                }}
            >
                {attachments.length > 0 && (
                    <Flex
                        vertical
                        gap="small"
                        style={{
                            padding: '8px',
                            background: '#fafafa',
                            borderRadius: '8px',
                            border: '1px solid #d9d9d9',
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
                                        border: '1px solid #e8e8e8',
                                    }}
                                >
                                    <Flex align="center" gap="small">
                                        <PaperClipOutlined style={{ color: '#1890ff' }} />
                                        <span
                                            style={{
                                                fontSize: '12px',
                                                maxWidth: '200px',
                                                overflow: 'hidden',
                                                textOverflow: 'ellipsis',
                                                whiteSpace: 'nowrap',
                                            }}
                                        >
                                            {file.name}
                                        </span>
                                        <span style={{ fontSize: '11px', color: '#999' }}>
                                            {file.size && formatFileSize(file.size)}
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
                <Flex justify={'center'} align={'center'} gap={'small'} style={{ marginBottom: 5 }}>
                    <Badge count={attachments.length}>
                        <Popover content={'Добавить файлы'}>
                            <Button
                                onClick={() => setVisibleAttachmentModal(true)}
                                disabled={isLoading}
                                icon={<PaperClipOutlined />}
                            />
                        </Popover>
                    </Badge>
                    <Popover content={'Отправить снимок экрана'}>
                        <Button
                            style={{ width: 39 }}
                            onClick={() => setVisibleScreenshotModal(true)}
                            disabled={isLoading}
                            icon={<DesktopOutlined />}
                        />
                    </Popover>
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
                    <Button
                        type={'primary'}
                        onClick={createMessageHandler}
                        loading={isLoading}
                        disabled={(!text || text.trim() === '') && attachments.length === 0}
                        icon={<SendOutlined />}
                    />
                </Flex>
            </Flex>
        </Flex>
    );
};
