export type AttachmentModel = {
    id: number;
    file_name: string;
    file_size: number;
    mime_type: string;
    uploaded_at: string;
    file_url: string;
    download_url: string;
};

export interface CreateMessageDTO {
    conversation: number;
    text?: string;
    files?: File[];
}

export interface FileAttachment {
    uid: string;
    name: string;
    size: number;
    type: string;
    originFileObj?: File;
    status?: 'waiting' | 'done' | 'error' | 'uploading';
    percent?: number;
    url?: string;
    id?: number;
}
