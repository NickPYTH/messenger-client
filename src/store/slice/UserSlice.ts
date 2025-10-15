import {createSlice} from "@reduxjs/toolkit";
import {NotificationInstance} from "antd/es/notification/interface";
import { UserModel } from "../../entities/UserModel";

export type CurrentUserModelStateType = {
    user: UserModel | null,
    notificationContextApi: NotificationInstance | null
}

const initialState: CurrentUserModelStateType = {
    user: null,
    notificationContextApi: null
}

const userSlice = createSlice({
    name: 'userSlice',
    initialState,
    reducers: {
        setNotificationContextApi: (state, action: { type: string, payload: NotificationInstance }) => {
            state.notificationContextApi = action.payload;
        },
        setCurrentUser: (state, action: { type: string, payload: UserModel }) => {
            state.user = action.payload;
        }
    }
});

export const {setCurrentUser, setNotificationContextApi} = userSlice.actions;

export default userSlice.reducer;