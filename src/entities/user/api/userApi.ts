import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { host } from 'shared/config/constants';
import {UserModel} from "../model/types";

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
        getAll: build.mutation<UserModel[], string>({
            query: (search) => ({
                url: `/users?search=${search}`,
                method: 'GET',
            }),
            invalidatesTags: ['user'],
        }),
    }),
});
