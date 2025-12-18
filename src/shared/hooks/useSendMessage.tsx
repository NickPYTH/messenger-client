// hooks/useSendMessage.ts
import { useState } from 'react';
import { message } from 'antd';
import { FileAttachment } from "../../entities/AttachmentModel";

export const useSendMessage = () => {
    const [createMessage, { isLoading }] = useCreateWithFilesMutation();
    const [error, setError] = useState<string | null>(null);

    const sendMessage = async (
        conversationId: number,
        text?: string,
        attachments?: FileAttachment[]
    ) => {
        try {
            setError(null);

            // Конвертируем FileAttachment[] в File[]
            const files = attachments
                ?.filter(att => att.originFileObj)
                .map(att => att.originFileObj as File);

            const result = await createMessage({
                conversation: conversationId,
                text,
                files,
            }).unwrap();

            message.success('Сообщение отправлено');
            return result;
        } catch (err: any) {
            console.error('Ошибка отправки сообщения:', err);

            const errorMessage =
                err.data?.detail ||
                err.data?.files?.[0] ||
                err.data?.text?.[0] ||
                'Ошибка при отправке сообщения';

            setError(errorMessage);
            message.error(errorMessage);
            throw err;
        }
    };

    return {
        sendMessage,
        isLoading,
        error,
    };
};

function useCreateWithFilesMutation(): [any, { isLoading: any; }] {
    throw new Error("Function not implemented.");
}
