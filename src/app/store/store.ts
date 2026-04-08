import { combineReducers, configureStore } from '@reduxjs/toolkit';
import { conversationsAPI } from '../../entities/conversation/api/conversationApi';
import { userAPI } from '../../entities/user/api/userApi';
import generalSlice, { CurrentUserModelStateType } from './slice/GeneralSlice';
import { messageApi } from '../../entities/message/api/messageApi';
import { favoritesAPI } from '../../entities/favourites/api/favortiesApi';

export type RootStateType = {
    currentUser: CurrentUserModelStateType;
};

const rootReducer = combineReducers({
    currentUser: generalSlice,
    [userAPI.reducerPath]: userAPI.reducer,
    [conversationsAPI.reducerPath]: conversationsAPI.reducer,
    [messageApi.reducerPath]: messageApi.reducer,
    [favoritesAPI.reducerPath]: favoritesAPI.reducer,
});

export const setupStore = () => {
    return configureStore({
        reducer: rootReducer,
        middleware: (getDefaultMiddleware) =>
            getDefaultMiddleware()
                .concat(userAPI.middleware)
                .concat(conversationsAPI.middleware)
                .concat(messageApi.middleware)
                .concat(favoritesAPI.middleware),
    });
};

export type RootState = ReturnType<typeof rootReducer>;
export type AppStore = ReturnType<typeof setupStore>;
export type AppDispatch = AppStore['dispatch'];
