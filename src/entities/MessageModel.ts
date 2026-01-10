import { UserModel } from './UserModel';
import { AttachmentModel } from './AttachmentModel';

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
