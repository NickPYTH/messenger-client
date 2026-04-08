import { AttachmentModel } from "entities/attachment";
import { UserModel } from "entities/user";

export type MessageModel = {
    id?: number;
    conversation: number;
    sender?: UserModel;
    text: string;
    attachments?: AttachmentModel[];
    sent_at?: string;
    edited_at?: string;
    is_edited?: boolean;
};

export interface CreateMessageWithFilesRequest {
    conversation: number;
    text?: string;
    files?: File[];
}
