import { combineReducers, configureStore } from '@reduxjs/toolkit';
import generalSlice, { CurrentUserModelStateType } from './slice/GeneralSlice';
import { userAPI } from '../service/UserService';
import { conversationsAPI } from '../service/ConversationsService';
import { messageAPI } from '../service/MessageService';

export type RootStateType = {
    currentUser: CurrentUserModelStateType;
};

const rootReducer = combineReducers({
    currentUser: generalSlice,
    [userAPI.reducerPath]: userAPI.reducer,
    [conversationsAPI.reducerPath]: conversationsAPI.reducer,
    [messageAPI.reducerPath]: messageAPI.reducer,
});

export const setupStore = () => {
    return configureStore({
        reducer: rootReducer,
        middleware: (getDefaultMiddleware) =>
            getDefaultMiddleware()
                .concat(userAPI.middleware)
                .concat(conversationsAPI.middleware)
                .concat(messageAPI.middleware),
    });
};

export type RootState = ReturnType<typeof rootReducer>;
export type AppStore = ReturnType<typeof setupStore>;
export type AppDispatch = AppStore['dispatch'];
