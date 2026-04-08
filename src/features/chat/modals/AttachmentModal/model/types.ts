import type {UploadFile} from "antd/es/upload/interface";

export interface AttachmentModalProps {
    visible: boolean;
    onCancel: () => void;
    onFilesSelected: (files: UploadFile[]) => void;
    existingFiles?: UploadFile[];
}

export interface SupportedFormats {
    [key: string]: string[];
}
