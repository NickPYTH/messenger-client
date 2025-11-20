import {host} from "../shared/config/constants";
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import {UserModel} from "../entities/UserModel";
export const userAPI = createApi({
    reducerPath: 'userAPI',
    baseQuery: fetchBaseQuery({
        baseUrl: `${host}/api`,
    }),
    tagTypes: ['user'],
    endpoints: (build) => ({
        getCurrent: build.query<UserModel, void>({
            query: () => 'me',
            providesTags: ['user'],
        }),
    })
});
