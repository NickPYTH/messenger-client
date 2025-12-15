import {host} from "../shared/config/constants";
import {createApi, fetchBaseQuery} from '@reduxjs/toolkit/query/react';
import {MessageModel} from "../entities/MessageModel";

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
    })
});
