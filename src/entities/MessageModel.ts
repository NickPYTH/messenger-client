import {UserModel} from "./UserModel";

export type MessageModel = {
    id?: number;
    conversation: number;
    sender?: UserModel;
    text: string;
    attachments?: any[];
    sent_at?: string;
    edited_at?: string;
    is_edited?: boolean;
}
