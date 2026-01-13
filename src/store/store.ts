import { combineReducers, configureStore } from '@reduxjs/toolkit';
import { conversationsAPI } from 'service/ConversationsService';
import { userAPI } from 'service/UserService';
import generalSlice, { CurrentUserModelStateType } from './slice/GeneralSlice';
import { messageAPI } from '../service/MessageService';
import { favoritesAPI } from '../service/FavortiesService';

export type RootStateType = {
    currentUser: CurrentUserModelStateType;
};

const rootReducer = combineReducers({
    currentUser: generalSlice,
    [userAPI.reducerPath]: userAPI.reducer,
    [conversationsAPI.reducerPath]: conversationsAPI.reducer,
    [messageAPI.reducerPath]: messageAPI.reducer,
    [favoritesAPI.reducerPath]: favoritesAPI.reducer,
});

export const setupStore = () => {
    return configureStore({
        reducer: rootReducer,
        middleware: (getDefaultMiddleware) =>
            getDefaultMiddleware()
                .concat(userAPI.middleware)
                .concat(conversationsAPI.middleware)
                .concat(messageAPI.middleware)
                .concat(favoritesAPI.middleware),
    });
};

export type RootState = ReturnType<typeof rootReducer>;
export type AppStore = ReturnType<typeof setupStore>;
export type AppDispatch = AppStore['dispatch'];
