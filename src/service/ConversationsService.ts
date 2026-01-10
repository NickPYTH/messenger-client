import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { ConversationModel } from 'entities/ConversationModel';
import { MessageModel } from 'entities/MessageModel';
import { host } from 'shared/config/constants';

export const conversationsAPI = createApi({
    reducerPath: 'conversationsAPI',
    baseQuery: fetchBaseQuery({
        baseUrl: `${host}/messenger/api`,
    }),
    tagTypes: ['conversations'],
    endpoints: (build) => ({
        getAll: build.query<ConversationModel[], void>({
            query: () => 'conversations',
            providesTags: ['conversations'],
        }),
        create: build.mutation<ConversationModel, { member_ids: number[] }>({
            query: (body) => ({
                url: `/conversations/`,
                method: 'POST',
                body,
            }),
            invalidatesTags: ['conversations'],
        }),
        createGroup: build.mutation<ConversationModel, { member_ids: number[]; title: string }>({
            query: (body) => ({
                url: `/conversations/`,
                method: 'POST',
                body: { ...body, type: 'group' },
            }),
            invalidatesTags: ['conversations'],
        }),
        getMessages: build.mutation<MessageModel[], number>({
            query: (id) => ({
                url: `/conversations/${id}/messages`,
                method: 'GET',
            }),
            invalidatesTags: ['conversations'],
        }),
        delete: build.mutation<void, number>({
            query: (id) => ({
                url: `/conversations/${id}/`,
                method: 'DELETE',
            }),
            invalidatesTags: ['conversations'],
        }),
    }),
});
