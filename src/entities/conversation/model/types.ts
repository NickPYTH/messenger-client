import { MessageModel } from "entities/message";
import { UserModel } from "entities/user";
import { CONVERSATION_TYPE } from "shared/config/constants";

export type ConversationModel = {
    id: number;
    type: CONVERSATION_TYPE;
    title: string;
    created_by: UserModel;
    created_at?: string;
    last_message_at?: string;
    last_message?: MessageModel;
    members?: any;
};

export type ConversationMemberModel = {
    id?: number;
    role: string;
    user: UserModel;

    deleted?: boolean;
}