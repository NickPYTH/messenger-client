// widgets/ChatWindow/model/useMessageSending.ts
import { useState } from 'react';
import { messageApi, MessageModel } from 'entities/message';
import type { UploadFile } from 'antd/es/upload/interface';

const useSendMessage = (conversationId?: number) => {
    const [text, setText] = useState('');
    const [attachments, setAttachments] = useState<UploadFile[]>([]);

    const [
        createMessage,
        { isSuccess: isCreateMessageSuccess, isLoading: isCreateMessageLoading },
    ] = messageApi.useCreateMutation();
    const [createMessageWithFiles, { isLoading: isCreateMessageWithFilesLoading }] =
        messageApi.useCreateWithFilesMutation();

    const isLoading = isCreateMessageLoading || isCreateMessageWithFilesLoading;

    const sendMessage = async () => {
        if ((!text || text.trim() === '') && attachments.length === 0) return;
        if (!conversationId) return;

        try {
            if (attachments.length > 0) {
                const files = attachments
                    .filter((att) => att.originFileObj)
                    .map((att) => att.originFileObj as File);

                await createMessageWithFiles({
                    conversation: conversationId,
                    text: text.trim() || undefined,
                    files: files.length > 0 ? files : undefined,
                }).unwrap();
            } else {
                const message: MessageModel = {
                    conversation: conversationId,
                    text: text.trim(),
                };
                await createMessage(message).unwrap();
            }

            setText('');
            setAttachments([]);
        } catch (error) {
            console.error('Ошибка отправки сообщения:', error);
            throw error;
        }
    };

    const sendInviteLink = async (linkText: string) => {
        if (!conversationId) return;

        const message: MessageModel = {
            conversation: conversationId,
            text: linkText,
        };
        await createMessage(message).unwrap();
    };

    return {
        text,
        setText,
        attachments,
        setAttachments,
        sendMessage,
        sendInviteLink,
        isLoading,
        isCreateMessageSuccess,
    };
};

export default useSendMessage;
