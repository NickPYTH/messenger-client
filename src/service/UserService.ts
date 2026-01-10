import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { UserModel } from 'entities/UserModel';
import { host } from 'shared/config/constants';

export const userAPI = createApi({
    reducerPath: 'userAPI',
    baseQuery: fetchBaseQuery({
        baseUrl: `${host}/messenger/api`,
    }),
    tagTypes: ['user'],
    endpoints: (build) => ({
        getCurrent: build.query<UserModel, void>({
            query: () => 'me',
            providesTags: ['user'],
        }),
        getAll: build.query<UserModel[], void>({
            query: () => 'users',
            providesTags: ['user'],
        }),
    }),
});
