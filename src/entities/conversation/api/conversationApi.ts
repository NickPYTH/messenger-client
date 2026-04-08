import {createApi, fetchBaseQuery} from '@reduxjs/toolkit/query/react';
import { host } from 'shared/config/constants';
import { MessageModel } from '../../message';
import {ConversationModel} from "../model/types";

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
        get: build.mutation<ConversationModel, number>({
            query: (id) => ({
                url: `/conversations/${id}/`,
                method: 'GET',
            }),
            invalidatesTags: ['conversations'],
        }),
        create: build.mutation<ConversationModel, { member_ids: number[] }>({
            query: (body) => ({
                url: `/conversations/`,
                method: 'POST',
                body,
            }),
            invalidatesTags: ['conversations'],
        }),
        update: build.mutation<ConversationModel, ConversationModel>({
            query: (body) => ({
                url: `/conversations/${body.id}/`,
                method: 'PATCH',
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
        dropContext: build.mutation<void, number>({
            query: (id) => ({
                url: `/drop_context?id=${id}`,
                method: 'GET',
            }),
            invalidatesTags: ['conversations'],
        }),
    }),
});
