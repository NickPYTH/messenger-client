import {createSlice} from "@reduxjs/toolkit";
import {NotificationInstance} from "antd/es/notification/interface";
import {UserModel} from "../../entities/UserModel";
import {MessageModel} from "../../entities/MessageModel";

export type CurrentUserModelStateType = {
    user: UserModel | null,
    notificationContextApi: NotificationInstance | null,
    selectedConversationId: number | null,
}

const initialState: CurrentUserModelStateType = {
    user: null,
    notificationContextApi: null,
    selectedConversationId: null,
}

const generalSlice = createSlice({
    name: 'generalSlice',
    initialState,
    reducers: {
        setNotificationContextApi: (state, action: { type: string, payload: NotificationInstance }) => {
            state.notificationContextApi = action.payload;
        },
        setCurrentUser: (state, action: { type: string, payload: UserModel }) => {
            state.user = action.payload;
        },
        setSelectedConversationId: (state, action: {type: string, payload: number | null}) => {
            state.selectedConversationId = action.payload;
        },
    }
});

export const {setCurrentUser,
    setNotificationContextApi,
    setSelectedConversationId,
} = generalSlice.actions;

export default generalSlice.reducer;
