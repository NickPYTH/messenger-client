import { createSlice } from '@reduxjs/toolkit';
import { NotificationInstance } from 'antd/es/notification/interface';
import { UserModel } from '../../entities/UserModel';
import { MessageModel } from '../../entities/MessageModel';
import { ConversationModel } from '../../entities/ConversationModel';

export type CurrentUserModelStateType = {
    user: UserModel | null;
    notificationContextApi: NotificationInstance | null;
    selectedConversation: ConversationModel | null;
};

const initialState: CurrentUserModelStateType = {
    user: null,
    notificationContextApi: null,
    selectedConversation: null,
};

const generalSlice = createSlice({
    name: 'generalSlice',
    initialState,
    reducers: {
        setNotificationContextApi: (
            state,
            action: { type: string; payload: NotificationInstance }
        ) => {
            state.notificationContextApi = action.payload;
        },
        setCurrentUser: (state, action: { type: string; payload: UserModel }) => {
            state.user = action.payload;
        },
        setSelectedConversation: (
            state,
            action: { type: string; payload: ConversationModel | null }
        ) => {
            state.selectedConversation = action.payload;
        },
    },
});

export const { setCurrentUser, setNotificationContextApi, setSelectedConversation } =
    generalSlice.actions;

export default generalSlice.reducer;
