import {host} from "../shared/config/constants";
import {createApi, fetchBaseQuery} from '@reduxjs/toolkit/query/react';
import {MessageModel} from "../entities/MessageModel";

export interface CreateMessageWithFilesRequest {
    conversation: number;
    text?: string;
    files?: File[];
}

export const messageAPI = createApi({
    reducerPath: 'messageAPI',
    baseQuery: fetchBaseQuery({
        baseUrl: `${host}/api`,
    }),
    tagTypes: ['message'],
    endpoints: (build) => ({
        create: build.mutation<MessageModel, MessageModel>({
            query: (body) => ({
                url: `/messages/`,
                method: 'POST',
                body
            }),
            invalidatesTags: ['message']
        }),
        createWithFiles: build.mutation<MessageModel, CreateMessageWithFilesRequest>({
            query: (data) => {
                // Создаем FormData для отправки файлов
                const formData = new FormData();
                formData.append('conversation', data.conversation.toString());

                if (data.text) {
                    formData.append('text', data.text);
                }

                // Добавляем файлы, если они есть
                if (data.files && data.files.length > 0) {
                    data.files.forEach((file, index) => {
                        formData.append('files', file);
                    });
                }

                return {
                    url: `/messages/`,
                    method: 'POST',
                    body: formData,
                    // Не устанавливаем Content-Type - браузер сделает это автоматически
                };
            },
            invalidatesTags: ['message']
        }),
    })
});
