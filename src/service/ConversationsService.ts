import {host} from "../shared/config/constants";
import {createApi, fetchBaseQuery} from '@reduxjs/toolkit/query/react';
import {ConversationModel} from "../entities/ConversationModel";

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
    })
});
