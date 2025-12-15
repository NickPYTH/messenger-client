import {host} from "../shared/config/constants";
import {createApi, fetchBaseQuery} from '@reduxjs/toolkit/query/react';
import {ConversationModel} from "../entities/ConversationModel";
import {MessageModel} from "../entities/MessageModel";

export const conversationsAPI = createApi({
    reducerPath: 'conversationsAPI',
    baseQuery: fetchBaseQuery({
        baseUrl: `${host}/api`,
    }),
    tagTypes: ['conversations'],
    endpoints: (build) => ({
        getAll: build.query<ConversationModel[], void>({
            query: () => 'conversations',
            providesTags: ['conversations'],
        }),
        create: build.mutation<ConversationModel, {member_ids: number[]}>({
            query: (body) => ({
                url: `/conversations/`,
                method: 'POST',
                body
            }),
            invalidatesTags: ['conversations']
        }),
        getMessages: build.mutation<MessageModel[], number>({
            query: (id) => ({
                url: `/conversations/${id}/messages`,
                method: 'GET',
            }),
            invalidatesTags: ['conversations']
        }),
    })
});
