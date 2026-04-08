// widgets/ChatWindow/ui/ChatWindow.tsx
import React, { useRef, useEffect, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { Flex, Spin } from 'antd';
import { RootStateType } from 'app/store/store';
import { TopMenu } from './TopMenu';
import { MessageInput } from './MessageInput';
import { AttachmentsList } from './AttachmentsList';
import VirtualMessageList, { VirtualMessageListRef } from './VirtualMessageList';
import { AttachmentModal } from 'features/chat/modals/AttachmentModal';
import { ScreenshotModal } from 'features/chat/modals/ScreenshotModal';
import { ScreenShareModal } from 'features/shareScreen/ui/ScreenShareModal';
import useChatMessages from '../model/useChatMessages';
import useMessageSending from '../model/useSendMessage';
import useAttachments from '../model/useAttachments';
import useVirtualHelper from '../model/useVirtulaHelper';
import useScreenshot from '../model/useScreenshot';

const ChatWindow = () => {
    // Store
    const selectedConversation = useSelector(
        (state: RootStateType) => state.currentUser.selectedConversation
    );
    const currentUser = useSelector((state: RootStateType) => state.currentUser.user);

    // Refs
    const virtualListRef = useRef<VirtualMessageListRef>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    // Hooks
    const { messages, loading, loadingMore, isFromCache, hasMore, loadMoreMessages } =
        useChatMessages(selectedConversation?.id);

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
        if (isContextDropped) {
            alert('Контекст сброшен');
        }
    }, [isContextDropped]);

    // Прокрутка вниз при отправке нового сообщения
    useEffect(() => {
        if (messages.length > 0) {
            virtualListRef.current?.scrollToBottom();
        }
    }, [messages.length]);

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

    const handleScrollToTop = useCallback(() => {
        if (hasMore && !loadingMore) {
            const oldScrollHeight =
                containerRef.current?.querySelector('.virtual-list-container')?.scrollHeight || 0;

            loadMoreMessages();

            // Сохраняем позицию скролла после загрузки
            setTimeout(() => {
                const newScrollHeight =
                    containerRef.current?.querySelector('.virtual-list-container')?.scrollHeight ||
                    0;
                const scrollContainer =
                    containerRef.current?.querySelector('.virtual-list-container');
                if (scrollContainer) {
                    scrollContainer.scrollTop = newScrollHeight - oldScrollHeight;
                }
            }, 100);
        }
    }, [hasMore, loadingMore, loadMoreMessages]);

    const allAttachments = [...messageAttachments, ...extraAttachments];

    if (loading && messages.length === 0) {
        return (
            <Flex justify="center" align="center" style={{ height: '100%' }}>
                <Spin tip="Загрузка сообщений..." />
            </Flex>
        );
    }

    return (
        <Flex
            ref={containerRef}
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

            {/* Виртуальный список сообщений */}
            <div style={{ flex: 1, overflow: 'hidden', position: 'relative' }}>
                <VirtualMessageList
                    ref={virtualListRef}
                    messages={messages}
                    currentUserId={currentUser?.id}
                    loading={loading}
                    onScrollToTop={handleScrollToTop}
                    hasMore={hasMore}
                    loadingMore={loadingMore}
                />

                {/* Индикатор "из кеша" */}
                {isFromCache && (
                    <div
                        style={{
                            position: 'absolute',
                            bottom: 10,
                            right: 10,
                            background: '#52c41a',
                            color: 'white',
                            padding: '4px 8px',
                            borderRadius: 4,
                            fontSize: 12,
                            zIndex: 1000,
                            opacity: 0.8,
                        }}
                    >
                        ⚡ Из кеша
                    </div>
                )}
            </div>

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

export default ChatWindow;
