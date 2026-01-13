import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { host } from 'shared/config/constants';
import { FavoritesModel } from '../entities/FavoritesModel';

export const favoritesAPI = createApi({
    reducerPath: 'favoritesAPI',
    baseQuery: fetchBaseQuery({
        baseUrl: `${host}/messenger/api`,
    }),
    tagTypes: ['favorites'],
    endpoints: (build) => ({
        getAll: build.mutation<FavoritesModel[], void>({
            query: () => ({
                url: `/favorites/`,
                method: 'GET',
            }),
            invalidatesTags: ['favorites'],
        }),
        create: build.mutation<FavoritesModel, FavoritesModel>({
            query: (body) => ({
                url: `/favorites/`,
                method: 'POST',
                body,
            }),
            invalidatesTags: ['favorites'],
        }),
        delete: build.mutation<void, number>({
            query: (id) => ({
                url: `/favorites/${id}/`,
                method: 'DELETE',
            }),
            invalidatesTags: ['favorites'],
        }),
    }),
});
