import React, { useRef, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { Empty, Flex } from 'antd';
import { RootStateType } from 'app/store/store';
import { TopMenu } from './TopMenu';
import { MessageInput } from './MessageInput';
import { AttachmentsList } from './AttachmentsList';
import { AttachmentModal } from 'features/chat/modals/AttachmentModal';
import { ScreenshotModal } from 'features/chat/modals/ScreenshotModal';
import { ScreenShareModal } from 'features/shareScreen/ui/ScreenShareModal';
import useChatMessages from '../model/useChatMessages';
import useMessageSending from '../model/useSendMessage';
import Message from './Message';
import useAttachments from '../model/useAttachments';
import useVirtualHelper from '../model/useVirtulaHelper';
import useScreenshot from '../model/useScreenshot';

export const ChatWindow = () => {
    // Store
    const selectedConversation = useSelector(
        (state: RootStateType) => state.currentUser.selectedConversation
    );
    const currentUser = useSelector((state: RootStateType) => state.currentUser.user);

    // Refs
    const bottomRef = useRef<HTMLDivElement>(null);

    // Hooks
    const { messages } = useChatMessages(selectedConversation?.id);
    const {
        text,
        setText,
        attachments: messageAttachments,
        setAttachments,
        sendMessage,
        sendInviteLink,
        isLoading,
    } = useMessageSending(selectedConversation?.id);

    const {
        attachments: extraAttachments,
        visibleModal: attachmentModalVisible,
        setVisibleModal: setAttachmentModalVisible,
        addAttachments,
        removeAttachment,
        clearAttachments,
        formatFileSize,
        previewAttachment,
    } = useAttachments();

    const { isVirtualHelper, dropContext, isContextDropped } = useVirtualHelper(
        selectedConversation?.id
    );

    const {
        visible: screenshotModalVisible,
        setVisible: setScreenshotModalVisible,
        handleSendScreenshot,
    } = useScreenshot();

    const [visibleScreenShareModal, setVisibleScreenShareModal] = React.useState(false);

    // Эффекты
    useEffect(() => {
        const scrollToBottom = () => {
            bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
        };
        scrollToBottom();
    }, [messages]);

    useEffect(() => {
        if (isContextDropped) {
            alert('Контекст сброшен');
        }
    }, [isContextDropped]);

    // Handlers
    const handleFilesSelected = (files: any[]) => {
        addAttachments(files);
        setAttachments((prev: any) => [...prev, ...files]);
        setAttachmentModalVisible(false);
    };

    const handleSendScreenshotWrapper = async (base64Data: string, fileName: string) => {
        const attachment = await handleSendScreenshot(base64Data, fileName);
        addAttachments([attachment]);
        setAttachments((prev: any) => [...prev, attachment]);
        setScreenshotModalVisible(false);

        // Фокусируемся на поле ввода
        setTimeout(() => {
            const textarea = document.querySelector('textarea');
            textarea?.focus();
        }, 100);
    };

    const handleSendMessage = async () => {
        await sendMessage();
        clearAttachments();
    };

    const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setText(e.target.value);
    };

    const allAttachments = [...messageAttachments, ...extraAttachments];

    return (
        <Flex
            style={{
                display: 'grid',
                gridTemplateRows: 'auto 1fr auto',
                height: '100vh',
                padding: '1vw',
                overflow: 'hidden',
                width: '100%',
            }}
        >
            {visibleScreenShareModal && (
                <ScreenShareModal
                    visible={visibleScreenShareModal}
                    setVisible={setVisibleScreenShareModal}
                    sendInviteLinkHandler={sendInviteLink}
                />
            )}

            {attachmentModalVisible && (
                <AttachmentModal
                    visible={attachmentModalVisible}
                    onCancel={() => setAttachmentModalVisible(false)}
                    onFilesSelected={handleFilesSelected}
                    existingFiles={allAttachments}
                />
            )}

            <ScreenshotModal
                visible={screenshotModalVisible}
                setVisible={setScreenshotModalVisible}
                onSendScreenshot={handleSendScreenshotWrapper}
            />

            <TopMenu
                setVisibleScreenShareModal={setVisibleScreenShareModal}
                isVirtualHelperConversation={isVirtualHelper}
            />

            <Flex
                vertical
                style={{
                    overflowY: 'auto',
                    padding: '0px 0',
                }}
            >
                {messages.map((message) => (
                    <Message
                        key={message.id}
                        data={message}
                        fromYou={message.sender?.id === currentUser?.id}
                    />
                ))}

                {messages.length === 0 && (
                    <Empty style={{ marginTop: 50 }} description="Сообщений пока нет..." />
                )}

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
                <AttachmentsList
                    attachments={allAttachments}
                    onRemove={removeAttachment}
                    onPreview={previewAttachment}
                    formatFileSize={formatFileSize}
                />

                <MessageInput
                    value={text}
                    onChange={handleTextChange}
                    onSend={handleSendMessage}
                    onAttach={() => setAttachmentModalVisible(true)}
                    onScreenshot={() => setScreenshotModalVisible(true)}
                    onDropContext={isVirtualHelper ? dropContext : undefined}
                    isLoading={isLoading}
                    attachmentsCount={allAttachments.length}
                    isVirtualHelper={isVirtualHelper}
                />
            </Flex>
        </Flex>
    );
};
