import {combineReducers, configureStore} from "@reduxjs/toolkit";
import userSlice, {CurrentUserModelStateType} from "./slice/UserSlice";
import {userAPI} from "../service/UserService";
import {conversationsAPI} from "../service/ConversationsService";


export type RootStateType = {
     currentUser: CurrentUserModelStateType
};

const rootReducer = combineReducers({
    currentUser: userSlice,
    [userAPI.reducerPath]: userAPI.reducer,
    [conversationsAPI.reducerPath]: conversationsAPI.reducer,
})

export const setupStore = () => {
    return configureStore({
        reducer: rootReducer,
        middleware: (getDefaultMiddleware) =>
            getDefaultMiddleware()
            .concat(userAPI.middleware)
            .concat(conversationsAPI.middleware)
    })
}

export type RootState = ReturnType<typeof rootReducer>
export type AppStore = ReturnType<typeof setupStore>
export type AppDispatch = AppStore['dispatch']
