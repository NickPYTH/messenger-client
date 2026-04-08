import {createSlice} from '@reduxjs/toolkit';
import {NotificationInstance} from 'antd/es/notification/interface';
import { ConversationModel } from 'entities/conversation';
import { UserModel } from 'entities/user';

export type CurrentUserModelStateType = {
    user: UserModel | null;
    notificationContextApi: NotificationInstance | null;
    selectedConversation: ConversationModel | null;
    conversations: ConversationModel[] | [];
};

const initialState: CurrentUserModelStateType = {
    user: null,
    notificationContextApi: null,
    selectedConversation: null,
    conversations: [],
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
        setConversations: (
            state,
            action: { type: string; payload: ConversationModel[] | [] }
        ) => {
            state.conversations = action.payload;
        },
    },
});

export const { setCurrentUser, setNotificationContextApi, setSelectedConversation, setConversations } =
    generalSlice.actions;

export default generalSlice.reducer;
