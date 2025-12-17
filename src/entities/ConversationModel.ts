import {CONVERSATION_TYPE} from "../shared/config/constants";
import {UserModel} from "./UserModel";
import {MessageModel} from "./MessageModel";

export type ConversationModel = {
    id: number;
    type: CONVERSATION_TYPE;
    title: string;
    created_by: UserModel;
    created_at?: string;
    last_message_at?: string;
    last_message?: MessageModel;
}
